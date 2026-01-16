import Link from "next/link";

const processSteps = [
  {
    number: 1,
    title: "유튜브 채널 만들기",
    description: "채널 컨셉을 정하고 유튜브 채널을 생성합니다",
    subItems: [
      { title: "채널 컨셉 정하기 (AI Prompt)", available: false },
      { title: "채널 만들기", available: false },
    ],
  },
  {
    number: 2,
    title: "영상 대본 만들기",
    description: "뉴스 조회와 벤치마킹을 통해 영상 대본을 작성합니다",
    subItems: [
      { title: "최근 뉴스 조회", available: false },
      { title: "인기 영상 벤치마킹", available: true, href: "/trending" },
      { title: "대본 만들기 (AI Prompt)", available: false },
    ],
  },
  {
    number: 3,
    title: "영상 목소리 만들기 (AI)",
    description: "AI를 활용하여 영상 목소리를 생성합니다",
    subItems: [],
  },
  {
    number: 4,
    title: "영상 동영상 만들기 (AI)",
    description: "AI를 활용하여 영상 동영상을 생성합니다",
    subItems: [],
  },
  {
    number: 5,
    title: "영상 유튜브 올리기",
    description: "완성된 영상을 유튜브에 업로드합니다",
    subItems: [],
  },
  {
    number: 6,
    title: "영상 트레픽 보기",
    description: "업로드한 영상의 트래픽과 통계를 확인합니다",
    subItems: [],
  },
];

export default function Home() {
  return (
    <main className="main-page">
      <div className="hero-section">
        <h1>YouTube Generator에 오신 것을 환영합니다</h1>
        <p>유튜브 컨텐츠 영상을 만들기 위한 AI 도구 지원 서비스</p>
      </div>

      <section className="process-grid">
        {processSteps.map((step) => (
          <div key={step.number} className="process-card">
            <div className="card-header">
              <span className="card-number">{step.number}</span>
              <h3 className="card-title">{step.title}</h3>
            </div>
            <p className="card-description">{step.description}</p>
            {step.subItems.length > 0 && (
              <div className="card-subitems">
                {step.subItems.map((subItem, index) => (
                  subItem.available && subItem.href ? (
                    <Link
                      key={index}
                      href={subItem.href}
                      className="subitem-link"
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
      </section>
    </main>
  );
}
