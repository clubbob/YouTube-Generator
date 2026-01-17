import { NextRequest, NextResponse } from "next/server";
import type { ChannelConcept } from "@/types";

export const dynamic = 'force-dynamic';

// GET: 저장된 채널 컨셉 목록 조회
export async function GET() {
  try {
    const { getChannelConcepts } = await import("@/lib/firestore");
    const concepts = await getChannelConcepts();
    return NextResponse.json({ items: concepts });
  } catch (error: any) {
    console.error("저장된 채널 컨셉 조회 오류:", error);
    return NextResponse.json(
      { error: "채널 컨셉을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 채널 컨셉 저장
export async function POST(request: NextRequest) {
  try {
    const body: ChannelConcept = await request.json();
    
    const { saveChannelConcept } = await import("@/lib/firestore");
    const conceptId = await saveChannelConcept(body);
    
    return NextResponse.json({ 
      success: true, 
      conceptId,
      message: "채널 컨셉이 저장되었습니다." 
    });
  } catch (error: any) {
    console.error("채널 컨셉 저장 오류:", error);
    return NextResponse.json(
      { error: error.message || "채널 컨셉을 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 채널 컨셉 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conceptId = searchParams.get("conceptId");

    if (!conceptId) {
      return NextResponse.json(
        { error: "conceptId는 필수입니다." },
        { status: 400 }
      );
    }

    const { deleteChannelConcept } = await import("@/lib/firestore");
    await deleteChannelConcept(conceptId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("채널 컨셉 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "채널 컨셉을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
