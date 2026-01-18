"use client";

import type { YouTubeVideoItem } from "@/types";

interface VideoCardProps {
  video: YouTubeVideoItem;
  onSave?: (video: YouTubeVideoItem) => void;
  isSaved?: boolean;
  rank?: number;
}

export default function VideoCard({ video, onSave, isSaved, rank }: VideoCardProps) {
  const formatNumber = (num: number): string => {
    // 소수점 제거하고 천 단위 구분자 추가 (예: 1,234,567)
    return Math.floor(num).toLocaleString('ko-KR');
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateDaysAgo = (publishedAt: string): string => {
    const publishedDate = new Date(publishedAt);
    const now = new Date();
    const diffTime = now.getTime() - publishedDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `D-${diffDays}`;
  };

  // 제목에서 해시태그 부분을 찾아서 다른 색으로 표시
  const renderTitleWithHashtags = (title: string) => {
    if (!title) return "(제목 없음)";
    
    const hashtagRegex = /#[\w가-힣]+/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    
    while ((match = hashtagRegex.exec(title)) !== null) {
      // 해시태그 이전 텍스트
      if (match.index > lastIndex) {
        parts.push(title.substring(lastIndex, match.index));
      }
      // 해시태그 (다른 색으로 표시)
      parts.push(
        <span key={match.index} className="title-hashtag">
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // 마지막 해시태그 이후 텍스트
    if (lastIndex < title.length) {
      parts.push(title.substring(lastIndex));
    }
    
    // 해시태그가 없으면 원본 제목 반환
    if (parts.length === 0) {
      return title;
    }
    
    return parts;
  };

  return (
    <div className="video-card">
      {rank && (
        <div className="video-rank">#{rank}</div>
      )}
      <div className="video-thumbnail">
        <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
          <img src={video.thumbnailUrl} alt={video.title} />
          <span className="duration">{formatDuration(video.durationSec)}</span>
        </a>
      </div>

      <div className="video-content">
        <div className="video-info-section">
          <h3 className="video-title">
            <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
              {renderTitleWithHashtags(video.title)}
            </a>
          </h3>

          <div className="video-stats">
          <div className="stat-item">
            <span className="stat-label">채널명:</span>
            <span className="stat-value">{video.channelTitle || "(채널명 없음)"}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">채널 구독자:</span>
            <span className="stat-value">{formatNumber(video.subs)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">영상 조회수:</span>
            <span className="stat-value">{formatNumber(video.views)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">영상 업로드:</span>
            <span className="stat-value">{calculateDaysAgo(video.publishedAt)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">영상 일평균 조회수:</span>
            <span className="stat-value">{formatNumber(video.viewsPerDay)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">영상 길이:</span>
            <span className="stat-value">{formatDuration(video.durationSec)}</span>
          </div>
          <div className="stat-item highlight">
            <span className="stat-label">Hit Score:</span>
            <span className="stat-value">{video.hitScore.toFixed(2)}</span>
          </div>
        </div>

        <div className="video-actions">
          <a
            href={video.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="watch-button"
            style={{ width: "100%" }}
          >
            ▶ YouTube에서 보기
          </a>
        </div>
        </div>
      </div>
    </div>
  );
}
