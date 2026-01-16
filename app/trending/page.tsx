"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SearchForm from "@/components/SearchForm";
import VideoList from "@/components/VideoList";
import BackButton from "@/components/BackButton";
import type { YouTubeVideoItem } from "@/types";

export default function TrendingPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<YouTubeVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(new Set());

  const handleSearch = async (params: {
    query: string;
    timeframeDays: 7 | 30 | 90;
    subscriberMax?: number;
    minViews?: number;
    minDurationSec?: number;
    contentType?: "shorts_like" | "all";
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/youtube/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: params.query,
          timeframeDays: params.timeframeDays,
          contentType: params.contentType,
          maxResults: 50, // 할당량 절약을 위해 50으로 제한
          filters: {
            subscriberMax: params.subscriberMax,
            minViews: params.minViews,
            minDurationSec: params.minDurationSec,
          },
        }),
      });

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = await response.json();
          } catch (e) {
            const text = await response.text();
            throw new Error(text || "검색 중 오류가 발생했습니다.");
          }
        } else {
          const text = await response.text();
          throw new Error(text || "검색 중 오류가 발생했습니다.");
        }
        
        // 할당량 초과 에러인 경우 상세 정보 표시
        if (response.status === 429 && errorData.details) {
          throw new Error(
            `${errorData.error}\n\n${errorData.details}\n\n해결 방법: ${errorData.solution}`
          );
        }
        throw new Error(errorData.error || "검색 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      setVideos(data.items || []);
    } catch (err: any) {
      setError(err.message || "검색 중 오류가 발생했습니다.");
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (video: YouTubeVideoItem) => {
    try {
      const response = await fetch("/api/saved", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId: video.videoId,
          title: video.title,
          channelTitle: video.channelTitle,
          views: video.views,
          subs: video.subs,
          viewsPerDay: video.viewsPerDay,
          hitScore: video.hitScore,
          tags: [],
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("저장 중 오류가 발생했습니다.");
      }

      setSavedVideoIds((prev) => new Set(prev).add(video.videoId));
    } catch (err: any) {
      alert(err.message || "저장 중 오류가 발생했습니다.");
    }
  };

  return (
    <main className="main-page">
      <div className="hero-section">
        <div className="back-buttons">
          <BackButton />
        </div>
        <h1>인기 영상 조회</h1>
      </div>

      <div className="search-section">
        <SearchForm onSearch={handleSearch} isLoading={isLoading} />
      </div>

      {error && (
        <div className="error-message">
          <p style={{ whiteSpace: "pre-line" }}>{error}</p>
          {error.includes("할당량") && (
            <div style={{ marginTop: "15px", padding: "15px", background: "#f8f9fa", borderRadius: "4px" }}>
              <strong>할당량 확인 방법:</strong>
              <ol style={{ marginTop: "10px", paddingLeft: "20px" }}>
                <li><a href="https://console.cloud.google.com/apis/dashboard" target="_blank" rel="noopener noreferrer" style={{ color: "#0066cc" }}>Google Cloud Console</a> 접속</li>
                <li>프로젝트 선택</li>
                <li><strong>API 및 서비스</strong> &gt; <strong>할당량</strong> 메뉴</li>
                <li>"YouTube Data API v3" 검색</li>
                <li>현재 사용량 및 한도 확인</li>
              </ol>
              <p style={{ marginTop: "10px", fontSize: "0.9rem", color: "#666" }}>
                💡 할당량은 매일 자정(태평양 표준시)에 리셋됩니다. 한국 시간 기준 오후 5-6시입니다.
              </p>
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="loading">
          <p>검색 중...</p>
        </div>
      )}

      {!isLoading && videos.length > 0 && (
        <div className="results-section">
          <h2>검색 결과 ({videos.length}개)</h2>
          <VideoList
            videos={videos}
            onSave={handleSave}
            savedVideoIds={savedVideoIds}
          />
        </div>
      )}
    </main>
  );
}
