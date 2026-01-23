"use client";

import { useState } from "react";

interface SearchFormProps {
  onSearch: (params: {
    query: string;
    timeframeDays: 7 | 30 | 90;
    subscriberMax?: number;
    minViews?: number;
    minDurationSec?: number;
    contentType?: "all" | "regular" | "longform" | "shorts";
  }) => void;
  isLoading?: boolean;
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [timeframeDays, setTimeframeDays] = useState<7 | 30 | 90>(30);
  const [subscriberMax, setSubscriberMax] = useState("500,000");
  const [minViews, setMinViews] = useState("20,000");
  const [minDurationSec, setMinDurationSec] = useState("120");
  const [contentType, setContentType] = useState<"all" | "regular" | "longform" | "shorts">("regular");

  // 숫자에 천단위 구분자 추가
  const formatNumber = (value: string): string => {
    // 숫자가 아닌 문자 제거
    const numbers = value.replace(/,/g, "");
    if (!numbers) return "";
    // 천단위 구분자 추가
    return parseInt(numbers).toLocaleString("ko-KR");
  };

  // 콤마 제거하고 숫자로 변환
  const parseNumber = (value: string): number | undefined => {
    const numbers = value.replace(/,/g, "");
    return numbers ? parseInt(numbers) : undefined;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 키워드가 없으면 기본 검색어 사용 (앤디리스트 채널에 적합한 주제들)
    let searchQuery = query.trim() || "인기 뉴스";
    
    // 쉼표로 구분된 키워드를 AND 조건(공백)으로 변환
    if (searchQuery.includes(",")) {
      searchQuery = searchQuery.split(",").map(k => k.trim()).filter(k => k).join(" ");
    }

    onSearch({
      query: searchQuery,
      timeframeDays,
      subscriberMax: parseNumber(subscriberMax),
      minViews: parseNumber(minViews),
      minDurationSec: parseNumber(minDurationSec),
      contentType,
    });
  };

  const handleSubscriberMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setSubscriberMax(formatted);
  };

  const handleMinViewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumber(e.target.value);
    setMinViews(formatted);
  };

  const handleMinDurationSecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 초 단위는 천단위 구분자 없이 숫자만
    const numbers = e.target.value.replace(/,/g, "").replace(/[^0-9]/g, "");
    setMinDurationSec(numbers);
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="query">
            키워드 <span style={{ fontSize: "0.85rem", color: "#666", fontWeight: "normal" }}>(선택)</span>
          </label>
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="비워두면 '인기 뉴스' 검색 (쉼표로 구분 시 AND 검색, 예: 뉴스, 정치)"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="timeframe">기간 필터</label>
          <select
            id="timeframe"
            value={timeframeDays}
            onChange={(e) =>
              setTimeframeDays(parseInt(e.target.value) as 7 | 30 | 90)
            }
            disabled={isLoading}
          >
            <option value={7}>최근 7일</option>
            <option value={30}>최근 30일</option>
            <option value={90}>최근 90일</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="contentType">콘텐츠 타입</label>
          <select
            id="contentType"
            value={contentType}
            onChange={(e) =>
              setContentType(e.target.value as "all" | "regular" | "longform" | "shorts")
            }
            disabled={isLoading}
          >
            <option value="all">전체</option>
            <option value="shorts">쇼츠 (1분 이하)</option>
            <option value="regular">기본 (1분 ~ 5분)</option>
            <option value="longform">장편 (5분 이상)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="subscriberMax">최대 구독자 수</label>
          <input
            id="subscriberMax"
            type="text"
            value={subscriberMax}
            onChange={handleSubscriberMaxChange}
            placeholder="예: 300,000"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="minViews">최소 조회수</label>
          <input
            id="minViews"
            type="text"
            value={minViews}
            onChange={handleMinViewsChange}
            placeholder="예: 20,000"
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="minDurationSec">최소 길이 (초)</label>
          <input
            id="minDurationSec"
            type="text"
            value={minDurationSec}
            onChange={handleMinDurationSecChange}
            placeholder="예: 60"
            disabled={isLoading}
            style={{ width: "100%", maxWidth: "100%" }}
          />
        </div>
      </div>

      <button type="submit" disabled={isLoading}>
        {isLoading ? "검색 중..." : "검색"}
      </button>
    </form>
  );
}
