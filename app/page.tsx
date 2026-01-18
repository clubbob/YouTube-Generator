"use client";

import Link from "next/link";

const processSteps = [
  {
    number: 1,
    title: "유튜브 채널 만들기",
    description: "채널 컨셉을 정하고 유튜브 채널을 생성합니다",
    href: "/process/1",
    subItems: [
      { title: "채널 컨셉 설정", available: true, href: "/process/1/1" },
      { title: "채널 만들기", available: true, href: "/process/1/2" },
    ],
  },
  {
    number: 2,
    title: "영상 대본 만들기",
    description: "뉴스 조회와 벤치마킹을 통해 영상 대본을 작성합니다",
    href: "/process/2",
    subItems: [
      { title: "인기 영상 벤치마킹", available: true, href: "/trending" },
      { title: "대본 만들기", available: true, href: "/process/2/3" },
    ],
  },
  {
    number: 3,
    title: "영상 만들기",
    description: "AI를 활용하여 영상을 생성합니다",
    href: "/process/3",
    subItems: [],
  },
  {
    number: 4,
    title: "영상 샘플 보기",
    description: "실제로 제작된 영상 샘플을 확인합니다",
    href: "https://www.youtube.com/@%EC%95%A4%EB%94%94%EB%A6%AC%EC%8A%A4%ED%8A%B8",
    subItems: [],
    external: true,
  },
];

export default function Home() {
  return (
    <main className="main-page">
      <div className="hero-section">
        <h1>YouTube Generator에 오신 것을 환영합니다</h1>
        <p>유튜브 컨텐츠 영상을 만들기 프로세스와 편리한 AI 도구 안내 서비스</p>
      </div>

      <section className="service-summary">
        <div className="summary-content">
          <h2 className="summary-title">서비스 소개</h2>
          <p className="summary-description">
            YouTube Generator는 AI 기술을 활용하여 유튜브 영상 제작 전 과정을 지원하는 통합 플랫폼입니다.
          </p>
          <div className="summary-features">
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-content">
                <h3 className="feature-title">스마트 벤치마킹</h3>
                <p className="feature-text">인기 영상을 분석하여 트렌드를 파악하고 성공 가능성이 높은 컨텐츠를 찾아드립니다.</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <div className="feature-content">
                <h3 className="feature-title">AI 기반 자동화</h3>
                <p className="feature-text">대본 작성, 목소리 생성, 영상 제작까지 AI가 자동으로 처리하여 시간을 절약합니다.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="process-section">
        <h2 className="process-section-title">유튜브 영상 제작 가이드</h2>
        <p className="process-section-description">
          채널 기획부터 영상 제작까지, 유튜브 크리에이터를 위한 4단계 제작 프로세스를 제공합니다.
        </p>
        <div className="process-grid">
          {processSteps.map((step) => (
          <div key={step.number} className="process-card">
            {step.external ? (
              <a href={step.href} target="_blank" rel="noopener noreferrer" className="process-card-link">
                <div className="card-header">
                  <span className="card-number">{step.number}</span>
                  <h3 className="card-title">{step.title}</h3>
                </div>
                <p className="card-description">{step.description}</p>
              </a>
            ) : (
              <Link href={step.href} className="process-card-link">
                <div className="card-header">
                  <span className="card-number">{step.number}</span>
                  <h3 className="card-title">{step.title}</h3>
                </div>
                <p className="card-description">{step.description}</p>
              </Link>
            )}
            {step.subItems.length > 0 && (
              <div className="card-subitems">
                {step.subItems.map((subItem, index) => (
                  subItem.available && subItem.href ? (
                    <Link
                      key={index}
                      href={subItem.href}
                      className="subitem-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="subitem-dot">•</span>
                      <span className="subitem-text">{subItem.title}</span>
                    </Link>
                  ) : (
                    <div key={index} className="subitem-disabled">
                      <span className="subitem-dot">•</span>
                      <span className="subitem-text">{subItem.title}</span>
                      <span className="coming-soon">준비 중</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
          ))}
        </div>
      </section>
    </main>
  );
}
