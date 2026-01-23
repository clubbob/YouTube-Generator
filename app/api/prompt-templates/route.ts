import { NextRequest, NextResponse } from "next/server";
import type { PromptTemplate } from "@/types";

// GET: 프롬프트 템플릿 조회
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateType = searchParams.get("type");
    
    const { getPromptTemplates, getActivePromptTemplate } = await import("@/lib/firestore");
    
    // type 파라미터가 있고 "active"가 포함되어 있으면 활성 템플릿만 조회
    if (templateType && templateType !== "all") {
      const activeTemplate = await getActivePromptTemplate(templateType);
      if (activeTemplate) {
        return NextResponse.json({ success: true, template: activeTemplate });
      }
      return NextResponse.json({ success: false, message: "활성 템플릿을 찾을 수 없습니다." });
    }
    
    // 모든 템플릿 조회
    const templates = await getPromptTemplates(templateType || undefined);
    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error("프롬프트 템플릿 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "프롬프트 템플릿을 조회하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 프롬프트 템플릿 저장
export async function POST(request: NextRequest) {
  try {
    const body: PromptTemplate = await request.json();
    
    if (!body.templateType || !body.version || !body.content) {
      return NextResponse.json(
        { error: "templateType, version, content는 필수입니다." },
        { status: 400 }
      );
    }

    const { savePromptTemplate } = await import("@/lib/firestore");
    const templateId = await savePromptTemplate(body);
    
    return NextResponse.json({ 
      success: true, 
      templateId,
      message: "프롬프트 템플릿이 저장되었습니다." 
    });
  } catch (error: any) {
    console.error("프롬프트 템플릿 저장 오류:", error);
    return NextResponse.json(
      { error: error.message || "프롬프트 템플릿을 저장하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 프롬프트 템플릿 삭제
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get("id");
    
    if (!templateId) {
      return NextResponse.json(
        { error: "templateId는 필수입니다." },
        { status: 400 }
      );
    }

    const { deletePromptTemplate } = await import("@/lib/firestore");
    await deletePromptTemplate(templateId);
    
    return NextResponse.json({ 
      success: true, 
      message: "프롬프트 템플릿이 삭제되었습니다." 
    });
  } catch (error: any) {
    console.error("프롬프트 템플릿 삭제 오류:", error);
    return NextResponse.json(
      { error: error.message || "프롬프트 템플릿을 삭제하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
