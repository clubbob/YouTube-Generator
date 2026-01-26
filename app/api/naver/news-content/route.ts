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
    
    // 패턴 1: 네이버 뉴스 표준 본문 ID들 (더 많은 패턴 추가)
    const patterns = [
      // 네이버 뉴스 특화 패턴
      /<div[^>]*id="articleBodyContents"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="articleBody"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="_article_body_contents"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="newsEndBody"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="articleBodyContents"[^>]*>([\s\S]*?)<\/div>/i,
      // 클래스 기반 패턴
      /<div[^>]*class="[^"]*article_body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*articleBody[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*articleContent[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*news_end_body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article_view[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*go_trans _article_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*news_end_body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      // article/section 태그
      /<article[^>]*id="articleBody"[^>]*>([\s\S]*?)<\/article>/i,
      /<article[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/article>/i,
      /<section[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      // 네이버 뉴스 특화 추가 패턴
      /<div[^>]*class="[^"]*news_end_body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*id="newsEndBody"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*article_info[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
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
      
      // 마지막 시도: 본문처럼 보이는 긴 div 찾기 (더 넓은 범위)
      const allDivs = html.match(/<div[^>]*>([\s\S]{200,}?)<\/div>/gi);
      if (allDivs) {
        // 텍스트 길이로 정렬하여 가장 긴 div 찾기
        const divsWithText = allDivs.map(div => {
          const text = div.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
          return { div, text, length: text.length };
        }).filter(item => 
          item.length > 200 && 
          !item.text.includes("function") && 
          !item.text.includes("script") &&
          !item.text.includes("var ") &&
          !item.text.includes("document.") &&
          !item.text.includes("window.") &&
          item.text.match(/[가-힣]{10,}/) // 한글이 10자 이상 포함된 것만
        ).sort((a, b) => b.length - a.length);
        
        if (divsWithText.length > 0) {
          content = divsWithText[0].div;
          console.log("[News Content] Content found using fallback div search, length:", divsWithText[0].length);
        }
      }
    }
    
    // 여전히 찾지 못한 경우, p 태그들을 모아서 본문으로 사용
    if (!content || content.trim().length < 100) {
      const pTags = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
      if (pTags && pTags.length > 3) {
        const combinedText = pTags.map(p => {
          return p.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        }).filter(text => text.length > 20).join(" ");
        
        if (combinedText.length > 200) {
          content = pTags.join(" ");
          console.log("[News Content] Content found using p tags, combined length:", combinedText.length);
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
