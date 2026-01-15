import { NextRequest, NextResponse } from "next/server";
import { getSavedVideos, saveVideo, deleteSavedVideo, updateSavedVideo } from "@/lib/firestore";
import type { SavedVideo } from "@/types";

// GET: 저장된 영상 목록 조회
export async function GET() {
  try {
    const videos = await getSavedVideos();
    return NextResponse.json({ items: videos });
  } catch (error: any) {
    console.error("저장된 영상 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "저장된 영상을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 영상 저장
export async function POST(request: NextRequest) {
  try {
    const body: SavedVideo = await request.json();
    
    if (!body.videoId) {
      return NextResponse.json(
        { error: "videoId는 필수입니다." },
        { status: 400 }
      );
    }

    const video: SavedVideo = {
      ...body,
      createdAt: body.createdAt || new Date().toISOString(),
      tags: body.tags || [],
    };

    await saveVideo(video);
    return NextResponse.json({ success: true, video });
  } catch (error: any) {
    console.error("영상 저장 오류:", error);
    return NextResponse.json(
      { error: error.message || "영상을 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 영상 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId는 필수입니다." },
        { status: 400 }
      );
    }

    await deleteSavedVideo(videoId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("영상 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "영상을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH: 영상 업데이트 (태그/메모 수정)
export async function PATCH(request: NextRequest) {
  try {
    const body: { videoId: string; tags?: string[]; memo?: string } = await request.json();

    if (!body.videoId) {
      return NextResponse.json(
        { error: "videoId는 필수입니다." },
        { status: 400 }
      );
    }

    await updateSavedVideo(body.videoId, {
      tags: body.tags,
      memo: body.memo,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("영상 업데이트 오류:", error);
    return NextResponse.json(
      { error: error.message || "영상을 업데이트하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
