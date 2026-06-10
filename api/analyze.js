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

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    res.status(500).json({ error: "Analiz başarısız: " + err.message });
  }
}
