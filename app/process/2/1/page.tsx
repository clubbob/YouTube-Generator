"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";

interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
  category?: string; // 카테고리 정보
}

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

const CONTENT_MODE_LABELS: Record<ContentMode, string> = {
  default: "기본",
  early: "아직 뜨기 전(초기 이슈)",
  data: "숫자·데이터",
  life: "생활 체감",
  conflict: "갈등 구조",
  forecast: "전망·변수",
  global: "해외→국내 영향",
  structure: "구조/제도 해석",
  human: "사람·현장 스토리",
  factcheck: "팩트체크/오해 교정",
  ai: "AI/기술",
};

// 인기 뉴스 자동 로드용 키워드 - 넓은 범위의 인기 카테고리
// 네이버 뉴스 탭의 다양한 인기 뉴스를 수집하기 위한 키워드들
const POPULAR_KEYWORDS = [
  "시사",      // 시사 뉴스 (가장 일반적)
  "정치",      // 정치 뉴스
  "경제",      // 경제 뉴스
  "사회",      // 사회 뉴스
  "국제",      // 국제 뉴스
  "문화",      // 문화 뉴스
  "연예",      // 연예 뉴스
  "스포츠",    // 스포츠 뉴스
  "IT",        // IT/기술 뉴스
  "과학",      // 과학 뉴스
  "부동산",    // 부동산 뉴스
  "건강",      // 건강 뉴스
  "AI",        // AI/인공지능 뉴스
  "금융",      // 금융 뉴스
  "교육",      // 교육 뉴스
  "환경",      // 환경 뉴스
  "게임",      // 게임 뉴스
  "음식",      // 음식/맛집 뉴스
];

