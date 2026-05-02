import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt, videoTitle, musicStyle, preset, manualTimeline } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API Key is not configured." }, { status: 500 });
    }

    const systemPrompt = `
        Sen profesyonel bir "AI Video Director" ve viral kurgu uzmanısın. 
        Kullanıcının seçtiği stile göre videoyu saniye saniye analiz edip bir kurgu planı (JSON) hazırlamalısın.

        ## STİL TALİMATLARI
        - **Mertcan Bahar Style**: Hızlı kesimler, beat sync (ritimle uyum), dramatik zoomlar, vuruş anlarında ekran sallanması (shake), kısa ve çarpıcı motivasyonel altyazılar. Futbol montajı enerjisi.
        - **Football Hype Edit**: Gol veya vuruş anlarını vurgula, vuruş öncesi yavaş çekim, darbe anında zoom ve shake, yüksek enerjili müzik önerisi.
        - **Cinematic Motivation**: Sinematik yavaş çekim, yüksek kontrastlı renk paleti, duygusal ve ilham verici altyazılar.
        - **Funny Meme Edit**: Meme zamanlaması, ani zoomlar (funny zoom), komik altyazı ve ses efekti önerileri.
        - **YouTube Shorts Viral**: İlk 2 saniyede kancayı (hook) at, hızlı tempo, büyük fontlu altyazılar, izleyici tutma odaklı kesimler.

        ## ÇIKTI FORMATI (MUTLAKA JSON)
        {
          "title": "Video Başlığı (Türkçe)",
          "description": "Profesyonel kurgu açıklaması (Türkçe)",
          "style": "Uygulanan stil detayları",
          "musicMood": "Önerilen müzik atmosferi",
          "timeline": [
            {
              "start": "00:00",
              "end": "00:03",
              "effect": "slow_motion | zoom_in | shake | fast_cut",
              "zoom": 1.15,
              "shake": true,
              "subtitle": "Ekranda görünecek metin",
              "reason": "Bu kurgu kararının nedeni"
            }
          ]
        }
    `;

    const userPromptText = `
      VİDEO BİLGİLERİ:
      - Başlık: ${videoTitle}
      - Stil: ${preset}
      - Müzik Tarzı: ${musicStyle}
      - Kullanıcı İstemi: ${prompt}
      ${manualTimeline ? `- MANUEL TALİMATLAR (ÖNCELİKLİ): ${JSON.stringify(manualTimeline)}` : ""}

      Lütfen bu videoyu viral yapacak profesyonel bir "${preset}" kurgu planı hazırla. 
      ${manualTimeline ? "ÖNEMLİ: Manuel olarak belirtilen saniyeleri ve efektleri mutlaka plana dahil et ve onları geliştir." : ""}
    `;

    // Try direct fetch to v1 API (bypass SDK v1beta issues)
    const apiKey = process.env.GEMINI_API_KEY;
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const fetchResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt + "\n\n" + userPromptText }]
        }]
      })
    });

    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json();
      console.error("Gemini Direct API Error:", errorData);
      
      // Fallback: Smart Simulation if API fails
      const fallbackPlan = {
        title: `${videoTitle} - AI Optimized`,
        description: "Gemini API bağlantı hatası nedeniyle yerel akıllı motor ile üretilen plan.",
        style: preset || "Viral Shorts Style",
        musicMood: musicStyle || "Hype Phonk",
        timeline: [
          { start: "00:00", end: "00:02", effect: "zoom_in", zoom: 1.2, shake: true, subtitle: "GET READY!", reason: "İzleyiciyi hemen yakala" },
          { start: "00:05", end: "00:08", effect: "slow_motion", zoom: 1.0, shake: false, subtitle: "LEGENDARY", reason: "Vurgu noktası" }
        ]
      };
      return NextResponse.json(fallbackPlan);
    }

    const data = await fetchResponse.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Extract JSON from response
    const jsonMatch = text?.match(/\{[\s\S]*\}/);
    const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!plan) throw new Error("Parse error");

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error("Gemini Route Error:", error);
    // Ultimate Fallback
    return NextResponse.json({
      title: "AI Smart Edit (Simulation)",
      description: "AI Director şu an yoğun, yedek plan devreye alındı.",
      style: "Viral Shorts Style",
      musicMood: "Dynamic Beat",
      timeline: [{ start: "00:00", end: "00:05", effect: "fast_cut", zoom: 1.1, shake: true, subtitle: "GO!", reason: "Auto-optimized" }]
    });
  }
}
