"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";

export default function VideoGenerationPage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const toggleStep = (step: number) => {
    setExpandedStep(expandedStep === step ? null : step);
  };

  const steps = [
    {
      number: 1,
      title: "브루 접속 및 가입",
      description: "브루 서비스에 접속하여 계정을 생성합니다",
      details: [
        "웹 브라우저에서 브루(Vrew) 서비스에 접속합니다: https://vrew.ai",
        "이메일 또는 구글 계정으로 간단히 회원가입을 진행합니다.",
        "로그인 후 대시보드로 이동합니다.",
      ],
    },
    {
      number: 2,
      title: "새 프로젝트 시작하기",
      description: "새로운 영상 프로젝트를 생성합니다",
      details: [
        "Vrew를 다운로드하여 설치합니다 (Mac, Windows, Linux 지원).",
        "Vrew를 실행하고 '새 프로젝트 만들기' 버튼을 클릭합니다.",
        "프로젝트 유형을 선택합니다: '텍스트로 비디오 만들기' 또는 기존 영상 편집",
        "영상 제목을 입력합니다.",
      ],
    },
    {
      number: 3,
      title: "대본 입력 및 AI 옵션 설정",
      description: "대본을 입력하고 AI 옵션을 설정합니다",
      details: [
        "이전 단계에서 생성한 대본을 텍스트 입력란에 붙여넣거나 직접 입력합니다.",
        "AI 음성 생성 기능을 사용하여 목소리 옵션을 설정합니다: AI 목소리 톤, 속도, 한국어/영어 선택",
        "AI 이미지 생성 기능을 사용하여 배경 이미지나 영상 클립을 생성합니다.",
        "자동 자막 기능을 활성화하여 자막을 자동으로 생성합니다.",
      ],
    },
    {
      number: 4,
      title: "자동 생성 및 편집",
      description: "AI가 자동으로 생성한 영상을 편집합니다",
      details: [
        "텍스트 기반 편집 기능을 사용하여 대본을 편집하면 영상이 자동으로 업데이트됩니다.",
        "Speech Editor 기능으로 음성 오류를 텍스트 수정만으로 바로 고칠 수 있습니다.",
        "Silence Remover 기능으로 불필요한 침묵 구간을 한 번에 제거합니다.",
        "자막 위치, 폰트, 문장 단위를 조정합니다.",
        "불필요한 장면(구간)을 삭제하거나 순서를 바꿉니다 (텍스트 기반 편집 사용).",
      ],
    },
    {
      number: 5,
      title: "검토 및 내보내기",
      description: "완성된 영상을 검토하고 다운로드합니다",
      details: [
        "영상 전체 흐름을 확인하고 수정이 필요한 부분을 반영합니다.",
        "화질 설정을 선택합니다 (예: 1080p).",
        "MP4 파일로 다운로드하거나 원하는 플랫폼(유튜브, 인스타그램 등)에 업로드할 수 있도록 파일을 준비합니다.",
      ],
    },
  ];

  return (
    <main className="main-page">
      <div className="hero-section">
        <div className="back-buttons">
          <BackButton />
          <button
            onClick={handleRefresh}
            className="refresh-button"
            title="페이지 새로고침"
          >
            🔄 새로고침
          </button>
        </div>
        <h1>영상 만들기</h1>
        <p>브루(Vrew) 서비스를 활용하여 AI로 영상을 생성합니다</p>
      </div>

      <section className="process-content">
        <div className="guide-section">
          <h2 className="section-title">🎬 브루(Vrew) 서비스 사용 가이드</h2>
          <p className="section-description">
            브루(Vrew)는 텍스트 기반 편집, AI 음성 생성, 자동 자막 등 모든 기능을 갖춘 올인원 AI 비디오 편집기입니다. 
            대본만 있으면 촬영·녹음 없이도 AI가 영상, 음성, 자막 등을 자동으로 생성해주는 영상 제작 플랫폼입니다. 
            아래 단계를 따라 영상을 만들어보세요.
          </p>

          <div className="guide-steps">
            {steps.map((step) => (
              <div key={step.number} className="guide-step-card">
                <div
                  className="guide-step-header"
                  onClick={() => toggleStep(step.number)}
                >
                  <div className="guide-step-number">{step.number}</div>
                  <div className="guide-step-content">
                    <h3 className="guide-step-title">{step.title}</h3>
                    <p className="guide-step-description">{step.description}</p>
                  </div>
                  <div className="guide-step-arrow">
                    {expandedStep === step.number ? "▼" : "▶"}
                  </div>
                </div>
                {expandedStep === step.number && (
                  <div className="guide-step-details">
                    <ol className="guide-step-list">
                      {step.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="guide-tips">
            <h3 className="tips-title">💡 활용 팁</h3>
            <ul className="tips-list">
              <li><strong>짧고 간결하게:</strong> 쇼츠나 릴스용이라면 핵심 메시지를 15~60초 내외에 전달하세요.</li>
              <li><strong>비주얼 구성 활용:</strong> 텍스트 강조, 이미지 클립, 효과음/음악으로 분위기를 살리면 영상이 훨씬 풍성해 보입니다.</li>
              <li><strong>자막 필수:</strong> 모바일에서 소리 없이 보는 경우에도 이해할 수 있도록 자막이 잘 보이게 작성하세요.</li>
              <li><strong>스타일 템플릿 활용:</strong> 이미 있는 템플릿을 활용하면 디자인 고민 절약 & 빠른 제작 가능합니다.</li>
            </ul>
          </div>

          <div className="guide-link">
            <a
              href="https://vrew.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="primary-button"
            >
              브루(Vrew) 서비스 바로가기 →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
