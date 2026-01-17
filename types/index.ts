// YouTube API 관련 타입
export interface YouTubeSearchRequest {
  query: string;
  timeframeDays: 7 | 30 | 90;
  regionCode?: string;
  language?: string;
  contentType?: "shorts_like" | "all";
  maxResults?: number;
  filters?: {
    subscriberMax?: number;
    minViews?: number;
    minDurationSec?: number;
    hasShortsTag?: boolean;
  };
}

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSec: number;
  views: number;
  subs: number;
  viewsPerDay: number;
  viewsToSubsRatio: number;
  hitScore: number;
  youtubeUrl: string;
}

export interface YouTubeSearchResponse {
  items: YouTubeVideoItem[];
  totalResults?: number;
  cacheId?: string;
}

// Firestore 스키마 타입
export interface SearchCache {
  query: string;
  params: YouTubeSearchRequest;
  createdAt: string;
  expiresAt: string;
  results: YouTubeVideoItem[];
}

export interface SavedVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  views: number;
  subs: number;
  viewsPerDay: number;
  hitScore: number;
  tags: string[];
  memo?: string;
  createdAt: string;
}

export interface ChannelConcept {
  conceptId?: string;
  channelNames?: string[];
  slogan?: string;
  targetAudience?: string;
  contentCategories?: string[];
  videoStructure?: string;
  toneAndCharacter?: string;
  differentiation?: string;
  expansion?: string;
  createdAt?: string;
  updatedAt?: string;
}
