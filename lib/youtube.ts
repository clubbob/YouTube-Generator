import { google } from "googleapis";
import type { YouTubeSearchRequest, YouTubeVideoItem } from "@/types";
import { isShortsLike } from "./scoring";

const youtube = google.youtube("v3");

/**
 * YouTube Data API v3를 사용한 검색
 */
export async function searchYouTubeVideos(
  params: YouTubeSearchRequest
): Promise<YouTubeVideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY가 설정되지 않았습니다.");
  }

  // publishedAfter 계산
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - params.timeframeDays);
  const publishedAfterISO = publishedAfter.toISOString();

  // 1. search.list 호출
  const searchResponse = await youtube.search.list({
    key: apiKey,
    part: ["id", "snippet"],
    q: params.query,
    publishedAfter: publishedAfterISO,
    maxResults: Math.min(params.maxResults || 100, 100),
    regionCode: params.regionCode || "US",
    type: ["video"],
    order: "viewCount", // 초기 정렬은 조회수 기준
  });

  if (!searchResponse.data.items) {
    return [];
  }

  const videoIds = searchResponse.data.items.map((item) => item.id?.videoId).filter(Boolean) as string[];

  if (videoIds.length === 0) {
    return [];
  }

  // 2. videos.list 호출 (통계 및 상세 정보)
  const videosResponse = await youtube.videos.list({
    key: apiKey,
    part: ["statistics", "contentDetails", "snippet"],
    id: videoIds,
  });

  if (!videosResponse.data.items) {
    return [];
  }

  // 3. 채널 정보 수집 (배치 처리)
  const channelIds = [
    ...new Set(
      videosResponse.data.items
        .map((item) => item.snippet?.channelId)
        .filter(Boolean) as string[]
    ),
  ];

  const channelsMap = new Map<string, number>();
  if (channelIds.length > 0) {
    // 채널 정보는 50개씩 배치로 조회
    for (let i = 0; i < channelIds.length; i += 50) {
      const batch = channelIds.slice(i, i + 50);
      const channelsResponse = await youtube.channels.list({
        key: apiKey,
        part: ["statistics"],
        id: batch,
      });

      channelsResponse.data.items?.forEach((channel) => {
        const channelId = channel.id;
        const subscriberCount = parseInt(
          channel.statistics?.subscriberCount || "0"
        );
        if (channelId) {
          channelsMap.set(channelId, subscriberCount);
        }
      });
    }
  }

  // 4. 데이터 변환 및 필터링
  const now = new Date();
  const items: YouTubeVideoItem[] = [];

  for (const video of videosResponse.data.items) {
    const videoId = video.id;
    const channelId = video.snippet?.channelId;
    const publishedAt = video.snippet?.publishedAt;
    const duration = video.contentDetails?.duration;

    if (!videoId || !channelId || !publishedAt || !duration) {
      continue;
    }

    // Duration 파싱 (ISO 8601 형식: PT1M30S)
    const durationSec = parseDuration(duration);
    const views = parseInt(video.statistics?.viewCount || "0");
    const subs = channelsMap.get(channelId) || 0;
    const title = video.snippet?.title || "";
    const description = video.snippet?.description || "";
    const thumbnailUrl =
      video.snippet?.thumbnails?.high?.url ||
      video.snippet?.thumbnails?.default?.url ||
      "";

    // 콘텐츠 타입 필터링
    if (params.contentType === "shorts") {
      // 쇼츠: 1분(60초) 이하
      if (durationSec > 60) {
        continue;
      }
    } else if (params.contentType === "regular") {
      // 기본: 1분(60초) 초과 ~ 5분(300초) 미만
      if (durationSec <= 60 || durationSec >= 300) {
        continue;
      }
    } else if (params.contentType === "longform") {
      // 장편: 5분(300초) 이상
      if (durationSec < 300) {
        continue;
      }
    }
    // params.contentType === "all"인 경우 필터링 없음

    // 구독자 수 필터링
    if (params.filters?.subscriberMax && subs > params.filters.subscriberMax) {
      continue;
    }

    // 최소 조회수 필터링
    if (params.filters?.minViews && views < params.filters.minViews) {
      continue;
    }

    // Views per Day 계산
    const ageDays = Math.max(
      1,
      Math.floor((now.getTime() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24))
    );
    const viewsPerDay = views / ageDays;

    // Views / Subs Ratio 계산
    const viewsToSubsRatio = views / Math.max(1, subs);

    items.push({
      videoId,
      title,
      channelTitle: video.snippet?.channelTitle || "",
      thumbnailUrl,
      publishedAt,
      durationSec,
      views,
      subs,
      viewsPerDay: Math.round(viewsPerDay * 100) / 100,
      viewsToSubsRatio: Math.round(viewsToSubsRatio * 100) / 100,
      hitScore: 0, // 나중에 scoring.ts에서 계산
      youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }

  return items;
}

/**
 * ISO 8601 Duration 파싱 (예: PT1M30S -> 90초)
 */
function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");

  return hours * 3600 + minutes * 60 + seconds;
}
