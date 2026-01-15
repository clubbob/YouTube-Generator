import Link from "next/link";

export default function Home() {
  return (
    <main className="container">
      <div className="hero-section">
        <h1>YouTube Generator에 오신 것을 환영합니다</h1>
        <p>유튜브 컨텐츠 영상을 만들기 위한 AI 도구 지원 서비스</p>
      </div>

      <section className="process-section">
        <h2 className="process-title">유튜브 영상 제작 프로세스</h2>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-header">
              <span className="step-number">1</span>
              <h3 className="step-title">유튜브 채널 만들기</h3>
            </div>
            <div className="step-subitems">
              <div className="subitem">
                <span className="subitem-number">1-1</span>
                <span className="subitem-text">채널 컨셉 정하기 (AI Prompt)</span>
              </div>
              <div className="subitem">
                <span className="subitem-number">1-2</span>
                <span className="subitem-text">채널 만들기</span>
              </div>
            </div>
          </div>

          <div className="process-step">
            <div className="step-header">
              <span className="step-number">2</span>
              <h3 className="step-title">영상 대본 만들기</h3>
            </div>
            <div className="step-subitems">
              <div className="subitem">
                <span className="subitem-number">2-1</span>
                <span className="subitem-text">최근 뉴스 조회</span>
              </div>
              <Link href="/trending" className="subitem subitem-link">
                <span className="subitem-number">2-2</span>
                <span className="subitem-text">인기 영상 벤치마킹</span>
              </Link>
              <div className="subitem">
                <span className="subitem-number">2-3</span>
                <span className="subitem-text">대본 만들기 (AI Prompt)</span>
              </div>
            </div>
          </div>

          <div className="process-step">
            <div className="step-header">
              <span className="step-number">3</span>
              <h3 className="step-title">영상 목소리 만들기 (AI)</h3>
            </div>
          </div>

          <div className="process-step">
            <div className="step-header">
              <span className="step-number">4</span>
              <h3 className="step-title">영상 동영상 만들기 (AI)</h3>
            </div>
          </div>

          <div className="process-step">
            <div className="step-header">
              <span className="step-number">5</span>
              <h3 className="step-title">영상 유튜브 올리기</h3>
            </div>
          </div>

          <div className="process-step">
            <div className="step-header">
              <span className="step-number">6</span>
              <h3 className="step-title">영상 트레픽 보기</h3>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
