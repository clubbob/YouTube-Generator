import { NextRequest, NextResponse } from "next/server";
import { validateCredentials, createSessionToken } from "@/lib/auth";

const SESSION_COOKIE_NAME = "auth_session";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "이메일과 비밀번호를 입력해주세요." },
        { status: 400 }
      );
    }

    // 자격 증명 검증
    if (!validateCredentials(email, password)) {
      return NextResponse.json(
        { message: "이메일 또는 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 세션 토큰 생성
    const sessionToken = createSessionToken();

    // 쿠키 설정
    const response = NextResponse.json(
      { message: "로그인 성공", success: true },
      { status: 200 }
    );

    // 쿠키 설정 (7일 유효)
    response.cookies.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("[Login API] Error:", error.message);
    return NextResponse.json(
      { message: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
