import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface NaverNewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NaverNewsResponse {
  items: NaverNewsItem[];
  total: number;
}

/**
 * HTML 엔티티를 디코딩하는 함수
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=');
}

/**
 * 네이버 뉴스 검색 API
 * 네이버 검색 API를 사용하여 뉴스를 검색합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const display = parseInt(searchParams.get("display") || "10");
    const sort = searchParams.get("sort") || "sim"; // sim: 정확도순, date: 날짜순

    if (!query) {
      return NextResponse.json(
        { error: "검색어는 필수입니다." },
        { status: 400 }
      );
    }

    // 네이버 검색 API 사용
    // 환경 변수에서 네이버 API 키 가져오기
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[Naver News] NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is missing");
      // API 키가 없어도 RSS 피드를 사용하여 뉴스를 가져올 수 있습니다
      return await fetchNewsFromRSS(query, display);
    }

    // 네이버 검색 API 호출
    const apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${display}&sort=${sort}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Naver News] API Error:", errorText);
      // API 실패 시 RSS 피드로 폴백
      return await fetchNewsFromRSS(query, display);
    }

    const data = await response.json();
    
    // 네이버 API 응답 형식 변환
    const items: NaverNewsItem[] = (data.items || []).map((item: any) => {
      // HTML 태그 제거 후 HTML 엔티티 디코딩
      const title = item.title?.replace(/<[^>]*>/g, "") || "";
      const description = item.description?.replace(/<[^>]*>/g, "") || "";
      
      return {
        title: decodeHtmlEntities(title),
        originallink: item.originallink || "",
        link: item.link || "",
        description: decodeHtmlEntities(description),
        pubDate: item.pubDate || "",
      };
    });

    return NextResponse.json<NaverNewsResponse>({
      items,
      total: data.total || items.length,
    });
  } catch (error: any) {
    console.error("[Naver News] Error:", error.message);
    return NextResponse.json(
      {
        error: "뉴스를 가져오는 중 오류가 발생했습니다.",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * 네이버 뉴스 RSS 피드에서 뉴스 가져오기 (폴백)
 */
async function fetchNewsFromRSS(query: string, display: number = 10) {
  try {
    // 네이버 뉴스 RSS 피드 URL
    const rssUrl = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)}&sm=tab_jum&sort=1`;
    
    // RSS 피드는 직접 파싱하기 어려우므로, 간단한 메시지 반환
    // 실제로는 cheerio 같은 라이브러리를 사용하여 HTML을 파싱해야 합니다
    return NextResponse.json(
      {
        error: "네이버 API 키가 설정되지 않았습니다.",
        message: "환경 변수에 NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET을 설정해주세요.",
        items: [],
        total: 0,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "RSS 피드를 가져오는 중 오류가 발생했습니다.",
        message: error.message,
        items: [],
        total: 0,
      },
      { status: 500 }
    );
  }
}
