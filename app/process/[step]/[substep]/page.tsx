"use client";

import Link from "next/link";
import BackButton from "@/components/BackButton";

const subProcessData: { [key: string]: { [key: string]: { title: string; description: string } } } = {
  "1": {
    "1": {
      title: "채널 컨셉 정하기 (AI Prompt)",
      description: "AI를 활용하여 유튜브 채널의 컨셉과 방향성을 정합니다",
    },
    "2": {
      title: "채널 만들기",
      description: "정해진 컨셉에 따라 유튜브 채널을 생성합니다",
    },
  },
  "2": {
    "1": {
      title: "최근 뉴스 조회",
      description: "최신 뉴스와 트렌드를 조회하여 영상 주제를 선정합니다",
    },
    "3": {
      title: "대본 만들기 (AI Prompt)",
      description: "AI를 활용하여 영상 대본을 자동으로 생성합니다",
    },
  },
};

export default function SubProcessPage({ params }: { params: { step: string; substep: string } }) {
  const { step, substep } = params;
  const data = subProcessData[step]?.[substep];

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
        </div>
        <h1>{data.title}</h1>
        <p>{data.description}</p>
      </div>

      <section className="process-content">
        <div className="content-placeholder">
          <p>이 페이지는 현재 개발 중입니다.</p>
          <p>곧 더 많은 기능이 추가될 예정입니다.</p>
        </div>
      </section>
    </main>
  );
}
