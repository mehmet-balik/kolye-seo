const PLATFORM_CONFIGS = {
  etsy:      { label: "Etsy",      titleMax: 140, descMax: 2000 },
  trendyol:  { label: "Trendyol",  titleMax: 100, descMax: 1500 },
  amazon:    { label: "Amazon",    titleMax: 200, descMax: 2000 },
  instagram: { label: "Instagram", titleMax: 60,  descMax: 2200 },
};

function buildPrompt(cfg) {
  return `Sen bir kuyumculuk e-ticaret SEO uzmanısın. Bu kolye görseli için ${cfg.label} platformuna özel içerik üret.

SADECE JSON döndür, başka hiçbir şey yazma, markdown kullanma:

{
  "urun_adi": "Türkçe, SEO odaklı, max ${cfg.titleMax} karakter ürün başlığı",
  "aciklama": "Türkçe, ${cfg.label} için optimize, max ${cfg.descMax} karakter açıklama",
  "resim_adi": "seo-dosya-adi.jpg",
  "video_adi": "YouTube için SEO başlığı",
  "etiketler": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],
  "kisa_aciklama": "150 karakterlik sosyal medya özeti"
}`;
}

function extractJson(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();
  const match = candidate.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

async function callGemini(imageBase64, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
            { text: prompt },
          ],
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (candidate?.finishReason && candidate.finishReason !== "STOP") {
    throw new Error(`Gemini yanıt vermedi (${candidate.finishReason})`);
  }

  const text = candidate?.content?.parts?.[0]?.text || "";
  const json = extractJson(text);
  if (!json) throw new Error("Gemini JSON döndürmedi");
  return JSON.parse(json);
}

async function callGroq(imageBase64, prompt) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
        ],
      }],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Groq ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  const json = extractJson(text);
  if (!json) throw new Error("Groq JSON döndürmedi");
  return JSON.parse(json);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, platform } = req.body;
  const cfg = PLATFORM_CONFIGS[platform] || PLATFORM_CONFIGS.etsy;
  const prompt = buildPrompt(cfg);

  const errors = [];

  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await callGemini(imageBase64, prompt);
      return res.status(200).json(result);
    } catch (err) {
      errors.push(err.message);
    }
  }

  if (process.env.GROQ_API_KEY) {
    try {
      const result = await callGroq(imageBase64, prompt);
      return res.status(200).json(result);
    } catch (err) {
      errors.push(err.message);
    }
  }

  res.status(500).json({
    error: "Tüm sağlayıcılar başarısız: " + errors.join(" | "),
  });
}
