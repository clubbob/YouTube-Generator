"use client";

import { useState, useEffect } from "react";
import VideoCard from "@/components/VideoCard";
import type { SavedVideo } from "@/types";
import type { YouTubeVideoItem } from "@/types";

export default function SavedPage() {
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState("");
  const [editMemo, setEditMemo] = useState("");

  useEffect(() => {
    loadSavedVideos();
  }, []);

  const loadSavedVideos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/saved");
      if (!response.ok) {
        throw new Error("저장된 영상을 불러오는 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      setSavedVideos(data.items || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/saved?videoId=${videoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("삭제 중 오류가 발생했습니다.");
      }

      setSavedVideos((prev) => prev.filter((v) => v.videoId !== videoId));
    } catch (err: any) {
      alert(err.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (video: SavedVideo) => {
    setEditingVideoId(video.videoId);
    setEditTags(video.tags.join(", "));
    setEditMemo(video.memo || "");
  };

  const handleSaveEdit = async (videoId: string) => {
    try {
      const tags = editTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const response = await fetch("/api/saved", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoId,
          tags,
          memo: editMemo,
        }),
      });

      if (!response.ok) {
        throw new Error("업데이트 중 오류가 발생했습니다.");
      }

      setSavedVideos((prev) =>
        prev.map((v) =>
          v.videoId === videoId
            ? { ...v, tags, memo: editMemo }
            : v
        )
      );

      setEditingVideoId(null);
    } catch (err: any) {
      alert(err.message || "업데이트 중 오류가 발생했습니다.");
    }
  };

  const convertToYouTubeItem = (saved: SavedVideo): YouTubeVideoItem => {
    return {
      videoId: saved.videoId,
      title: saved.title,
      channelTitle: saved.channelTitle,
      thumbnailUrl: "",
      publishedAt: saved.createdAt,
      durationSec: 0,
      views: saved.views,
      subs: saved.subs,
      viewsPerDay: saved.viewsPerDay,
      viewsToSubsRatio: 0,
      hitScore: saved.hitScore,
      youtubeUrl: `https://www.youtube.com/watch?v=${saved.videoId}`,
    };
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <main className="container">
      <header className="header">
        <h1>저장된 영상</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <a href="/" className="back-link">
            ← 검색으로 돌아가기
          </a>
          <button
            onClick={handleRefresh}
            className="refresh-button"
            title="페이지 새로고침"
          >
            🔄 새로고침
          </button>
        </div>
      </header>

      {isLoading && (
        <div className="loading">
          <p>로딩 중...</p>
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && savedVideos.length === 0 && (
        <div className="empty-state">
          <p>저장된 영상이 없습니다.</p>
        </div>
      )}

      {!isLoading && savedVideos.length > 0 && (
        <div className="results-section">
          <h2>저장된 영상 ({savedVideos.length}개)</h2>
          <div className="video-list">
            {savedVideos.map((saved) => (
              <div key={saved.videoId} className="saved-video-item">
                <VideoCard video={convertToYouTubeItem(saved)} />
                <div className="saved-video-actions">
                  {editingVideoId === saved.videoId ? (
                    <div className="edit-form">
                      <div className="form-group">
                        <label>태그 (쉼표로 구분)</label>
                        <input
                          type="text"
                          value={editTags}
                          onChange={(e) => setEditTags(e.target.value)}
                          placeholder="예: ai, productivity, tips"
                        />
                      </div>
                      <div className="form-group">
                        <label>메모</label>
                        <textarea
                          value={editMemo}
                          onChange={(e) => setEditMemo(e.target.value)}
                          placeholder="메모를 입력하세요..."
                          rows={3}
                        />
                      </div>
                      <div className="edit-buttons">
                        <button onClick={() => handleSaveEdit(saved.videoId)}>
                          저장
                        </button>
                        <button
                          onClick={() => setEditingVideoId(null)}
                          className="cancel-button"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="saved-meta">
                      {saved.tags.length > 0 && (
                        <div className="tags">
                          {saved.tags.map((tag, idx) => (
                            <span key={idx} className="tag">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {saved.memo && (
                        <div className="memo">
                          <strong>메모:</strong> {saved.memo}
                        </div>
                      )}
                      <div className="action-buttons">
                        <button onClick={() => handleEdit(saved)}>
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(saved.videoId)}
                          className="delete-button"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
