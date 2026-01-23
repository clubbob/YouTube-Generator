import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import type { SearchCache, SavedVideo, ChannelConcept, PromptTemplate } from "@/types";

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

// Channel Concepts 관련 함수
export async function getChannelConcepts(): Promise<ChannelConcept[]> {
  const db = getDb();
  if (!db) {
    console.warn("Firebase가 설정되지 않아 저장된 채널 컨셉을 불러올 수 없습니다.");
    return [];
  }
  
  try {
    const snapshot = await db
      .collection("channel_concepts")
      .doc(USER_ID)
      .collection("items")
      .orderBy("createdAt", "desc")
      .get();
    
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      conceptId: doc.id,
    } as ChannelConcept));
  } catch (error: any) {
    console.warn("저장된 채널 컨셉 조회 실패:", error.message);
    return [];
  }
}

export async function saveChannelConcept(concept: ChannelConcept): Promise<string> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase가 설정되지 않아 채널 컨셉을 저장할 수 없습니다. Firebase 설정을 확인하세요.");
  }
  
  try {
    const now = new Date().toISOString();
    
    let docRef;
    if (concept.conceptId) {
      // 기존 문서 업데이트
      docRef = db
        .collection("channel_concepts")
        .doc(USER_ID)
        .collection("items")
        .doc(concept.conceptId);
      
      // conceptId를 제외한 업데이트 데이터 생성
      const { conceptId, ...updateData } = concept;
      await docRef.update({
        ...updateData,
        updatedAt: now,
      });
      return concept.conceptId;
    } else {
      // 새 문서 생성
      docRef = db
        .collection("channel_concepts")
        .doc(USER_ID)
        .collection("items")
        .doc();
      
      const conceptData: ChannelConcept = {
        ...concept,
        createdAt: concept.createdAt || now,
        updatedAt: now,
      };
      await docRef.set(conceptData);
      return docRef.id;
    }
  } catch (error: any) {
    console.error("채널 컨셉 저장 실패:", error.message);
    throw error;
  }
}

export async function deleteChannelConcept(conceptId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase가 설정되지 않아 채널 컨셉을 삭제할 수 없습니다.");
  }
  
  try {
    await db
      .collection("channel_concepts")
      .doc(USER_ID)
      .collection("items")
      .doc(conceptId)
      .delete();
  } catch (error: any) {
    console.error("채널 컨셉 삭제 실패:", error.message);
    throw error;
  }
}

// Prompt Templates 관련 함수
export async function getPromptTemplates(templateType?: string): Promise<PromptTemplate[]> {
  const db = getDb();
  if (!db) {
    console.warn("Firebase가 설정되지 않아 프롬프트 템플릿을 불러올 수 없습니다.");
    return [];
  }
  
  try {
    let query = db
      .collection("prompt_templates")
      .doc(USER_ID)
      .collection("items")
      .orderBy("updatedAt", "desc");
    
    if (templateType) {
      query = query.where("templateType", "==", templateType) as any;
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      templateId: doc.id,
    } as PromptTemplate));
  } catch (error: any) {
    console.warn("프롬프트 템플릿 조회 실패:", error.message);
    return [];
  }
}

export async function getActivePromptTemplate(templateType: string): Promise<PromptTemplate | null> {
  const db = getDb();
  if (!db) {
    console.warn("Firebase가 설정되지 않아 프롬프트 템플릿을 불러올 수 없습니다.");
    return null;
  }
  
  try {
    const snapshot = await db
      .collection("prompt_templates")
      .doc(USER_ID)
      .collection("items")
      .where("templateType", "==", templateType)
      .where("isActive", "==", true)
      .orderBy("updatedAt", "desc")
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return {
      ...doc.data(),
      templateId: doc.id,
    } as PromptTemplate;
  } catch (error: any) {
    console.warn("활성 프롬프트 템플릿 조회 실패:", error.message);
    return null;
  }
}

export async function savePromptTemplate(template: PromptTemplate): Promise<string> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase가 설정되지 않아 프롬프트 템플릿을 저장할 수 없습니다. Firebase 설정을 확인하세요.");
  }
  
  try {
    const now = new Date().toISOString();
    
    let docRef;
    if (template.templateId) {
      // 기존 문서 업데이트
      docRef = db
        .collection("prompt_templates")
        .doc(USER_ID)
        .collection("items")
        .doc(template.templateId);
      
      // templateId를 제외한 업데이트 데이터 생성
      const { templateId, ...updateData } = template;
      await docRef.update({
        ...updateData,
        updatedAt: now,
      });
      return template.templateId;
    } else {
      // 새 문서 생성
      docRef = db
        .collection("prompt_templates")
        .doc(USER_ID)
        .collection("items")
        .doc();
      
      const templateData: PromptTemplate = {
        ...template,
        isActive: template.isActive !== undefined ? template.isActive : true,
        createdAt: template.createdAt || now,
        updatedAt: now,
      };
      await docRef.set(templateData);
      return docRef.id;
    }
  } catch (error: any) {
    console.error("프롬프트 템플릿 저장 실패:", error.message);
    throw error;
  }
}

export async function deletePromptTemplate(templateId: string): Promise<void> {
  const db = getDb();
  if (!db) {
    throw new Error("Firebase가 설정되지 않아 프롬프트 템플릿을 삭제할 수 없습니다.");
  }
  
  try {
    await db
      .collection("prompt_templates")
      .doc(USER_ID)
      .collection("items")
      .doc(templateId)
      .delete();
  } catch (error: any) {
    console.error("프롬프트 템플릿 삭제 실패:", error.message);
    throw error;
  }
}
