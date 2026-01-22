import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "auth_session";

function verifySessionToken(token: string): boolean {
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 로그인 페이지와 API 경로는 인증 체크 제외
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    // 로그인 페이지에 이미 로그인된 경우 메인으로 리다이렉트
    if (pathname === "/login" && sessionToken && verifySessionToken(sessionToken)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // 인증이 필요한 페이지 접근 시
  if (!sessionToken || !verifySessionToken(sessionToken)) {
    // 로그인 페이지로 리다이렉트
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청 경로와 일치:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public 폴더의 파일들
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
