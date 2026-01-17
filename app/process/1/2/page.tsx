"use client";

import BackButton from "@/components/BackButton";

const channelCreationSteps = [
  {
    step: 1,
    title: "구글 계정 준비",
    description: "유튜브 채널을 만들기 위해서는 구글 계정이 필요합니다.",
    details: [
      "구글 계정이 없다면 먼저 구글 계정을 생성하세요.",
      "이미 구글 계정이 있다면 로그인하세요.",
      "구글 계정은 Gmail, Google Drive 등 모든 구글 서비스를 사용할 수 있는 계정입니다.",
    ],
    icon: "🔐",
  },
  {
    step: 2,
    title: "유튜브 채널 생성",
    description: "구글 계정으로 유튜브에 로그인한 후 채널을 생성합니다.",
    details: [
      "유튜브(YouTube.com)에 접속하여 로그인하세요.",
      "우측 상단의 프로필 아이콘을 클릭하세요.",
      "'내 채널 만들기' 또는 '채널 만들기' 버튼을 클릭하세요.",
      "채널 이름을 입력하고 '만들기' 버튼을 클릭하세요.",
    ],
    icon: "📺",
  },
  {
    step: 3,
    title: "채널 아트 및 프로필 이미지 설정",
    description: "채널의 첫인상을 결정하는 중요한 요소입니다.",
    details: [
      "채널 페이지로 이동하세요.",
      "'채널 맞춤설정' 버튼을 클릭하세요.",
      "채널 아트(배너 이미지): 2560 x 1440 픽셀 권장",
      "프로필 이미지: 800 x 800 픽셀 권장 (정사각형)",
      "채널 컨셉에 맞는 이미지를 업로드하세요.",
    ],
    icon: "🎨",
  },
  {
    step: 4,
    title: "채널 설명 작성",
    description: "채널을 찾는 시청자들에게 채널의 목적과 내용을 알려주세요.",
    details: [
      "채널 맞춤설정에서 '기본 정보' 탭을 선택하세요.",
      "채널 설명란에 채널 컨셉에 맞는 설명을 작성하세요.",
      "주요 키워드를 포함하여 검색 최적화를 고려하세요.",
      "채널의 목적, 대상 시청자, 콘텐츠 유형을 명확히 설명하세요.",
    ],
    icon: "✍️",
  },
  {
    step: 5,
    title: "채널 커스터마이징",
    description: "채널을 더욱 전문적으로 보이게 만드는 추가 설정입니다.",
    details: [
      "채널 트레일러 설정: 신규 시청자를 위한 소개 영상",
      "섹션 구성: 인기 영상, 최신 영상 등으로 채널 정리",
      "소셜 링크 추가: 웹사이트, SNS 링크 연결",
      "채널 URL 커스터마이징: 기억하기 쉬운 주소 설정 (조건부)",
    ],
    icon: "⚙️",
  },
  {
    step: 6,
    title: "첫 영상 업로드 준비",
    description: "채널이 준비되었으니 이제 첫 영상을 업로드할 차례입니다.",
    details: [
      "채널 컨셉에 맞는 첫 영상 콘텐츠를 준비하세요.",
      "영상 제목, 설명, 썸네일을 신중하게 작성하세요.",
      "해시태그를 적절히 사용하여 검색 노출을 높이세요.",
      "첫 영상은 채널의 톤과 방향성을 보여주는 중요한 영상입니다.",
    ],
    icon: "🎬",
  },
];

export default function CreateChannelPage() {
  const handleRefresh = () => {
    window.location.reload();
  };

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
        <h1>채널 만들기</h1>
        <p>정해진 컨셉에 따라 유튜브 채널을 생성하는 단계별 가이드입니다</p>
      </div>

      <section className="process-content">
        <div className="channel-guide-section">
          <div className="guide-intro">
            <h2 className="section-title">📋 유튜브 채널 생성 가이드</h2>
            <p className="guide-intro-text">
              아래 단계를 순서대로 따라하시면 유튜브 채널을 성공적으로 만들 수 있습니다.
            </p>
          </div>

          <div className="steps-container">
            {channelCreationSteps.map((step) => (
              <div key={step.step} className="step-card">
                <div className="step-header">
                  <div className="step-number-badge">
                    <span className="step-icon">{step.icon}</span>
                    <span className="step-number">{step.step}</span>
                  </div>
                  <div className="step-title-section">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-description">{step.description}</p>
                  </div>
                </div>
                <div className="step-details">
                  <ul className="step-details-list">
                    {step.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className="guide-tips">
            <h3 className="tips-title">💡 유용한 팁</h3>
            <div className="tips-grid">
              <div className="tip-card">
                <h4 className="tip-card-title">채널 이름 선택</h4>
                <p className="tip-card-text">
                  채널 컨셉 설정에서 정한 채널 이름 후보 중에서 선택하거나, 
                  검색하기 쉽고 기억하기 쉬운 이름을 선택하세요.
                </p>
              </div>
              <div className="tip-card">
                <h4 className="tip-card-title">첫인상이 중요합니다</h4>
                <p className="tip-card-text">
                  채널 아트와 프로필 이미지는 채널의 첫인상을 결정합니다. 
                  채널 컨셉에 맞는 전문적인 디자인을 사용하세요.
                </p>
              </div>
              <div className="tip-card">
                <h4 className="tip-card-title">일관성 유지</h4>
                <p className="tip-card-text">
                  채널 설명, 영상 스타일, 썸네일 디자인 등에서 일관된 브랜딩을 유지하면 
                  시청자들이 채널을 쉽게 인식할 수 있습니다.
                </p>
              </div>
              <div className="tip-card">
                <h4 className="tip-card-title">검색 최적화</h4>
                <p className="tip-card-text">
                  채널 설명에 관련 키워드를 자연스럽게 포함하고, 
                  영상 제목과 설명에도 검색어를 고려하여 작성하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
