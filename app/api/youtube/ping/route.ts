import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.YOUTUBE_API_KEY;

  if (!key) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is missing" },
      { status: 500 }
    );
  }

  const url =
    "https://www.googleapis.com/youtube/v3/search" +
    "?part=snippet&q=test&maxResults=1&key=" +
    key;

  console.log("[YouTube Ping] API URL:", url);
  console.log("[YouTube Ping] API Key (first 10 chars):", key.substring(0, 10) + "...");

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("[YouTube Ping] HTTP Status:", res.status);
    console.log("[YouTube Ping] Response OK:", res.ok);
    
    if (data.error) {
      console.error("[YouTube Ping] API Error:", JSON.stringify(data.error, null, 2));
    } else {
      console.log("[YouTube Ping] Success - Items count:", data.items?.length || 0);
    }

    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      data,
    });
  } catch (error: any) {
    console.error("[YouTube Ping] Fetch Error:", error.message);
    return NextResponse.json(
      {
        ok: false,
        status: 500,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
