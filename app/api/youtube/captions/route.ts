import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const videoId = searchParams.get("videoId");
    const lang = searchParams.get("lang") || "ko"; // 기본값: 한국어

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId는 필수입니다." },
        { status: 400 }
      );
    }

    // YouTube 자막 URL (공개 자막)
    // 여러 언어를 시도: 한국어 -> 영어 -> 자동 생성
    const languages = [lang, "en", "en-US"];
    let captions = null;
    let usedLang = "";

    for (const tryLang of languages) {
      try {
        // 여러 형식 시도: srv3, srv1, ttml, vtt
        const formats = ['srv3', 'srv1', 'ttml', 'vtt'];
        for (const fmt of formats) {
          try {
            const captionUrl = `https://www.youtube.com/api/timedtext?lang=${tryLang}&v=${videoId}&fmt=${fmt}`;
            const response = await fetch(captionUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8',
              },
            });

            if (response.ok) {
              const text = await response.text();
              if (text && text.trim().length > 0 && !text.includes('transcript not available')) {
                captions = text;
                usedLang = tryLang;
                break;
              }
            }
          } catch (e) {
            continue;
          }
        }
        if (captions) break;
      } catch (e) {
        // 다음 언어 시도
        continue;
      }
    }

    if (!captions) {
      // 자동 생성 자막 시도
      try {
        const autoUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=srv3&asr_langs=ko,en`;
        const response = await fetch(autoUrl);
        if (response.ok) {
          const text = await response.text();
          if (text && text.trim().length > 0) {
            captions = text;
            usedLang = "auto";
          }
        }
      } catch (e) {
        // 자막 없음
      }
    }

    if (!captions) {
      return NextResponse.json(
        { error: "자막을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // XML 파싱하여 텍스트만 추출
    const parsedCaptions = parseCaptions(captions);
    
    // 전체 스크립트 텍스트 생성
    const fullScript = parsedCaptions.map(c => c.text).join(' ');

    return NextResponse.json({
      captions: parsedCaptions,
      script: fullScript, // 전체 스크립트 텍스트
      language: usedLang,
      raw: captions,
    });
  } catch (error: any) {
    console.error("[Captions API] Error:", error.message);
    return NextResponse.json(
      {
        error: "자막을 가져오는 중 오류가 발생했습니다.",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * YouTube 자막 XML 파싱
 */
function parseCaptions(xml: string): Array<{ start: number; duration: number; text: string }> {
  const results: Array<{ start: number; duration: number; text: string }> = [];
  
  try {
    // XML 파싱 (간단한 정규식 방식)
    const textRegex = /<text start="([\d.]+)" dur="([\d.]+)">(.*?)<\/text>/g;
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
      const start = parseFloat(match[1]);
      const duration = parseFloat(match[2]);
      let text = match[3]
        .replace(/<[^>]+>/g, "") // HTML 태그 제거
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (text) {
        results.push({ start, duration, text });
      }
    }
  } catch (e) {
    console.error("[Captions] Parse error:", e);
  }

  return results;
}
