import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "auth_session";

export async function POST() {
  const response = NextResponse.json(
    { message: "로그아웃 성공", success: true },
    { status: 200 }
  );

  // 쿠키 삭제
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
