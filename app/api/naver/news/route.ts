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

type RerankMode = "off" | "interest";
type ContentMode =
  | "default"
  | "early"
  | "data"
  | "life"
  | "conflict"
  | "forecast"
  | "global"
  | "structure"
  | "human"
  | "factcheck"
  | "ai";

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

function safeParseDate(dateString: string): Date | null {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getHostname(url: string): string {
  if (!url) return "";
  try {
    const hostname = new URL(url).hostname || "";
    return hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function normalizeTitleForDedupe(title: string): string {
  return (title || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeForSimilarity(text: string): string {
  return (text || "")
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    // 따옴표/괄호류 제거(기사 제목의 인용부호 변형에 강하게)
    .replace(/["'“”‘’(){}\[\]<>]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrlKey(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    const hostname = (u.hostname || "").replace(/^www\./i, "");
    // 쿼리/해시를 제거해 “같은 원문”으로 묶기
    return `${hostname}${u.pathname}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function charNgrams(text: string, n: number = 3): string[] {
  const s = normalizeForSimilarity(text).replace(/\s+/g, "");
  if (s.length === 0) return [];
  if (s.length <= n) return [s];
  const grams: string[] = [];
  for (let i = 0; i <= s.length - n; i++) {
    grams.push(s.slice(i, i + n));
  }
  return grams;
}

function jaccardSimilaritySet(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersect = 0;
  for (const x of a) {
    if (b.has(x)) intersect += 1;
  }
  const union = a.size + b.size - intersect;
  return union === 0 ? 0 : intersect / union;
}

function titleSimilarity(aTitle: string, bTitle: string): number {
  // 한국어/뉴스 제목 중복에는 문자 3-그램이 공백 토큰보다 훨씬 강함
  const aSet = new Set(charNgrams(aTitle, 3));
  const bSet = new Set(charNgrams(bTitle, 3));
  return jaccardSimilaritySet(aSet, bSet);
}

function dedupeSimilarNews(
  items: NaverNewsItem[],
  desiredCount: number,
  similarityThreshold: number = 0.6
): NaverNewsItem[] {
  const out: NaverNewsItem[] = [];
  const seenUrlKeys = new Set<string>();
  const keptTitleGramSets: Set<string>[] = [];

  for (const item of items) {
    if (out.length >= desiredCount) break;

    const urlKey = normalizeUrlKey(item.originallink || item.link);
    if (urlKey && seenUrlKeys.has(urlKey)) continue;

    const titleKey = normalizeTitleForDedupe(item.title);
    const gramSet = new Set(charNgrams(titleKey, 3));

    let isTooSimilar = false;
    for (const prevGramSet of keptTitleGramSets) {
      if (jaccardSimilaritySet(gramSet, prevGramSet) >= similarityThreshold) {
        isTooSimilar = true;
        break;
      }
    }
    if (isTooSimilar) continue;

    out.push(item);
    if (urlKey) seenUrlKeys.add(urlKey);
    keptTitleGramSets.push(gramSet);
  }

  return out;
}

function tokenizeQuery(query: string): string[] {
  return (query || "")
    .split(/\s+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

function countKeywordHits(text: string, keywords: string[]): number {
  if (!text || keywords.length === 0) return 0;
  const lower = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    if (!kw) continue;
    if (lower.includes(kw.toLowerCase())) hits += 1;
  }
  return hits;
}

function getModeKeywords(mode: ContentMode): string[] {
  switch (mode) {
    case "early":
      return ["단독", "최초", "처음", "첫", "첫 공개", "속보", "긴급", "전격", "급부상", "급증"];
    case "data":
      return ["통계", "지표", "데이터", "조사", "분석", "순위", "증가", "감소", "급등", "급락", "최고", "최저", "역대"];
    case "life":
      return ["물가", "가격", "월급", "연봉", "취업", "실업", "전세", "월세", "대출", "금리", "세금", "보험", "연금", "요금", "교육비"];
    case "conflict":
      return ["논란", "갈등", "충돌", "반발", "파업", "소송", "분쟁", "규제", "압박", "반대", "격돌"];
    case "forecast":
      return ["전망", "예상", "가능성", "변수", "리스크", "후폭풍", "시나리오", "파장", "영향", "전환점"];
    case "global":
      return ["관세", "환율", "원자재", "유가", "금리", "연준", "제재", "전쟁", "분쟁", "미국", "중국", "EU", "수출", "수입"];
    case "structure":
      return ["구조", "제도", "관행", "인센티브", "규제 설계", "정책", "시스템", "시장", "카르텔", "모델"];
    case "human":
      return ["현장", "인터뷰", "사례", "체험", "제보", "피해", "당사자", "목격", "증언"];
    case "factcheck":
      return ["팩트체크", "사실은", "오해", "바로잡", "진실", "거짓", "가짜뉴스", "논박"];
    case "ai":
      return ["AI", "인공지능", "딥페이크", "저작권", "데이터", "보안", "개인정보", "자동화", "로봇", "생성형"];
    case "default":
    default:
      return [];
  }
}

function computeInterestScore(item: NaverNewsItem, query: string, mode: ContentMode): number {
  // 목표: "대본/해석 소재로 쓰기 좋은 기사"에 약간 더 가중
  const now = Date.now();
  const published = safeParseDate(item.pubDate)?.getTime();
  const ageHours = published ? Math.max(0, (now - published) / (1000 * 60 * 60)) : 24 * 7;

  // 신선도(0~1): 0시간=1, 3일 이후는 0에 수렴 (최신 기사 우선)
  const freshness = clamp(1 - ageHours / (24 * 3), 0, 1);

  // 설명 길이(0~1): 너무 짧으면 소재가 빈약할 확률 ↑
  const descLen = (item.description || "").trim().length;
  const depth = clamp(descLen / 180, 0, 1);

  // 해석형/구조 설명형 키워드(0~1)
  const explainerKeywords = [
    "이유", "배경", "원인", "구조", "맥락", "전망", "분석", "해설", "정리", "핵심", "쟁점", "파장", "의미", "시사점",
    "리스크", "변수", "시나리오", "팩트", "데이터", "통계",
  ];
  const explainerHits = countKeywordHits(`${item.title} ${item.description}`, explainerKeywords);
  const explainer = clamp(explainerHits / 4, 0, 1);

  // 숫자/비교/순위 등 "구체성" 힌트(0~1)
  const hasNumber = /\d/.test(item.title) || /\d/.test(item.description);
  const specificity = hasNumber ? 1 : 0;

  // 쿼리 매칭(0~1): 검색어가 기사 텍스트에 얼마나 잘 반영되는지
  const qTokens = tokenizeQuery(query);
  const qHits = countKeywordHits(`${item.title} ${item.description}`, qTokens);
  const queryMatch = qTokens.length === 0 ? 0.5 : clamp(qHits / Math.max(1, Math.min(3, qTokens.length)), 0, 1);

  // 너무 짧은 제목 페널티
  const titleLen = (item.title || "").trim().length;
  const shortTitlePenalty = titleLen > 0 && titleLen < 10 ? 0.15 : 0;

  // 콘텐츠 모드 보너스(0~1)
  const modeKeywords = getModeKeywords(mode);
  const modeHits = modeKeywords.length
    ? countKeywordHits(`${item.title} ${item.description}`, modeKeywords)
    : 0;
  const modeBoost = mode === "default" ? 0 : clamp(modeHits / 3, 0, 1);

  // 데이터 모드는 숫자/지표가 없는 기사에 불리하게
  const modePenalty =
    mode === "data" && !hasNumber ? 0.15 : 0;

  // 가중치 합(0~1 근처)
  const score =
    0.50 * freshness + // 신선도 가중치 증가로 최신 기사 우선
    0.20 * depth +
    0.15 * explainer +
    0.08 * specificity +
    0.07 * queryMatch -
    shortTitlePenalty +
    // 모드가 선택되면 “해당 모드 키워드/신호”를 좀 더 우선
    (mode === "default" ? 0 : 0.15 * modeBoost) -
    modePenalty;

  return Math.round(score * 1000) / 1000;
}

function rerankByInterest(
  items: NaverNewsItem[],
  query: string,
  mode: ContentMode,
  desiredCount: number,
  domainLimit: number
): NaverNewsItem[] {
  const scored = items
    .map((item) => ({
      item,
      score: computeInterestScore(item, query, mode),
      titleKey: normalizeTitleForDedupe(item.title),
      titleGramSet: new Set(charNgrams(normalizeTitleForDedupe(item.title), 3)),
      urlKey: normalizeUrlKey(item.originallink || item.link),
      host: getHostname(item.originallink || item.link),
      modeHits: countKeywordHits(`${item.title} ${item.description}`, getModeKeywords(mode)),
    }))
    .sort((a, b) => b.score - a.score);

  const selected: NaverNewsItem[] = [];
  const seenTitles = new Set<string>();
  const seenUrlKeys = new Set<string>();
  const keptTitleGramSets: Set<string>[] = [];
  const domainCounts = new Map<string, number>();

  const canTake = (x: (typeof scored)[number]) => {
    if (x.urlKey && seenUrlKeys.has(x.urlKey)) return false;
    if (x.titleKey && seenTitles.has(x.titleKey)) return false;
    for (const prevGramSet of keptTitleGramSets) {
      if (jaccardSimilaritySet(x.titleGramSet, prevGramSet) >= 0.6) return false;
    }
    if (!x.host) return true;
    const count = domainCounts.get(x.host) || 0;
    return count < domainLimit;
  };

  // 모드가 선택되면 “모드 키워드가 있는 기사”를 먼저 채우고, 부족하면 일반 기사로 채움
  const modeFirst = mode !== "default";
  const primary = modeFirst ? scored.filter((x) => x.modeHits > 0) : scored;
  const secondary = modeFirst ? scored.filter((x) => x.modeHits === 0) : [];

  const pickFrom = (arr: typeof scored) => {
    for (const x of arr) {
      if (selected.length >= desiredCount) break;
      if (!canTake(x)) continue;
      selected.push(x.item);
      if (x.titleKey) seenTitles.add(x.titleKey);
      if (x.urlKey) seenUrlKeys.add(x.urlKey);
      keptTitleGramSets.push(x.titleGramSet);
      if (x.host) domainCounts.set(x.host, (domainCounts.get(x.host) || 0) + 1);
    }
  };

  pickFrom(primary);
  if (modeFirst && selected.length < desiredCount) pickFrom(secondary);

  // 제한 때문에 원하는 개수에 못 미치면, 도메인 제한을 풀고 채움(중복은 계속 방지)
  if (selected.length < desiredCount) {
    for (const x of scored) {
      if (selected.length >= desiredCount) break;
      if (x.urlKey && seenUrlKeys.has(x.urlKey)) continue;
      if (x.titleKey && seenTitles.has(x.titleKey)) continue;
      let isTooSimilar = false;
      for (const prevGramSet of keptTitleGramSets) {
        if (jaccardSimilaritySet(x.titleGramSet, prevGramSet) >= 0.6) {
          isTooSimilar = true;
          break;
        }
      }
      if (isTooSimilar) continue;
      selected.push(x.item);
      if (x.titleKey) seenTitles.add(x.titleKey);
      if (x.urlKey) seenUrlKeys.add(x.urlKey);
      keptTitleGramSets.push(x.titleGramSet);
    }
  }

  return selected;
}

/**
 * 네이버 뉴스 검색 API
 * 네이버 검색 API를 사용하여 뉴스를 검색합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    const display = clamp(parseInt(searchParams.get("display") || "10"), 1, 100);
    const sort = searchParams.get("sort") || "date"; // sim: 정확도순, date: 날짜순 (기본값을 날짜순으로 변경)
    const rerank = (searchParams.get("rerank") || "off") as RerankMode;
    const mode = (searchParams.get("mode") || "default") as ContentMode;
    const domainLimit = clamp(parseInt(searchParams.get("domainLimit") || "2"), 1, 10);

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
    // 중복 제거 후에도 display 개수를 최대한 채우기 위해 더 넉넉히 가져옵니다.
    // 최신 기사를 더 많이 가져오기 위해 display를 더 크게 설정
    const apiDisplay = clamp(display * 8, display, 100); // 6배 -> 8배로 증가
    const apiUrl = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&display=${apiDisplay}&sort=${sort}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Naver News] API Error (${response.status}):`, errorText);
      
      // Rate limit 등 특정 에러는 명확히 전달
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.errorCode === "012" || errorText.includes("Rate limit")) {
          return NextResponse.json(
            {
              error: "네이버 API 요청 한도 초과",
              message: "잠시 후 다시 시도해주세요. (Rate limit exceeded)",
              items: [],
              total: 0,
            },
            { status: 429 }
          );
        }
      } catch {
        // JSON 파싱 실패 시 그냥 진행
      }
      
      // API 실패 시 RSS 피드로 폴백
      return await fetchNewsFromRSS(query, display);
    }

    const data = await response.json();
    
    // 네이버 API 응답이 비어있거나 items가 없는 경우
    if (!data || !data.items || data.items.length === 0) {
      console.warn(`[Naver News] 검색어 "${query}"에 대한 결과가 없습니다.`);
      return NextResponse.json<NaverNewsResponse>({
        items: [],
        total: 0,
      });
    }
    
    // 네이버 API 응답 형식 변환
    let items: NaverNewsItem[] = (data.items || []).map((item: any) => {
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

    // 최신 기사 필터링: 오늘부터 최근 3일 이내의 기사만 포함 (더 넓은 범위로 설정)
    const now = Date.now();
    const threeDaysAgo = now - (3 * 24 * 60 * 60 * 1000); // 3일 전
    
    const filteredItems = items.filter((item) => {
      const published = safeParseDate(item.pubDate)?.getTime();
      if (!published) return false; // 날짜 파싱 실패 시 제외
      return published >= threeDaysAgo; // 최근 3일 이내만 포함
    });
    
    // 필터링된 결과가 충분하면 사용, 부족하면 원본 사용
    if (filteredItems.length >= display * 0.5) {
      // 필터링된 결과가 요청한 개수의 50% 이상이면 필터링된 결과 사용
      items = filteredItems;
      console.log(`[Naver News] 최신 기사 필터링: ${data.items.length}개 중 ${items.length}개만 최근 3일 이내`);
    } else {
      // 필터링된 결과가 부족하면 원본 사용 (하지만 날짜순 정렬은 유지)
      console.log(`[Naver News] 최신 기사 부족: ${filteredItems.length}개만 최근 3일 이내, 원본 ${items.length}개 사용`);
    }

    if (rerank === "interest") {
      // 흥미도 기준 재정렬 + 중복 제거 + 도메인 쏠림 완화
      items = rerankByInterest(items, query, mode, display, domainLimit);
    } else {
      // 기본(네이버 정렬)을 유지하면서도 “유사 기사” 중복은 제거
      items = dedupeSimilarNews(items, display);
    }

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
