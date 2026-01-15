import type { YouTubeVideoItem } from "@/types";

/**
 * Freshness Weight 계산
 * 0-7일: 1.2
 * 8-30일: 1.0
 * 31-90일: 0.8
 */
export function getFreshnessWeight(publishedAt: string): number {
  const now = new Date();
  const published = new Date(publishedAt);
  const ageDays = Math.max(1, Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24)));
  
  if (ageDays <= 7) return 1.2;
  if (ageDays <= 30) return 1.0;
  return 0.8;
}

/**
 * Min-Max 정규화
 */
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

/**
 * Hit Score 계산
 * HitScore = freshnessWeight * (0.6 * normalize(viewsPerDay) + 0.4 * normalize(viewsToSubsRatio))
 */
export function calculateHitScore(
  items: YouTubeVideoItem[]
): YouTubeVideoItem[] {
  if (items.length === 0) return items;
  
  // 최소/최대값 계산
  const viewsPerDayValues = items.map((item) => item.viewsPerDay);
  const viewsToSubsRatioValues = items.map((item) => item.viewsToSubsRatio);
  
  const minViewsPerDay = Math.min(...viewsPerDayValues);
  const maxViewsPerDay = Math.max(...viewsPerDayValues);
  const minViewsToSubsRatio = Math.min(...viewsToSubsRatioValues);
  const maxViewsToSubsRatio = Math.max(...viewsToSubsRatioValues);
  
  // Hit Score 계산 및 정렬
  return items
    .map((item) => {
      const freshnessWeight = getFreshnessWeight(item.publishedAt);
      const normalizedViewsPerDay = normalize(
        item.viewsPerDay,
        minViewsPerDay,
        maxViewsPerDay
      );
      const normalizedViewsToSubsRatio = normalize(
        item.viewsToSubsRatio,
        minViewsToSubsRatio,
        maxViewsToSubsRatio
      );
      
      const hitScore =
        freshnessWeight *
        (0.6 * normalizedViewsPerDay + 0.4 * normalizedViewsToSubsRatio);
      
      return {
        ...item,
        hitScore: Math.round(hitScore * 100) / 100, // 소수점 2자리
      };
    })
    .sort((a, b) => b.hitScore - a.hitScore); // 내림차순 정렬
}

/**
 * Shorts 판별 (휴리스틱)
 * - 제목 또는 설명에 #shorts 포함
 * - 영상 길이 ≤ 60초
 */
export function isShortsLike(
  title: string,
  description: string,
  durationSec: number
): boolean {
  const hasShortsTag =
    title.toLowerCase().includes("#shorts") ||
    description.toLowerCase().includes("#shorts");
  const isShortDuration = durationSec <= 60;
  
  return hasShortsTag || isShortDuration;
}
