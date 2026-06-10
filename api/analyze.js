export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { imageBase64, platform } = req.body;

  const platformConfigs = {
    etsy:      { label: "Etsy",      titleMax: 140, descMax: 2000 },
    trendyol:  { label: "Trendyol",  titleMax: 100, descMax: 1500 },
    amazon:    { label: "Amazon",    titleMax: 200, descMax: 2000 },
    instagram: { label: "Instagram", titleMax: 60,  descMax: 2200 },
  };

  const cfg = platformConfigs[platform] || platformConfigs.etsy;

  const prompt = `Sen bir kuyumculuk e-ticaret SEO uzmanısın. Bu kolye görseli için ${cfg.label} platformuna özel içerik üret.

SADECE JSON döndür, başka hiçbir şey yazma, markdown kullanma:

{
  "urun_adi": "Türkçe, SEO odaklı, max ${cfg.titleMax} karakter ürün başlığı",
  "aciklama": "Türkçe, ${cfg.label} için optimize, max ${cfg.descMax} karakter açıklama",
  "resim_adi": "seo-dosya-adi.jpg",
  "video_adi": "YouTube için SEO başlığı",
  "etiketler": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],
  "kisa_aciklama": "150 karakterlik sosyal medya özeti"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: "image/jpeg", data: imageBase64 } },
                { text: prompt },
              ],
            },
          ],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API ${response.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const blocked = data.candidates?.[0]?.finishReason;
    if (blocked && blocked !== "STOP") {
      throw new Error(`Model yanıt vermedi (sebep: ${blocked}). Görseli değiştirip tekrar deneyin.`);
    }

    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = (fenced ? fenced[1] : raw).trim();
    const jsonMatch = candidate.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Model JSON döndürmedi. Görseli değiştirip tekrar deneyin.");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Model eksik JSON üretti. Tekrar deneyin.");
    }

    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: "Analiz başarısız: " + err.message });
  }
}
