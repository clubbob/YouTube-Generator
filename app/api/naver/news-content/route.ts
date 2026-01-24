import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 뉴스 기사 본문 추출 API
 * 뉴스 기사 링크에서 본문을 추출합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "URL이 필요합니다." },
        { status: 400 }
      );
    }

    console.log("[News Content] Fetching content from:", url);

    // 뉴스 기사 페이지 가져오기
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "뉴스 기사를 가져올 수 없습니다.", status: response.status },
        { status: response.status }
      );
    }

    const html = await response.text();
    
    // 간단한 HTML 파싱으로 본문 추출 시도
    // 네이버 뉴스의 경우 일반적으로 article 태그나 특정 클래스를 가진 div에 본문이 있습니다
    let content = "";
    
    // 네이버 뉴스 본문 추출 시도
    const naverMatch = html.match(/<div[^>]*id="articleBodyContents"[^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<div[^>]*class="[^"]*article_body[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                       html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    
    if (naverMatch && naverMatch[1]) {
      content = naverMatch[1];
    } else {
      // 일반적인 article 태그나 본문 클래스 찾기
      const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
                          html.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      
      if (articleMatch && articleMatch[1]) {
        content = articleMatch[1];
      } else {
        // 본문을 찾지 못한 경우 description 반환
        return NextResponse.json({
          content: "",
          error: "본문을 추출할 수 없습니다. 기사 링크를 직접 확인해주세요.",
        });
      }
    }

    // HTML 태그 제거 및 정리
    content = content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // 스크립트 제거
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "") // 스타일 제거
      .replace(/<[^>]+>/g, " ") // HTML 태그 제거
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ") // 연속된 공백 제거
      .trim();

    // 본문이 너무 짧으면 (100자 미만) 추출 실패로 간주
    if (content.length < 100) {
      return NextResponse.json({
        content: "",
        error: "본문을 추출할 수 없습니다. 기사 링크를 직접 확인해주세요.",
      });
    }

    console.log("[News Content] Content extracted, length:", content.length);

    return NextResponse.json({
      content,
      url,
    });
  } catch (error: any) {
    console.error("[News Content] Error:", error);
    return NextResponse.json(
      { error: "본문 추출 중 오류가 발생했습니다.", message: error.message },
      { status: 500 }
    );
  }
}
