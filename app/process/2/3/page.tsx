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

    const prompt = `앤디리스트 3분 기사 해석 프롬프트 (개선본 v2.5)
너는 유튜브 뉴스 해석 콘텐츠를 전문으로 하는
대본 작성 전문가다.

너의 역할은 뉴스를 요약하는 것이 아니라,
시청자가
"아, 그래서 이런 뉴스가 반복되는구나"
라고 이해하도록
원인–구조–맥락을 정리해주는 것이다.

아래 뉴스 기사를 바탕으로
시청자의 관심을 끌고,
비구독자도 끝까지 보게 만드는
3분(180초) 분량의 유튜브 영상 대본과 제목을 작성하라.

────────────────
[뉴스 기사 정보]
- 제목: ${news.title}
- 내용: ${news.description}
────────────────

[채널 컨셉]
- 채널 목적:
  복잡한 뉴스와 정보를 3분 안에 이해시키는 해석형 채널.
  단순 전달이 아니라 사고를 정리해주는 콘텐츠.

- 채널 말투:
  차분하고 분석적인 톤.
  감정적 선동, 판단 강요, 훈계 어조는 사용하지 않는다.
  '설명해주는 사람'의 시점으로 말한다.

- 음성 전제:
  여자 AI 음성, 약간 빠른 속도로 낭독될 것을 전제로 한다.
  따라서 문장은 짧고 명확하게 작성한다.

────────────────
[영상 구조 및 작성 규칙]

1. 오프닝 훅
- 질문 또는 관점 제시로 시작
- "이 영상을 끝까지 보면 무엇을 이해하게 되는지"가 분명해야 함
- 2문장 이내
- 각 문장은 20자 내외의 짧은 문장으로 구성

2. 핵심 설명 (본문)
- 전개 순서: 사실 → 원인 → 구조 → 맥락
- 설명형 나열이 아니라 '질문 → 답변' 흐름으로 작성
- 한 문장은 최대 2줄을 넘지 않게 작성

- 본문 중 반드시 아래 역할의 문장을 **명시적으로 포함할 것**

  [앵커 문장 규칙]
  아래 유형 중 최소 3개를 자연스럽게 삽입:
  - "여기서 핵심은 이겁니다."
  - "이걸 한 문장으로 정리하면"
  - "이 지점에서 뉴스의 성격이 달라집니다."
  - "이 부분을 놓치면 해석이 달라집니다."

  ※ 앵커 문장은 문단 첫머리 또는 문단 전환 지점에 배치한다.

3. 긴장 유지 문장
- 본문 중간에 반드시 아래 문장 중 하나를 포함:
  - "그런데 여기서 대부분이 놓치는 지점이 있습니다."
  - "이 부분이 앞으로 더 중요해질 수 있습니다."
  - "이 뉴스는 여기서부터 다르게 봐야 합니다."

4. 인사이트 요약
- 단순 결론이 아니라 '사고 정리'
- 왜 이 뉴스가 중요한지,
  앞으로 무엇을 보게 될지를 정리
- 이 구간은 문장 길이를 더 짧게 작성
- 설명보다 단정한 문장 사용

5. 마무리
- 다음 영상으로 이어지는 질문 제시
- '이 이슈는 반복된다'는 인식 강화
- 구독과 좋아요는 정보 제공의 수단으로 자연스럽게 언급
- 마무리는 특정 기사나 후속 영상 제작을 전제로 한 직접적 예고를 피하고,
  해당 뉴스가 반복될 수 있는 구조나 관점에 대한 여운을 남길 것.

────────────────
[출력 요구사항]

- 유튜브 영상 제목:
  * 30~40자 이내
  * 정보 나열 금지
  * '왜 / 구조 / 이유 / 반복' 중 하나의 관점이 드러날 것

- 전체 대본 분량:
  * 약 1500자
  * 자연스러운 구어체
  * 시간·초 단위 표현 사용 금지

- 오프닝 훅:
  * 약 45~60자
  * 질문형 또는 관점 제시형

- 본문:
  * 약 1300자
  * 예시·비유·사례 포함 (과도하지 않게)

- 인사이트 요약:
  * 3~4문장
  * 약 75~90자

- 마무리:
  * 질문형
  * 약 60~80자
  * 구독·좋아요 문구 포함

- 출력 형식:
  [영상 제목]
  제목 작성

  [대본]
  대본 작성`;

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

  const handleResetSelection = () => {
    setSelectedNews([]);
    setVideoTopic("");
    setGeneratedPrompt("");
    setCopied(false);
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
              <div className="form-section-title">
                선택한 뉴스
                <button
                  onClick={handleResetSelection}
                  className="reset-selection-button"
                  title="선택 초기화"
                >
                  🔄 새로고침
                </button>
              </div>
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
                {isGenerating ? "생성 중..." : "대본 만들기 프롬프트 생성"}
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
