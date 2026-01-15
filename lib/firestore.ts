import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import type { SearchCache, SavedVideo } from "@/types";

// Firebase Admin 초기화 (서버 사이드 전용)
let db: Firestore | null = null;

function getDb(): Firestore | null {
  // 빌드 시점에 실행되지 않도록 체크
  if (typeof window !== 'undefined') {
    return null;
  }

  // Firebase가 설정되지 않았으면 null 반환 (선택적 기능)
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return null; // Firebase 미설정 시 null 반환
  }

  if (!db) {
    try {
      if (getApps().length === 0) {
        let processedPrivateKey = privateKey;

        // Private key 정리
        // 1. 앞뒤 따옴표 제거
        processedPrivateKey = processedPrivateKey.trim();
        if (processedPrivateKey.startsWith('"') && processedPrivateKey.endsWith('"')) {
          processedPrivateKey = processedPrivateKey.slice(1, -1);
        }
        if (processedPrivateKey.startsWith("'") && processedPrivateKey.endsWith("'")) {
          processedPrivateKey = processedPrivateKey.slice(1, -1);
        }
        
        // 2. \\n을 실제 줄바꿈으로 변환
        processedPrivateKey = processedPrivateKey.replace(/\\n/g, "\n");
        
        // 3. 앞뒤 공백 제거
        processedPrivateKey = processedPrivateKey.trim();

        initializeApp({
          credential: cert({
            projectId: projectId.trim(),
            clientEmail: clientEmail.trim(),
            privateKey: processedPrivateKey,
          }),
        });
      }
      db = getFirestore();
    } catch (error: any) {
      console.error("Firebase Admin 초기화 오류:", error.message);
      console.warn("Firebase가 설정되지 않았거나 초기화에 실패했습니다. 캐시 및 저장 기능은 사용할 수 없습니다.");
      return null; // 초기화 실패 시 null 반환
    }
  }
  return db;
}

// Search Cache 관련 함수
export async function getSearchCache(cacheId: string): Promise<SearchCache | null> {
  const db = getDb();
  if (!db) return null; // Firebase 미설정 시 null 반환
  
  try {
    const doc = await db.collection("search_cache").doc(cacheId).get();
    if (!doc.exists) return null;
    return doc.data() as SearchCache;
  } catch (error: any) {
    console.warn("캐시 조회 실패:", error.message);
    return null;
  }
}

export async function saveSearchCache(
  cacheId: string,
  data: SearchCache
): Promise<void> {
  const db = getDb();
  if (!db) return; // Firebase 미설정 시 무시
  
  try {
    await db.collection("search_cache").doc(cacheId).set(data);
  } catch (error: any) {
    console.warn("캐시 저장 실패:", error.message);
  }
}

// Saved Videos 관련 함수
const USER_ID = "local"; // v0.1에서는 하드코딩

export async function getSavedVideos(): Promise<SavedVideo[]> {
  const db = getDb();
  if (!db) {
    console.warn("Firebase가 설정되지 않아 저장된 영상을 불러올 수 없습니다.");
    return [];
  }
  
  try {
    const snapshot = await db
      .collection("saved_videos")
      .doc(USER_ID)
      .collection("items")
      .get();
    
    return snapshot.docs.map((doc) => doc.data() as SavedVideo);
  } catch (error: any) {
    console.warn("저장된 영상 조회 실패:", error.message);
    return [];
  }
}

export async function saveVideo(video: SavedVideo): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase가 설정되지 않아 영상을 저장할 수 없습니다. Firebase 설정을 확인하세요.");
  }
  
  try {
    await db
      .collection("saved_videos")
      .doc(USER_ID)
      .collection("items")
      .doc(video.videoId)
      .set(video);
  } catch (error: any) {
    console.error("영상 저장 실패:", error.message);
    throw error;
  }
}

export async function deleteSavedVideo(videoId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase가 설정되지 않아 영상을 삭제할 수 없습니다.");
  }
  
  try {
    await db
      .collection("saved_videos")
      .doc(USER_ID)
      .collection("items")
      .doc(videoId)
      .delete();
  } catch (error: any) {
    console.error("영상 삭제 실패:", error.message);
    throw error;
  }
}

export async function updateSavedVideo(
  videoId: string,
  updates: Partial<SavedVideo>
): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase가 설정되지 않아 영상을 업데이트할 수 없습니다.");
  }
  
  try {
    await db
      .collection("saved_videos")
      .doc(USER_ID)
      .collection("items")
      .doc(videoId)
      .update(updates);
  } catch (error: any) {
    console.error("영상 업데이트 실패:", error.message);
    throw error;
  }
}
