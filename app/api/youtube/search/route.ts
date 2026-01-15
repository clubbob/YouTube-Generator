import { NextRequest, NextResponse } from "next/server";
import { calculateHitScore } from "@/lib/scoring";
import { isShortsLike } from "@/lib/scoring";
import type { YouTubeVideoItem, YouTubeSearchRequest, YouTubeSearchResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    let body: YouTubeSearchRequest;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "잘못된 요청 형식입니다." },
        { status: 400 }
      );
    }
    
    const { query, timeframeDays, maxResults = 50, filters, contentType } = body;
    
    // minDurationSec이 문자열인 경우 숫자로 변환
    if (filters?.minDurationSec && typeof filters.minDurationSec === 'string') {
      filters.minDurationSec = parseInt(filters.minDurationSec) || undefined;
    }

    // 입력 검증
    if (!query) {
      return NextResponse.json(
        { error: "query는 필수입니다." },
        { status: 400 }
      );
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.error("[YouTube Search] YOUTUBE_API_KEY is missing");
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    console.log("[YouTube Search] Starting search:", {
      query,
      timeframeDays,
      maxResults,
    });

    // 1. search.list 호출
    const publishedAfter = new Date();
    if (timeframeDays) {
      publishedAfter.setDate(publishedAfter.getDate() - timeframeDays);
    }
    const publishedAfterISO = publishedAfter.toISOString();

    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet` +
      `&q=${encodeURIComponent(query)}` +
      `&type=video` +
      `&maxResults=${Math.min(maxResults, 50)}` +
      `&order=viewCount` +
      (timeframeDays ? `&publishedAfter=${publishedAfterISO}` : "") +
      `&key=${apiKey}`;

    console.log("[YouTube Search] search.list URL:", searchUrl);

    const searchRes = await fetch(searchUrl);
    let searchData;
    try {
      searchData = await searchRes.json();
    } catch (e) {
      const text = await searchRes.text();
      console.error("[YouTube Search] search.list JSON parse error:", text);
      return NextResponse.json(
        {
          error: "YouTube API 응답 파싱 실패",
          details: text.substring(0, 500),
        },
        { status: 500 }
      );
    }

    console.log("[YouTube Search] search.list Status:", searchRes.status);
    console.log("[YouTube Search] search.list OK:", searchRes.ok);

    if (!searchRes.ok || searchData.error) {
      console.error("[YouTube Search] search.list Error:", JSON.stringify(searchData.error, null, 2));
      return NextResponse.json(
        {
          error: "YouTube API 호출 실패",
          details: searchData.error,
        },
        { status: searchRes.status }
      );
    }

    if (!searchData.items || searchData.items.length === 0) {
      console.log("[YouTube Search] No items found");
      return NextResponse.json({
        items: [],
        totalResults: 0,
        raw: {
          search: searchData,
        },
      });
    }

    console.log("[YouTube Search] Found", searchData.items.length, "videos");

    // 2. videos.list 호출 (비디오 상세 정보)
    const videoIds = searchData.items
      .map((item: any) => item.id?.videoId)
      .filter(Boolean)
      .join(",");

    const videosUrl =
      `https://www.googleapis.com/youtube/v3/videos` +
      `?part=snippet,statistics,contentDetails` +
      `&id=${videoIds}` +
      `&key=${apiKey}`;

    console.log("[YouTube Search] videos.list URL:", videosUrl);

    const videosRes = await fetch(videosUrl);
    let videosData;
    try {
      videosData = await videosRes.json();
    } catch (e) {
      const text = await videosRes.text();
      console.error("[YouTube Search] videos.list JSON parse error:", text);
      return NextResponse.json(
        {
          error: "YouTube videos.list API 응답 파싱 실패",
          details: text.substring(0, 500),
        },
        { status: 500 }
      );
    }

    console.log("[YouTube Search] videos.list Status:", videosRes.status);
    console.log("[YouTube Search] videos.list OK:", videosRes.ok);

    if (!videosRes.ok || videosData.error) {
      console.error("[YouTube Search] videos.list Error:", JSON.stringify(videosData.error, null, 2));
      return NextResponse.json(
        {
          error: "YouTube videos.list API 호출 실패",
          details: videosData.error,
        },
        { status: videosRes.status }
      );
    }

    // 3. channels.list 호출 (채널 정보)
    const channelIds = [
      ...new Set(
        videosData.items
          ?.map((item: any) => item.snippet?.channelId)
          .filter(Boolean) || []
      ),
    ];

    let channelsData = { items: [] };
    if (channelIds.length > 0) {
      // 50개씩 배치 처리
      const channelBatches = [];
      for (let i = 0; i < channelIds.length; i += 50) {
        channelBatches.push(channelIds.slice(i, i + 50));
      }

      const allChannels: any[] = [];
      for (const batch of channelBatches) {
        const channelsUrl =
          `https://www.googleapis.com/youtube/v3/channels` +
          `?part=snippet,statistics` +
          `&id=${batch.join(",")}` +
          `&key=${apiKey}`;

        console.log("[YouTube Search] channels.list URL (batch):", channelsUrl);

        const channelsRes = await fetch(channelsUrl);
        const batchData = await channelsRes.json();

        console.log("[YouTube Search] channels.list Status:", channelsRes.status);

        if (channelsRes.ok && batchData.items) {
          allChannels.push(...batchData.items);
        } else {
          console.warn("[YouTube Search] channels.list Error:", batchData.error);
        }
      }

      channelsData = { items: allChannels };
      console.log("[YouTube Search] Found", allChannels.length, "channels");
    }

    // 채널 정보를 Map으로 변환 (빠른 조회를 위해)
    const channelsMap = new Map<string, number>();
    channelsData.items.forEach((channel: any) => {
      if (channel.id && channel.statistics?.subscriberCount) {
        channelsMap.set(
          channel.id,
          parseInt(channel.statistics.subscriberCount) || 0
        );
      }
    });

    // 4. 데이터 변환 및 필터링
    const now = new Date();
    const items: YouTubeVideoItem[] = [];

    for (const video of videosData.items || []) {
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
        video.snippet?.thumbnails?.medium?.url ||
        video.snippet?.thumbnails?.default?.url ||
        "";

      // 최소 영상 길이 필터링
      if (filters?.minDurationSec && durationSec < filters.minDurationSec) {
        continue;
      }

      // Shorts 필터링
      if (
        contentType === "shorts_like" &&
        !isShortsLike(title, description, durationSec)
      ) {
        continue;
      }

      // 구독자 수 필터링
      if (filters?.subscriberMax && subs > filters.subscriberMax) {
        continue;
      }

      // 최소 조회수 필터링
      if (filters?.minViews && views < filters.minViews) {
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
        hitScore: 0, // 나중에 calculateHitScore에서 계산
        youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
      });
    }

    console.log("[YouTube Search] Processed", items.length, "videos after filtering");

    // 5. Hit Score 계산 및 정렬
    const scoredItems = calculateHitScore(items);

    console.log("[YouTube Search] Hit Score calculated, top score:", scoredItems[0]?.hitScore);

    return NextResponse.json<YouTubeSearchResponse>({
      items: scoredItems,
      totalResults: scoredItems.length,
    });
  } catch (error: any) {
    console.error("[YouTube Search] Unexpected Error:", error.message);
    console.error("[YouTube Search] Error Stack:", error.stack);

    return NextResponse.json(
      {
        error: "검색 중 오류가 발생했습니다.",
        message: error.message,
      },
      { status: 500 }
    );
  }
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
