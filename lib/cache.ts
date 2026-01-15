import crypto from "crypto";
import { getSearchCache, saveSearchCache } from "./firestore";
import type { YouTubeSearchRequest, YouTubeVideoItem } from "@/types";

/**
 * 검색 파라미터로부터 캐시 ID 생성
 */
export function generateCacheId(params: YouTubeSearchRequest): string {
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(params))
    .digest("hex");
  return hash;
}

/**
 * 캐시 유효성 검사 (6~24시간)
 */
export function isCacheValid(cache: { expiresAt: string }): boolean {
  return new Date(cache.expiresAt) > new Date();
}

/**
 * 캐시 만료 시간 생성 (기본 6시간)
 */
export function getExpiresAt(hours: number = 6): string {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt.toISOString();
}

/**
 * 검색 결과 캐시 조회
 */
export async function getCachedResults(
  params: YouTubeSearchRequest
): Promise<YouTubeVideoItem[] | null> {
  const cacheId = generateCacheId(params);
  const cache = await getSearchCache(cacheId);
  
  if (!cache || !isCacheValid(cache)) {
    return null;
  }
  
  return cache.results;
}

/**
 * 검색 결과 캐시 저장
 */
export async function setCachedResults(
  params: YouTubeSearchRequest,
  results: YouTubeVideoItem[]
): Promise<string> {
  const cacheId = generateCacheId(params);
  const expiresAt = getExpiresAt(6);
  
  await saveSearchCache(cacheId, {
    query: params.query,
    params,
    createdAt: new Date().toISOString(),
    expiresAt,
    results,
  });
  
  return cacheId;
}
