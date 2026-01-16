import Link from "next/link";

const processData: { [key: string]: { title: string; description: string; subItems: { title: string; href: string }[] } } = {
  "1": {
    title: "유튜브 채널 만들기",
    description: "채널 컨셉을 정하고 유튜브 채널을 생성합니다",
    subItems: [
      { title: "채널 컨셉 정하기 (AI Prompt)", href: "/process/1/1" },
      { title: "채널 만들기", href: "/process/1/2" },
    ],
  },
  "2": {
    title: "영상 대본 만들기",
    description: "뉴스 조회와 벤치마킹을 통해 영상 대본을 작성합니다",
    subItems: [
      { title: "최근 뉴스 조회", href: "/process/2/1" },
      { title: "인기 영상 벤치마킹", href: "/trending" },
      { title: "대본 만들기 (AI Prompt)", href: "/process/2/3" },
    ],
  },
  "3": {
    title: "영상 목소리 만들기 (AI)",
    description: "AI를 활용하여 영상 목소리를 생성합니다",
    subItems: [],
  },
  "4": {
    title: "영상 동영상 만들기 (AI)",
    description: "AI를 활용하여 영상 동영상을 생성합니다",
    subItems: [],
  },
  "5": {
    title: "영상 유튜브 올리기",
    description: "완성된 영상을 유튜브에 업로드합니다",
    subItems: [],
  },
  "6": {
    title: "영상 트레픽 보기",
    description: "업로드한 영상의 트래픽과 통계를 확인합니다",
    subItems: [],
  },
};

export default function ProcessStepPage({ params }: { params: { step: string } }) {
  const step = params.step;
  const data = processData[step];

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

      <section className="process-content">
        <div className="content-placeholder">
          <p>이 페이지는 현재 개발 중입니다.</p>
          <p>곧 더 많은 기능이 추가될 예정입니다.</p>
        </div>
      </section>
    </main>
  );
}
