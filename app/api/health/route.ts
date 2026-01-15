import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // 간단하고 빠른 응답을 위해 타임아웃 설정
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    const checkPromise = Promise.resolve().then(() => {
      const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;
      const hasFirebaseProjectId = !!process.env.FIREBASE_ADMIN_PROJECT_ID;
      const hasFirebaseEmail = !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
      const hasFirebaseKey = !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;

      return {
        status: "ok",
        environment: {
          youtubeApiKey: hasYouTubeKey ? "설정됨" : "미설정",
          firebaseProjectId: hasFirebaseProjectId ? "설정됨" : "미설정",
          firebaseEmail: hasFirebaseEmail ? "설정됨" : "미설정",
          firebasePrivateKey: hasFirebaseKey ? "설정됨" : "미설정",
        },
        allConfigured: hasYouTubeKey && hasFirebaseProjectId && hasFirebaseEmail && hasFirebaseKey,
      };
    });

    const data = await Promise.race([checkPromise, timeoutPromise]) as any;

  // Accept 헤더 확인하여 HTML 또는 JSON 반환
  const accept = request.headers.get("accept") || "";
  
  if (accept.includes("text/html")) {
    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Health Check - YouTube Generator</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      padding: 40px;
      max-width: 600px;
      width: 100%;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 24px;
    }
    .status {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 30px;
      ${data.allConfigured 
        ? 'background: #d4edda; color: #155724;' 
        : 'background: #f8d7da; color: #721c24;'
      }
    }
    .environment {
      margin-top: 20px;
    }
    .env-item {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .env-item:last-child {
      border-bottom: none;
    }
    .env-label {
      color: #666;
      font-weight: 500;
    }
    .env-value {
      font-weight: 600;
      ${data.allConfigured ? 'color: #28a745;' : 'color: #dc3545;'}
    }
    .json-view {
      margin-top: 30px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .json-view pre {
      color: #333;
      font-family: "Courier New", monospace;
      font-size: 14px;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .back-link {
      display: inline-block;
      margin-top: 20px;
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Health Check</h1>
    <div class="status">
      ${data.allConfigured ? "✅ 모든 설정 완료" : "⚠️ 설정 필요"}
    </div>
    
    <div class="environment">
      <div class="env-item">
        <span class="env-label">YouTube API Key</span>
        <span class="env-value">${data.environment.youtubeApiKey}</span>
      </div>
      <div class="env-item">
        <span class="env-label">Firebase Project ID</span>
        <span class="env-value">${data.environment.firebaseProjectId}</span>
      </div>
      <div class="env-item">
        <span class="env-label">Firebase Email</span>
        <span class="env-value">${data.environment.firebaseEmail}</span>
      </div>
      <div class="env-item">
        <span class="env-label">Firebase Private Key</span>
        <span class="env-value">${data.environment.firebasePrivateKey}</span>
      </div>
    </div>

    <div class="json-view">
      <strong>JSON 응답:</strong>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    </div>

    <a href="/" class="back-link">← 메인 페이지로 돌아가기</a>
  </div>
</body>
</html>
    `;
    
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

    // JSON 응답 (예쁘게 포맷팅)
    return NextResponse.json(data, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("Health check 오류:", error);
    return NextResponse.json(
      {
        status: "error",
        error: error.message || "Health check 실패",
        environment: {
          youtubeApiKey: !!process.env.YOUTUBE_API_KEY ? "설정됨" : "미설정",
          firebaseProjectId: !!process.env.FIREBASE_ADMIN_PROJECT_ID ? "설정됨" : "미설정",
          firebaseEmail: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? "설정됨" : "미설정",
          firebasePrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY ? "설정됨" : "미설정",
        },
      },
      { status: 500 }
    );
  }
}
