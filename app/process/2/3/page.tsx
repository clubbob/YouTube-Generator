"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";

interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
  category?: string;
}

// 인기 뉴스 자동 로드용 키워드
const POPULAR_KEYWORDS = [
  "시사", "정치", "경제", "사회", "국제", "문화", "연예", "스포츠",
  "IT", "과학", "부동산", "건강", "AI", "금융", "교육", "환경", "게임", "음식",
];

export default function ScriptGenerationPage() {
  // 뉴스 조회 관련 상태
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newsByCategory, setNewsByCategory] = useState<{ [key: string]: NewsItem[] }>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem[]>([]);

  // 채널 컨셉 정보
  const [channelPurpose, setChannelPurpose] = useState("복잡한 뉴스와 정보를 3분 안에 쉽게 이해하게 만드는 채널. 단순 정보 전달이 아니라 원인, 구조, 맥락을 연결하여 시청자의 사고를 정리해주는 해석형 채널");
  const [channelKeywords, setChannelKeywords] = useState("뉴스 해석, 시사 분석, 정보 정리, 트렌드 분석, 경제 뉴스, 시사 뉴스, 뉴스 요약, 인사이트, 맥락 이해");
  const [coreTargetAudience, setCoreTargetAudience] = useState("20-30대 직장인 및 대학생. 경제, 투자, 시사, 트렌드에 관심이 있지만 정보 과부하로 인해 핵심만 빠르게 알고 싶어하는 사람들");
  const [videoStructure, setVideoStructure] = useState("오프닝 훅 (9초): 질문이나 관점으로 시작 → 핵심 설명 (153초): 사실 → 원인 → 구조 → 맥락 순서로 전개 → 인사이트 요약 (9초): 한 문장으로 정리 → 마무리 (9초): 반복 시청 유도 멘트");
  const [channelToneAndMood, setChannelToneAndMood] = useState("차분하고 분석적인 말투. 감정적 선동이나 판단 강요 없이, 이해를 확장하고 사고를 정리할 수 있도록 설명하는 톤");
  const [channelCharacterPosition, setChannelCharacterPosition] = useState("'설명하는 채널'이 아닌 '생각하게 만드는 채널'. 자극적 제목과 감정 선동을 피하고, 원인과 구조를 보여주는 해석자 역할");

  // 대본 생성 관련 상태
  const [videoTopic, setVideoTopic] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // 인기 뉴스 로드 함수
  const loadPopularNews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const keywordsToSearch = POPULAR_KEYWORDS;
      const itemsPerKeyword = 10;
      
      const categoryPromises = keywordsToSearch.map(async (category) => {
        const items = await fetchNews(category, itemsPerKeyword, "sim");
        return {
          category,
          items: items.map((item: NewsItem) => ({
            ...item,
            category,
          })),
        };
      });

      const categoryResults = await Promise.allSettled(categoryPromises);
      
      const groupedNews: { [key: string]: NewsItem[] } = {};
      
      categoryResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          groupedNews[result.value.category] = result.value.items;
        } else {
          groupedNews[keywordsToSearch[index]] = [];
        }
      });
      
      setNewsByCategory(groupedNews);
      
      if (Object.keys(groupedNews).length > 0) {
        setActiveTab(Object.keys(groupedNews)[0]);
      }
    } catch (err: any) {
      setError(err.message || "인기 뉴스를 불러오는 중 오류가 발생했습니다.");
      setNewsByCategory({});
    } finally {
      setIsLoading(false);
    }
  };

  // 뉴스 조회 함수 (통합)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);

    try {
      // 카테고리 선택이나 검색어 입력이 없으면 인기 뉴스 자동 조회
      if (selectedCategories.length === 0 && !query.trim()) {
        await loadPopularNews();
        return;
      }

      const newsByCategoryMap: { [key: string]: NewsItem[] } = {};

      if (selectedCategories.length > 0 && query.trim()) {
        const categoryPromises = selectedCategories.map(async (category) => {
          const searchTerm = `${category} ${query.trim()}`;
          const items = await fetchNews(searchTerm, 10, "sim");
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

        if (selectedCategories.length > 0) {
          setActiveTab(selectedCategories[0]);
        }
      } else if (query.trim()) {
        const searchItems = await fetchNews(query.trim(), 10, "sim");
        newsByCategoryMap["검색 결과"] = searchItems.map((item: NewsItem) => ({
          ...item,
          category: undefined,
        }));
        
        setActiveTab("검색 결과");
      } else if (selectedCategories.length > 0) {
        const categoryPromises = selectedCategories.map(async (category) => {
          const items = await fetchNews(category, 10, "sim");
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
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // 뉴스 선택/해제 함수 (하나만 선택 가능)
  const toggleNewsSelection = (news: NewsItem) => {
    setSelectedNews((prev) => {
      const isSelected = prev.some((item) => item.link === news.link);
      if (isSelected) {
        // 같은 뉴스를 클릭하면 선택 해제
        setVideoTopic("");
        return [];
      } else {
        // 새로운 뉴스를 선택하면 기존 선택을 해제하고 새로 선택
        setVideoTopic(news.title);
        return [news];
      }
    });
  };

  const isNewsSelected = (news: NewsItem) => {
    return selectedNews.some((item) => item.link === news.link);
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

  const handleGenerateScript = () => {
    if (selectedNews.length === 0) {
      alert("대본을 만들 뉴스를 최소 1개 이상 선택해주세요.");
      return;
    }

    setIsGenerating(true);

    // 첫 번째 선택한 뉴스 사용 (하나만)
    const news = selectedNews[0];

    const prompt = `너는 유튜브 숏폼 영상 대본 작성 전문가이자
스토리텔링과 정보 전달을 균형있게 조화시키는 콘텐츠 작가다.

다음 뉴스 기사를 바탕으로
"시청자의 관심을 끌고 끝까지 보게 만드는 3분(180초) 유튜브 숏폼 영상 대본"을 작성해라.

[뉴스 기사 정보]
제목: ${news.title}
내용: ${news.description}

[채널 컨셉]
- 채널 목적: ${channelPurpose}
- 채널 말투: ${channelToneAndMood}
- 영상 구조: ${videoStructure}

[출력 요구사항]
- 정확히 3분(180초) 분량의 대본 (약 600-750자)
- 오프닝 훅: 시청자의 관심을 끄는 강렬한 질문이나 문장
- 본문: 사실 → 원인 → 구조 → 맥락 순서로 전개
- 인사이트 요약: 핵심 내용을 한 문장으로 정리
- 마무리: 반복 시청을 유도하는 멘트 (예: "다음 뉴스에서 더 분석해 보겠습니다.")
- 자연스러운 구어체로 작성
- 시간 정보나 시간 표시는 포함하지 말 것
- 대본만 작성하고 불필요한 설명은 제외`;

    setGeneratedPrompt(prompt);
    setCopied(false);
    setIsGenerating(false);
  };

  const handleCopyPrompt = async () => {
    if (generatedPrompt) {
      try {
        await navigator.clipboard.writeText(generatedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("복사 실패:", err);
      }
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <main className="main-page">
      <div className="hero-section">
        <div className="back-buttons">
          <BackButton />
          <button
            onClick={handleRefresh}
            className="refresh-button"
            title="페이지 새로고침"
          >
            🔄 새로고침
          </button>
        </div>
        <h1>대본 만들기</h1>
        <p>인기 뉴스를 조회하고 선택하여 영상 대본을 생성합니다</p>
      </div>

      <section className="process-content">
        {/* 인기 뉴스 조회 섹션 */}
        <div className="news-section">
          <h2 className="section-title">📰 인기 뉴스 조회</h2>
          <p className="section-description">
            아래 "검색" 버튼을 클릭하면 인기 뉴스가 조회됩니다. 카테고리를 선택하거나 검색어를 입력하면 해당 조건에 맞는 뉴스만 조회됩니다.
          </p>

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
                      setSelectedCategories([]);
                    } else {
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
                  placeholder="뉴스 검색어를 입력하세요 (선택사항, 입력하지 않으면 인기 뉴스 조회)"
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
            </div>
          )}

          {isLoading && (
            <div className="loading">
              <p>뉴스를 검색하는 중...</p>
            </div>
          )}

          {!isLoading && Object.keys(newsByCategory).length > 0 && (
            <div className="news-results">
              {selectedNews.length > 0 && (
                <div className="selected-news-banner">
                  <div className="selected-news-info">
                    <span className="selected-count">뉴스 선택됨</span>
                  </div>
                </div>
              )}

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

              {activeTab && newsByCategory[activeTab] && (
                <div className="news-tab-content">
                  <div className="news-results-header">
                    <h3>
                      {activeTab === "검색 결과"
                        ? `"${query}" 검색 결과`
                        : `${activeTab} 카테고리 뉴스`} ({newsByCategory[activeTab].length}개)
                    </h3>
                  </div>
                  <div className="news-list">
                    {newsByCategory[activeTab].map((item, index) => {
                      const isSelected = isNewsSelected(item);
                      return (
                        <div
                          key={index}
                          className={`news-card ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleNewsSelection(item)}
                        >
                          <div className="news-card-header">
                            <div className="news-checkbox-wrapper">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleNewsSelection(item)}
                                onClick={(e) => e.stopPropagation()}
                                className="news-checkbox"
                              />
                            </div>
                            <div className="news-title-wrapper">
                              <h4 className="news-title">{item.title}</h4>
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

          {!isLoading && Object.keys(newsByCategory).length === 0 && !error && (
            <div className="no-results">
              <p>뉴스를 조회해주세요. 위의 "인기 뉴스 조회" 버튼을 클릭하거나 검색어를 입력하여 검색하세요.</p>
            </div>
          )}
        </div>

        {/* 대본 생성 섹션 */}
        {selectedNews.length > 0 && (
          <div className="prompt-section">
            <div className="selected-news-section">
              <div className="form-section-title">선택한 뉴스</div>
              <div className="selected-news-list">
                {selectedNews.slice(0, 1).map((news, index) => (
                  <div key={index} className="selected-news-card">
                    <div className="selected-news-header">
                      <h4 className="selected-news-title">{news.title}</h4>
                      <a
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        원문 보기 →
                      </a>
                    </div>
                    <p className="selected-news-description">{news.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="button-group">
              <button
                onClick={handleGenerateScript}
                className="primary-button"
                disabled={isGenerating}
              >
                {isGenerating ? "생성 중..." : "대본 만들기"}
              </button>
            </div>

            {generatedPrompt && (
              <div className="prompt-result">
                <div className="result-header">
                  <h3>생성된 대본 프롬프트</h3>
                  <button
                    onClick={handleCopyPrompt}
                    className="copy-button"
                  >
                    {copied ? "✓ 복사됨" : "📋 복사"}
                  </button>
                </div>
                <div className="prompt-content">
                  <pre>{generatedPrompt}</pre>
                </div>
                <div className="result-actions">
                  <div className="result-hint-box">
                    <h4 className="result-hint-title">📋 다음 단계</h4>
                    <ol className="result-hint-steps">
                      <li>위의 "📋 복사" 버튼을 클릭하여 프롬프트를 복사하세요.</li>
                      <li>ChatGPT, Claude, Gemini 등 AI 도구를 열어주세요.</li>
                      <li>복사한 프롬프트를 AI 도구에 붙여넣고 실행하세요.</li>
                      <li>AI가 생성한 3분 대본을 확인하세요.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
