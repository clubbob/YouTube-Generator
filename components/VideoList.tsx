"use client";

import VideoCard from "./VideoCard";
import type { YouTubeVideoItem } from "@/types";

interface VideoListProps {
  videos: YouTubeVideoItem[];
  onSave?: (video: YouTubeVideoItem) => void;
  savedVideoIds?: Set<string>;
}

export default function VideoList({
  videos,
  onSave,
  savedVideoIds,
}: VideoListProps) {
  if (videos.length === 0) {
    return (
      <div className="empty-state">
        <p>검색 결과가 없습니다.</p>
      </div>
    );
  }

  // Hit Score 기준 내림차순 정렬 (가장 높은 점수가 위에)
  const sortedVideos = [...videos].sort((a, b) => b.hitScore - a.hitScore);

  return (
    <div className="video-list">
      {sortedVideos.map((video, index) => (
        <VideoCard
          key={video.videoId}
          video={video}
          onSave={onSave}
          isSaved={savedVideoIds?.has(video.videoId)}
          rank={index + 1}
        />
      ))}
    </div>
  );
}
