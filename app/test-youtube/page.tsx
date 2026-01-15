"use client";

import { useState } from "react";

export default function TestYouTubePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testPing = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/youtube/ping");
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/youtube/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "test",
          timeframeDays: 30,
          maxResults: 10,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>YouTube API 테스트</h1>

      <div style={{ marginBottom: "30px" }}>
        <button
          onClick={testPing}
          disabled={loading}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            fontSize: "16px",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "테스트 중..." : "1. Ping 테스트"}
        </button>

        <button
          onClick={testSearch}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "테스트 중..." : "2. Search API 테스트"}
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "15px",
            backgroundColor: "#fee",
            border: "1px solid #fcc",
            borderRadius: "4px",
            marginBottom: "20px",
            color: "#c33",
          }}
        >
          <strong>에러:</strong> {error}
        </div>
      )}

      {result && (
        <div>
          <h2>결과:</h2>
          <pre
            style={{
              padding: "20px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              overflow: "auto",
              fontSize: "12px",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: "40px", padding: "20px", backgroundColor: "#e3f2fd", borderRadius: "4px" }}>
        <h3>사용 방법:</h3>
        <ol>
          <li>위의 "1. Ping 테스트" 버튼을 클릭하세요</li>
          <li>성공하면 "2. Search API 테스트" 버튼을 클릭하세요</li>
          <li>결과가 아래에 표시됩니다</li>
        </ol>
      </div>
    </div>
  );
}
