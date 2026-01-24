import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AI 대본 생성 API
 * OpenAI API를 사용하여 뉴스 기사 해석 대본을 생성합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { prompt } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트가 필요합니다." },
        { status: 400 }
      );
    }

    console.log("[AI Script Generation] Starting script generation...");

    // OpenAI API 호출
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Script Generation] OpenAI API Error:", errorText);
      
      return NextResponse.json(
        { error: "대본 생성 중 오류가 발생했습니다.", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedScript = data.choices[0]?.message?.content || "";

    if (!generatedScript) {
      return NextResponse.json(
        { error: "대본 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    console.log("[AI Script Generation] Script generated successfully");

    return NextResponse.json({
      success: true,
      script: generatedScript,
    });
  } catch (error: any) {
    console.error("[AI Script Generation] Error:", error);
    return NextResponse.json(
      { error: "대본 생성 중 오류가 발생했습니다.", message: error.message },
      { status: 500 }
    );
  }
}
