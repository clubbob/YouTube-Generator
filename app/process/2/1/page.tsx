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

// 인기 뉴스 자동 로드용 키워드
const POPULAR_KEYWORDS = [
  "경제",
  "기술",
  "스포츠",
  "사회",
  "정치",
  "문화",
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

        // 각 키워드로 검색 (최신순으로 정렬)
        for (const keyword of POPULAR_KEYWORDS.slice(0, 3)) {
          try {
            const items = await fetchNews(keyword, 10, "date");
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

        // 날짜순으로 정렬 (최신순)
        allNews.sort((a, b) => {
          const dateA = new Date(a.pubDate).getTime();
          const dateB = new Date(b.pubDate).getTime();
          return dateB - dateA;
        });

        // 최대 30개까지만 표시
        setNews(allNews.slice(0, 30));
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
