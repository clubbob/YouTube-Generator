import { NextRequest, NextResponse } from "next/server";

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

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) {
    return NextResponse.json({ authenticated: false });
  }
  
  const isAuthenticated = verifySessionToken(sessionToken);
  return NextResponse.json({ authenticated: isAuthenticated });
}
