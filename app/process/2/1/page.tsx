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
}

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
];

export default function NewsPage() {
  const [query, setQuery] = useState("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<Set<number>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 뉴스 검색 함수
  const fetchNews = async (searchQuery: string, display: number = 20, sort: string = "sim") => {
    try {
      const response = await fetch(
        `/api/naver/news?query=${encodeURIComponent(searchQuery)}&display=${display}&sort=${sort}`
      );

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

  // 인기 뉴스 자동 로드
  useEffect(() => {
    const loadPopularNews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // 여러 키워드로 검색하여 결과 합치기
        const allNews: NewsItem[] = [];
        const seenLinks = new Set<string>(); // 중복 제거용

        // 각 키워드로 검색 (인기순으로 정렬 - sim: 정확도순/인기순)
        // 넓은 범위의 키워드로 검색하여 다양한 인기 뉴스 수집
        const keywordsToSearch = POPULAR_KEYWORDS.slice(0, 8); // 상위 8개 키워드 사용
        const itemsPerKeyword = 5; // 각 키워드당 5개씩 가져오기 (더 많은 키워드로 다양성 확보)
        
        for (const keyword of keywordsToSearch) {
          try {
            const items = await fetchNews(keyword, itemsPerKeyword, "sim");
            // 중복 제거
            items.forEach((item: NewsItem) => {
              if (!seenLinks.has(item.link)) {
                seenLinks.add(item.link);
                allNews.push(item);
              }
            });
          } catch (err) {
            // 개별 키워드 실패는 무시하고 계속 진행
            console.error(`Failed to fetch news for keyword "${keyword}":`, err);
          }
        }

        // 날짜순으로 정렬 (최신순) - 인기 뉴스 중에서도 최신 뉴스 우선
        allNews.sort((a, b) => {
          const dateA = new Date(a.pubDate).getTime();
          const dateB = new Date(b.pubDate).getTime();
          return dateB - dateA;
        });

        // 최대 50개까지 표시 (더 많은 인기 뉴스 제공)
        setNews(allNews.slice(0, 50));
      } catch (err: any) {
        setError(err.message || "인기 뉴스를 불러오는 중 오류가 발생했습니다.");
        setNews([]);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadPopularNews();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setError("검색어를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsInitialLoad(false);

    try {
      const items = await fetchNews(query, 20, "sim");
      setNews(items);
    } catch (err: any) {
      setError(err.message || "뉴스 검색 중 오류가 발생했습니다.");
      setNews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedNews((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
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
        </div>
        <h1>인기 뉴스 조회</h1>
        <p>최신 뉴스와 트렌드를 조회하여 영상 주제를 선정합니다</p>
      </div>

      <section className="news-section">
        <div className="news-search-form">
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

        {!isLoading && news.length > 0 && (
          <div className="news-results">
            <div className="news-results-header">
              <h2>
                {isInitialLoad ? "인기 뉴스" : "검색 결과"} ({news.length}개)
              </h2>
              {selectedNews.size > 0 && (
                <div className="selected-count">
                  {selectedNews.size}개 선택됨
                </div>
              )}
            </div>
            <div className="news-list">
              {news.map((item, index) => (
                <div
                  key={index}
                  className={`news-card ${selectedNews.has(index) ? "selected" : ""}`}
                  onClick={() => toggleSelect(index)}
                >
                  <div className="news-card-header">
                    <input
                      type="checkbox"
                      checked={selectedNews.has(index)}
                      onChange={() => toggleSelect(index)}
                      onClick={(e) => e.stopPropagation()}
                      className="news-checkbox"
                    />
                    <h3 className="news-title">{item.title}</h3>
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
              ))}
            </div>
          </div>
        )}

        {!isLoading && news.length === 0 && !isInitialLoad && !error && (
          <div className="no-results">
            <p>검색 결과가 없습니다.</p>
          </div>
        )}
      </section>
    </main>
  );
}
