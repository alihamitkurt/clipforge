import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "funny";
  const apiKey = process.env.VLIPSY_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Vlipsy API Key missing", fallback: true }, { status: 200 });
  }

  try {
    const response = await axios.get(`https://apiv2.vlipsy.com/v1/vlips/search`, {
      params: {
        q,
        limit: 12
      },
      headers: {
        "x-api-key": apiKey
      }
    });

    // Map Vlipsy results to a cleaner format
    const results = response.data.data.map((v: any) => ({
      id: v.id,
      title: v.title,
      url: v.media?.mp4?.url || v.media?.gif?.url,
      thumbnail: v.media?.poster?.url || v.thumbnail_url,
      source: "Vlipsy"
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Vlipsy API Error:", error.response?.data || error.message);
    return NextResponse.json({ error: "Vlipsy API failed", fallback: true }, { status: 200 });
  }
}