export default function NewsPage() {
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newsByCategory, setNewsByCategory] = useState<{ [key: string]: NewsItem[] }>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [useInterestRerank, setUseInterestRerank] = useState(true);
  const [contentMode, setContentMode] = useState<ContentMode>("default");

  // 뉴스 검색 함수
  const fetchNews = async (searchQuery: string, display: number = 20, sort: string = "sim") => {
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        display: String(display),
        sort,
      });
      if (useInterestRerank) params.set("rerank", "interest");
      if (contentMode !== "default") params.set("mode", contentMode);

      const response = await fetch(`/api/naver/news?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "뉴스 검색 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      return data.items || [];
    } catch (err: any) {
      throw err;
    }
  };

  // 인기 뉴스 로드 함수
  const loadPopularNews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 각 카테고리별로 인기순으로 검색
      const keywordsToSearch = POPULAR_KEYWORDS; // 모든 키워드 사용
      const itemsPerKeyword = 10; // 각 키워드당 10개씩 가져오기
      
      // 모든 키워드 검색을 병렬로 실행
      const categoryPromises = keywordsToSearch.map(async (category) => {
        const items = await fetchNews(category, itemsPerKeyword, "sim"); // 인기순
        return {
          category,
          items: items.map((item: NewsItem) => ({
            ...item,
            category,
          })),
        };
      });

      const categoryResults = await Promise.allSettled(categoryPromises);
      
      // 카테고리별로 그룹화
      const groupedNews: { [key: string]: NewsItem[] } = {};
      let successCount = 0;
      let failCount = 0;
      
      categoryResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          groupedNews[result.value.category] = result.value.items;
        } else {
          failCount++;
          console.error(`키워드 "${keywordsToSearch[index]}" 검색 실패:`, result.reason);
          groupedNews[keywordsToSearch[index]] = [];
        }
      });
      
      console.log(`검색 완료: 성공 ${successCount}개 키워드, 실패 ${failCount}개 키워드`);
      
      setNewsByCategory(groupedNews);
      
      // 첫 번째 카테고리를 기본 탭으로 설정
      if (Object.keys(groupedNews).length > 0) {
        setActiveTab(Object.keys(groupedNews)[0]);
      }
    } catch (err: any) {
      setError(err.message || "인기 뉴스를 불러오는 중 오류가 발생했습니다.");
      setNewsByCategory({});
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  // 페이지 로드 시 초기화만 수행 (자동 검색 및 카테고리 선택 제거)
  useEffect(() => {
    setIsInitialLoad(false);
    // 페이지 상단으로 스크롤
    window.scrollTo(0, 0);
  }, []);

  // 검색 실행 함수 (공통 로직) - 검색어로 검색
  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setIsInitialLoad(false);

    try {
      const newsByCategoryMap: { [key: string]: NewsItem[] } = {};
      const searchItems = await fetchNews(searchQuery.trim(), 10, "sim"); // 인기순, 10개
      newsByCategoryMap["검색 결과"] = searchItems.map((item: NewsItem) => ({
        ...item,
        category: undefined,
      }));
      
      setActiveTab("검색 결과");
      setNewsByCategory(newsByCategoryMap);
    } catch (err: any) {
      setError(err.message || "뉴스 검색 중 오류가 발생했습니다.");
      setNewsByCategory({});
    } finally {
      setIsLoading(false);
    }
  };


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 카테고리 선택 또는 검색어 입력 중 하나는 필수
    if (selectedCategories.length === 0 && !query.trim()) {
      setError("카테고리를 선택하거나 검색어를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsInitialLoad(false);

    try {
      const newsByCategoryMap: { [key: string]: NewsItem[] } = {};

      // 카테고리가 선택되고 검색어도 있는 경우: 각 카테고리 내에서 검색어 검색
      if (selectedCategories.length > 0 && query.trim()) {
        const categoryPromises = selectedCategories.map(async (category) => {
          // 카테고리 + 검색어 조합으로 검색 (예: "문화 사랑")
          const searchTerm = `${category} ${query.trim()}`;
          const items = await fetchNews(searchTerm, 10, "sim"); // 인기순, 10개씩
          return {
            category,
            items: items.map((item: NewsItem) => ({
              ...item,
              category,
            })),
          };
        });

        const categoryResults = await Promise.allSettled(categoryPromises);
        
        categoryResults.forEach((result, index) => {
          const category = selectedCategories[index];
          if (result.status === 'fulfilled') {
            newsByCategoryMap[result.value.category] = result.value.items;
          } else {
            newsByCategoryMap[category] = [];
          }
        });

        // 첫 번째 카테고리를 기본 탭으로 설정
        if (selectedCategories.length > 0) {
          setActiveTab(selectedCategories[0]);
        }
      }
      // 검색어만 있는 경우: 검색어로만 검색
      else if (query.trim()) {
        const searchItems = await fetchNews(query.trim(), 10, "sim"); // 인기순, 10개
        newsByCategoryMap["검색 결과"] = searchItems.map((item: NewsItem) => ({
          ...item,
          category: undefined,
        }));
        
        setActiveTab("검색 결과");
      }
      // 카테고리만 선택된 경우: 각 카테고리별 인기 뉴스
      else if (selectedCategories.length > 0) {
        const categoryPromises = selectedCategories.map(async (category) => {
          const items = await fetchNews(category, 10, "sim"); // 인기순, 10개씩
          return {
            category,
            items: items.map((item: NewsItem) => ({
              ...item,
              category,
            })),
          };
        });

        const categoryResults = await Promise.allSettled(categoryPromises);
        
        categoryResults.forEach((result, index) => {
          const category = selectedCategories[index];
          if (result.status === 'fulfilled') {
            newsByCategoryMap[result.value.category] = result.value.items;
          } else {
            newsByCategoryMap[category] = [];
          }
        });

        // 첫 번째 카테고리를 기본 탭으로 설정
        if (selectedCategories.length > 0) {
          setActiveTab(selectedCategories[0]);
        }
      }
      
      setNewsByCategory(newsByCategoryMap);
    } catch (err: any) {
      setError(err.message || "뉴스 검색 중 오류가 발생했습니다.");
      setNewsByCategory({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        // 이미 선택된 카테고리면 제거
        return prev.filter((c) => c !== category);
      } else {
        // 선택되지 않은 카테고리면 추가
        return [...prev, category];
      }
    });
  };


  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <main className="main-page">
      <div className="hero-section">
        <div className="back-buttons">
          <BackButton />
          <button
            onClick={() => window.location.reload()}
            className="refresh-button"
            title="페이지 새로고침"
          >
            🔄 새로고침
          </button>
        </div>
        <h1>인기 뉴스 조회</h1>
        <p>최신 뉴스와 트렌드를 조회하여 영상 주제를 선정합니다</p>
      </div>

      <section className="news-section">
        <div className="news-search-form">
          <div className="category-selector">
            <label className="category-label">
              카테고리 선택 (복수 선택 가능):
            </label>
            <div className="category-buttons">
              <button
                type="button"
                className={`category-button select-all-button ${selectedCategories.length === POPULAR_KEYWORDS.length ? "active" : ""}`}
                onClick={() => {
                  if (selectedCategories.length === POPULAR_KEYWORDS.length) {
                    // 모두 선택된 상태면 전체 해제
                    setSelectedCategories([]);
                  } else {
                    // 모두 선택
                    setSelectedCategories([...POPULAR_KEYWORDS]);
                  }
                }}
              >
                {selectedCategories.length === POPULAR_KEYWORDS.length ? "전체 해제" : "전체 선택"}
              </button>
              {POPULAR_KEYWORDS.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`category-button ${selectedCategories.includes(category) ? "active" : ""}`}
                  onClick={() => handleCategoryToggle(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSearch}>
            <div className="search-input-group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="뉴스 검색어를 입력하세요 (예: AI, 코딩, 기술)"
                className="news-search-input"
              />
              <button type="submit" className="news-search-button" disabled={isLoading}>
                {isLoading ? "검색 중..." : "검색"}
              </button>
            </div>
            <div className="news-options">
              <div className="news-option-group">
                <div className="news-option-title">정렬 방식(랭킹)</div>
                <div className="news-option-desc">
                  같은 후보 기사들을 어떤 순서로 보여줄지 결정합니다.
                </div>
                <label className="news-option">
                  <input
                    type="checkbox"
                    checked={useInterestRerank}
                    onChange={(e) => setUseInterestRerank(e.target.checked)}
                  />
                  흥미도 우선 정렬
                </label>
              </div>

              <div className="news-option-group">
                <div className="news-option-title">큐레이션(콘텐츠 모드)</div>
                <div className="news-option-desc">
                  어떤 “종류”의 기사를 더 우선으로 모아볼지 선택합니다.
                </div>
                <label className="news-option">
                  콘텐츠 모드
                  <select
                    className="news-mode-select"
                    value={contentMode}
                    onChange={(e) => setContentMode(e.target.value as ContentMode)}
                  >
                    {(Object.keys(CONTENT_MODE_LABELS) as ContentMode[]).map((m) => (
                      <option key={m} value={m}>
                        {CONTENT_MODE_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </form>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            {error.includes("API 키") && (
              <div style={{ marginTop: "15px", padding: "15px", background: "#f8f9fa", borderRadius: "4px" }}>
                <strong>네이버 API 설정 방법:</strong>
                <ol style={{ marginTop: "10px", paddingLeft: "20px" }}>
                  <li><a href="https://developers.naver.com/apps/#/register" target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>네이버 개발자 센터</a>에서 애플리케이션 등록</li>
                  <li>검색 API 사용 신청</li>
                  <li>Client ID와 Client Secret 발급</li>
                  <li>환경 변수에 <code>NAVER_CLIENT_ID</code>와 <code>NAVER_CLIENT_SECRET</code> 설정</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {isLoading && (
          <div className="loading">
            <p>뉴스를 검색하는 중...</p>
          </div>
        )}

        {!isLoading && Object.keys(newsByCategory).length > 0 && (
          <div className="news-results">
            {/* 카테고리별 탭 */}
            {Object.keys(newsByCategory).length > 1 && (
              <div className="category-tabs">
                {Object.keys(newsByCategory).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`category-tab ${activeTab === category ? "active" : ""}`}
                    onClick={() => setActiveTab(category)}
                  >
                    {category} ({newsByCategory[category].length})
                  </button>
                ))}
              </div>
            )}

            {/* 선택된 탭의 뉴스 표시 */}
            {activeTab && newsByCategory[activeTab] && (
              <div className="news-tab-content">
                <div className="news-results-header">
                  <h2>
                    {isInitialLoad 
                      ? "인기 뉴스" 
                      : activeTab === "검색 결과"
                        ? `"${query}" 검색 결과`
                        : `${activeTab} 카테고리 뉴스`} ({newsByCategory[activeTab].length}개)
                  </h2>
                </div>
                <div className="news-list">
                  {newsByCategory[activeTab].map((item, index) => {
                    return (
                      <div
                        key={index}
                        className="news-card"
                      >
                        <div className="news-card-header">
                          <div className="news-title-wrapper">
                            <h3 className="news-title">{item.title}</h3>
                          </div>
                        </div>
                        <p className="news-description">{item.description}</p>
                        <div className="news-meta">
                          <span className="news-date">{formatDate(item.pubDate)}</span>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-link"
                            onClick={(e) => e.stopPropagation()}
                          >
                            원문 보기 →
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!isLoading && Object.keys(newsByCategory).length === 0 && !isInitialLoad && !error && (
          <div className="no-results">
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}
