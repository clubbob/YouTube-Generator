"use client";

import Link from "next/link";
import BackButton from "@/components/BackButton";

const processData: { [key: string]: { title: string; description: string; subItems: { title: string; href: string }[] } } = {
  "1": {
    title: "유튜브 채널 만들기",
    description: "채널 컨셉을 정하고 유튜브 채널을 생성합니다",
    subItems: [
      { title: "채널 컨셉 설정", href: "/process/1/1" },
      { title: "채널 만들기", href: "/process/1/2" },
    ],
  },
  "2": {
    title: "영상 대본 만들기",
    description: "뉴스 조회와 벤치마킹을 통해 영상 대본을 작성합니다",
    subItems: [
      { title: "인기 영상 벤치마킹", href: "/trending" },
      { title: "대본 만들기", href: "/process/2/3" },
    ],
  },
  "3": {
    title: "영상 만들기",
    description: "AI를 활용하여 영상을 생성합니다",
    subItems: [],
  },
};

export default function ProcessStepPage({ params }: { params: { step: string } }) {
  const step = params.step;
  const data = processData[step];

  // step이 "3"이면 일반 페이지를 렌더링하지 않음
  // Next.js는 정적 라우트(app/process/3/page.tsx)가 동적 라우트보다 우선순위가 높음
  // 빌드 캐시를 삭제하고 개발 서버를 재시작하면 정적 라우트가 우선됨
  if (step === "3") {
    return (
      <main className="main-page">
        <div className="hero-section">
          <h1>페이지를 찾을 수 없습니다</h1>
          <Link href="/process/3">영상 만들기 페이지로 이동</Link>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="main-page">
        <div className="hero-section">
          <h1>페이지를 찾을 수 없습니다</h1>
          <Link href="/">홈으로 돌아가기</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="main-page">
      <div className="hero-section">
        <div className="back-buttons">
          <BackButton />
          <button
            onClick={() => window.location.reload()}
            className="refresh-button"
            title="페이지 새로고침"
          >
            🔄 새로고침
          </button>
        </div>
        <h1>{data.title}</h1>
        <p>{data.description}</p>
      </div>

      {data.subItems.length > 0 && (
        <section className="process-subsection">
          <h2 className="subsection-title">세부 단계</h2>
          <div className="subitems-grid">
            {data.subItems.map((item, index) => (
              <Link key={index} href={item.href} className="subitem-card">
                <div className="subitem-number">{index + 1}</div>
                <div className="subitem-content">
                  <h3 className="subitem-title">{item.title}</h3>
                </div>
                <div className="subitem-arrow">→</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
