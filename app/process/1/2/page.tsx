"use client";

import BackButton from "@/components/BackButton";

const channelCreationSteps = [
  {
    step: 1,
    title: "구글 계정 준비",
    description: "유튜브 채널을 만들기 위해서는 구글 계정이 필요합니다.",
    details: [
      "구글 계정이 없다면 먼저 구글 계정을 생성하세요: https://accounts.google.com/signup",
      "이미 구글 계정이 있다면 로그인하세요: https://accounts.google.com/login",
    ],
    icon: "🔐",
  },
  {
    step: 2,
    title: "유튜브 채널 생성",
    description: "구글 계정으로 유튜브에 로그인한 후 채널을 생성합니다.",
    details: [
      "유튜브에 접속하여 로그인하세요: https://accounts.google.com/login",
      "프로필 아이콘을 클릭하세요.",
      "'내 채널 만들기' 또는 '채널 만들기' 버튼을 클릭하세요.",
      "채널 이름을 입력하고 '만들기' 버튼을 클릭하세요.",
    ],
    icon: "📺",
  },
  {
    step: 3,
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
        </div>
      </section>
    </main>
  );
}
