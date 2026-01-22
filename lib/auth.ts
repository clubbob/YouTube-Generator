import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "auth_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "default-secret-key-change-in-production";

/**
 * 세션 토큰 생성 (간단한 방식)
 */
export function createSessionToken(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  return Buffer.from(`${timestamp}-${random}`).toString("base64");
}

/**
 * 세션 검증
 */
export function verifySessionToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [timestamp] = decoded.split("-");
    const sessionTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    // 세션 유효 기간: 7일
    const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;
    
    return now - sessionTime < SESSION_DURATION;
  } catch {
    return false;
  }
}

/**
 * 현재 사용자가 로그인되어 있는지 확인
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (!sessionToken) {
      return false;
    }
    
    return verifySessionToken(sessionToken);
  } catch {
    return false;
  }
}

/**
 * 로그인 정보 검증
 */
export function validateCredentials(email: string, password: string): boolean {
  const validEmail = process.env.LOGIN_EMAIL || "clubbob@naver.com";
  const validPassword = process.env.LOGIN_PASSWORD || "hsko2014!!";
  
  return email === validEmail && password === validPassword;
}
