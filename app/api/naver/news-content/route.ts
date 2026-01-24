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
    
    // 네이버 뉴스 본문 추출 - 다양한 패턴 시도
    let content = "";
    
    // 패턴 1: 네이버 뉴스 표준 본문 ID들
    const patterns = [
      /<div[^>]*id="articleBodyContents"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="articleBody"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="_article_body_contents"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article_body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*articleBody[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*articleContent[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<article[^>]*id="articleBody"[^>]*>([\s\S]*?)<\/article>/i,
      /<article[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
      /<section[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*class="[^"]*news_end_body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article_view[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].trim().length > 100) {
        content = match[1];
        console.log("[News Content] Content found using pattern:", pattern.toString().substring(0, 50));
        break;
      }
    }
    
    // 패턴으로 찾지 못한 경우, 더 넓은 범위로 시도
    if (!content || content.trim().length < 100) {
      // article 태그 전체 시도 (더 긴 내용)
      const articleMatches = html.match(/<article[^>]*>([\s\S]{500,}?)<\/article>/i);
      if (articleMatches && articleMatches[1]) {
        content = articleMatches[1];
        console.log("[News Content] Content found using broad article tag");
      }
    }
    
    if (!content || content.trim().length < 100) {
      console.warn("[News Content] Failed to extract content. HTML length:", html.length);
      console.warn("[News Content] Trying to find any div with substantial content...");
      
      // 마지막 시도: 본문처럼 보이는 긴 div 찾기
      const allDivs = html.match(/<div[^>]*>([\s\S]{300,}?)<\/div>/gi);
      if (allDivs) {
        for (const div of allDivs) {
          const text = div.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          if (text.length > 200 && !text.includes("function") && !text.includes("script")) {
            content = div;
            console.log("[News Content] Content found using fallback div search");
            break;
          }
        }
      }
    }
    
    if (!content || content.trim().length < 100) {
      return NextResponse.json({
        content: "",
        error: "본문을 추출할 수 없습니다. 기사 링크를 직접 확인해주세요.",
        debug: {
          htmlLength: html.length,
          url: url,
        },
      });
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
