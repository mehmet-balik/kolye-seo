const PLATFORM_CONFIGS = {
  etsy:      { label: "Etsy",      titleMax: 140, descMax: 2000 },
  trendyol:  { label: "Trendyol",  titleMax: 100, descMax: 1500 },
  amazon:    { label: "Amazon",    titleMax: 200, descMax: 2000 },
  instagram: { label: "Instagram", titleMax: 60,  descMax: 2200 },
  shopier:   { label: "Shopier",   titleMax: 200, descMax: 5000 },
};

function buildPrompt(platform, cfg) {
  const hints = {
    etsy: `Etsy kuralları: "etiketler" tam 13 öğe, her biri max 20 karakter, boşluksuz/virgülsüz. "malzemeler" Etsy arama filtresi için kritik: metal (14k gold, 925 sterling silver, rose gold vb.), taş, ip tipi. "hediye_uygunlugu" alanında "gift for her", "birthday gift", "anniversary" gibi Etsy hediye arama terimleri geçsin.`,
    trendyol: `Trendyol kuralları: "one_cikan_ozellikler" 5 kısa madde, her biri max 80 karakter. Türk müşteri beklentisi: uygun fiyat, hızlı kargo, hediye paketi, iade kolaylığı. Marka adı başlığa eklenebilir, uydurma.`,
    amazon: `Amazon kuralları: Başlık formülü: [Marka] + [Ana Özellik/Malzeme] + [Ürün Tipi] + [Hedef Kitle/Kullanım]. "one_cikan_ozellikler" 5 madde, her biri max 200 karakter, BÜYÜK HARF başlayan kısa cümleler. "search_terms" Amazon'un gizli backend keyword alanı: 250 byte sınırı, virgülle ayrılmış, başlıkta geçmeyen kelimeler.`,
    instagram: `Instagram kuralları: "hashtag_gruplari" erişime göre 3 grup: 1M+ (geniş), 100K-1M (orta), niş/uzun kuyruk. "reel_script" 30 saniye için 5 sahne, her sahnede 'Sahne N | Görselde: ... | Üstte: ... | Ses: ...' formatında. "post_caption" ve "story_text" emoji içersin.`,
    shopier: `Shopier kuralları: Butik/küçük işletme tonu kullan — samimi, kişisel, sahibinden gibi. "aciklama" uzun ve hikaye anlatımı ağırlıklı olabilir (5000 karakter sınırı). "one_cikan_ozellikler" 4-5 kısa madde. "kargo_paket" alanında ücretsiz kargo, aynı gün kargo, hediye paketi gibi Türk müşteri beklentilerini vurgula. "hediye_uygunlugu" detaylı yaz (sevgililer günü, anneler günü, doğum günü, yılbaşı Türkiye'de çok önemli). "etiketler" 8-12 adet, Türkçe ağırlıklı.`
  };
  const hint = hints[platform] || hints.etsy;

  return `Sen bir kuyumculuk e-ticaret SEO ve satış uzmanısın. Amacın: Bu kolye için dönüşüm odaklı (sales-converting), SEO uyumlu, ${cfg.label} platformunda hazır kullanılabilir içerik üretmek.

GÖRSEL ODAĞI — ÇOK ÖNEMLİ:
Görselde bir kolye var. Kolye bir manken, model, insan boynu, stand veya herhangi bir yüzey üzerinde olabilir. SEN YALNIZCA KOLYEYE ODAKLAN:
- Mankenin/modelin yüzünü, cildini, saçını, kıyafetini, vücudunu veya arka planı AÇIKLAMA, görmezden gel.
- Yalnızca kolyenin kendisini tanımla: zincir tipi, pendant/kolye ucu, taşlar, malzeme, renk, uzunluk hissi, stil (minimalist, vintage, statement, doğal taşlı, altın/gümüş/rose gold, layer, choker, princess, matinee vb.).
- Eğer kolyeyi net göremiyorsan, gördüğün en iyi detaylara göre en yakın tahminini yaz.

HEDEF PLATFORM: ${cfg.label}
${hint}

Aşağıdaki JSON formatında eksiksiz içerik üret. SADECE JSON döndür, başka hiçbir şey yazma, markdown kullanma:

{
  "urun_adi": "Max ${cfg.titleMax} karakter, SEO odaklı, anahtar kelime öne çıkan başlık",
  "alternatif_basliklar": ["A/B test için 4 farklı başlık varyasyonu"],
  "aciklama": "Max ${cfg.descMax} karakter, hikaye anlatımı + özellikler + duygusal satış + CTA içeren zengin açıklama, paragraflar \\n ile ayrılmış",
  "kisa_aciklama": "Sosyal medya için 150 karakter özet",
  "seo_meta_title": "Google için max 60 karakter meta title",
  "seo_meta_description": "Google için max 155 karakter meta description",
  "resim_adi": "URL dostu SEO dosya adı, .jpg uzantılı, küçük harfle, tire ile",
  "video_adi": "YouTube için SEO optimize video başlığı",
  "reel_script": "30 saniyelik Reels/Shorts/TikTok için 5 sahneli senaryo: her sahne 'Sahne N | Görselde: ... | Üstte: ... | Ses: ...' formatında",
  "post_caption": "Instagram post için emoji'li, etkili caption",
  "story_text": "Instagram story için kısa emoji'li metin + sticker/anket önerisi",
  "dm_sablon": "Müşteri DM'ine ilk otomatik yanıt şablonu (fiyat, kargo, stok)",
  "etiketler": ["platforma uygun etiketler (Etsy 13×20kr, Trendyol 8-12, diğerleri 5-10)"],
  "malzemeler": ["metal, taş, ip — her malzeme ayrı öğe"],
  "tas_turu": "varsa taş ismi veya 'yok'",
  "renkler": ["kolyede görünen renkler"],
  "tarz": "minimalist / vintage / klasik / bohem / statement / dainty / modern / rustik / romantik",
  "kisinin_stili": "Bu kolye hangi tarz/stil kadın veya erkek için uygun (örn: şık, günlük, iş, gece, özel gün)",
  "uzunluk": "choker (35-40cm) / princess (45cm) / matinee (50-60cm) / opera (70-80cm) / rope (85cm+) / belirsiz",
  "one_cikan_ozellikler": ["5 madde, her biri tek cümle, özellik odaklı"],
  "kategori": "Platform için en uygun kategori ağacı",
  "hediye_uygunlugu": "Kimler için hediye + hangi özel günler",
  "hediye_mesajlari": ["Hediye kartına yazılabilecek 3 duygusal kısa mesaj"],
  "bakim_talimatlari": "Bu tür kolye için 3-4 maddelik bakım önerisi (su, parfüm, saklama vb.)",
  "kargo_paket": "Kargo ve paketleme: kutu, hediye paketi, garanti, fatura, kargo süresi",
  "sss": [
    {"soru": "En sık 1. soru", "cevap": "Kısa net yanıt"},
    {"soru": "En sık 2. soru", "cevap": "Kısa net yanıt"},
    {"soru": "En sık 3. soru", "cevap": "Kısa net yanıt"},
    {"soru": "En sık 4. soru", "cevap": "Kısa net yanıt"}
  ],
  "hashtag_gruplari": {
    "genis": ["#1M+ erişimli 3 hashtag"],
    "orta": ["#100K-1M erişimli 3 hashtag"],
    "nis": ["#niş/uzun kuyruk 3 hashtag"]
  },
  "search_terms": "Platforma uygun gizli/arama terimleri (Amazon için backend, Etsy için ek tagler)",
  "cta_secenekleri": ["3 farklı harekete geçirici mesaj"],
  "duygusal_satis_metni": "Bu kolyeyi neden almalıyım sorusuna 2-3 cümlelik duygusal yanıt"
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 3500 },
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
        max_tokens: 3500,
        response_format: { type: "json_object" },
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
  const prompt = buildPrompt(platform, cfg);

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
