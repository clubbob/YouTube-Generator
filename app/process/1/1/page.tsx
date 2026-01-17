"use client";

import { useState } from "react";
import Link from "next/link";
import BackButton from "@/components/BackButton";

export default function ChannelConceptPage() {
  // 새로운 항목 구조
  const [channelPurpose, setChannelPurpose] = useState("복잡한 뉴스와 정보를 60초 안에 쉽게 이해하게 만드는 채널. 단순 정보 전달이 아니라 원인, 구조, 맥락을 연결하여 시청자의 사고를 정리해주는 해석형 채널");

  const [channelKeywords, setChannelKeywords] = useState("뉴스 해석, 시사 분석, 정보 정리, 트렌드 분석, 경제 뉴스, 시사 뉴스, 뉴스 요약, 인사이트, 맥락 이해");

  const [coreTargetAudience, setCoreTargetAudience] = useState("20-30대 직장인 및 대학생. 경제, 투자, 시사, 트렌드에 관심이 있지만 정보 과부하로 인해 핵심만 빠르게 알고 싶어하는 사람들");

  const [mainViewingSituation, setMainViewingSituation] = useState("출퇴근 시간, 점심 시간, 잠들기 전 등 짧은 시간에 핵심 정보를 얻고 싶을 때. 모바일 환경에서 YouTube Shorts로 시청");

  const [viewerCoreProblem, setViewerCoreProblem] = useState("뉴스가 너무 많고 복잡해서 무엇이 중요한지 모르겠다. 정보는 많은데 정작 이해가 안 된다. 사건의 배경과 원인을 알고 싶지만 찾기 어렵다");

  const [contentTopicRange, setContentTopicRange] = useState("시사, 정치, 경제, 사회, 국제, 문화, 연예, 스포츠, IT, 과학, 부동산, 건강, AI, 금융, 교육, 환경, 게임, 음식 등 트렌드 기반 정보 전반");

  const [videoStructure, setVideoStructure] = useState("오프닝 훅 (3초): 질문이나 관점으로 시작 → 핵심 설명 (50초): 사실 → 원인 → 구조 → 맥락 순서로 전개 → 인사이트 요약 (5초): 한 문장으로 정리 → 마무리 (2초): 반복 시청 유도 멘트");

  const [channelToneAndMood, setChannelToneAndMood] = useState("차분하고 분석적인 말투. 감정적 선동이나 판단 강요 없이, 이해를 확장하고 사고를 정리할 수 있도록 설명하는 톤");

  const [channelCharacterPosition, setChannelCharacterPosition] = useState("'설명하는 채널'이 아닌 '생각하게 만드는 채널'. 자극적 제목과 감정 선동을 피하고, 원인과 구조를 보여주는 해석자 역할");

  const [repeatViewingInducement, setRepeatViewingInducement] = useState("매 영상 끝에 '이 기준으로 다음 뉴스도 보면 이해가 쉬워집니다' 같은 멘트로 일관된 관점 제공. 정보가 아닌 '사고의 기준점'을 남겨 다음 영상도 보고 싶게 만듦");

  const [productionSustainability, setProductionSustainability] = useState("AI 음성과 이미지/영상 기반 제작으로 얼굴 노출 없이 제작 가능. 하루 1개 이상 업로드 가능한 구조. 트렌드 기반 콘텐츠로 지속적인 주제 확보 가능");

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePrompt = () => {
    setIsGenerating(true);
    
    const prompt = `너는 유튜브 채널 기획 전문가이자
숏폼 알고리즘과 수익 구조를 이해하는 콘텐츠 전략가다.

다음 조건을 기반으로
"지속적으로 성장 가능한 유튜브 채널 컨셉"을 설계해라.

[채널 컨셉 설계 항목]

1. 채널 목적
${channelPurpose}

2. 채널 키워드
${channelKeywords}

3. 핵심 타겟 시청자
${coreTargetAudience}

4. 주요 시청 상황
${mainViewingSituation}

5. 시청자 핵심 문제
${viewerCoreProblem}

6. 콘텐츠 주제 범위
${contentTopicRange}

7. 영상 전개 구조
${videoStructure}

8. 채널 말투 및 분위기
${channelToneAndMood}

9. 채널 캐릭터 포지션
${channelCharacterPosition}

10. 반복 시청 유도 장치
${repeatViewingInducement}

11. 제작 지속 가능
${productionSustainability}

[출력 요구사항]
- 불필요한 설명 없이 실무자가 바로 채널을 만들 수 있도록
- 명확하고 구조화된 문서 형태로 작성
- 채널 추천 이름 10개 (2~10자 내외, 브랜드형 네이밍, 각 이름마다 한 줄 의미 설명 포함)
- 각 항목별로 구체적이고 실행 가능한 내용으로 작성`;
    
    setGeneratedPrompt(prompt);
    setCopied(false);
    setIsGenerating(false);
  };

  const handleCopyPrompt = async () => {
    if (generatedPrompt) {
      try {
        await navigator.clipboard.writeText(generatedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("복사 실패:", err);
      }
    }
  };

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
        <h1>채널 컨셉 설정</h1>
        <p>AI를 활용하여 유튜브 채널의 컨셉과 방향성을 정합니다</p>
      </div>

      <section className="process-content">
        <div className="prompt-section">
          <h2 className="section-title">🤖 AI 프롬프트 생성</h2>
          <p className="section-description">
            유튜브 채널 컨셉을 설계하기 위해 AI에게 전달할 지시문(프롬프트)을 만드는 페이지입니다. 아래 10가지 항목에 원하는 내용을 입력하거나 기본값을 수정한 후, 하단의 "프롬프트 생성" 버튼을 클릭하면 ChatGPT, Claude, Gemini 등 AI 도구에 사용할 프롬프트가 생성됩니다. 생성된 프롬프트를 AI 도구에 붙여넣으면 채널 이름, 슬로건, 콘텐츠 카테고리 등 채널 컨셉 설계 결과를 받을 수 있습니다.
          </p>
          
          <div className="prompt-form">
            <div className="form-row form-row-textarea">
              <label htmlFor="channel-purpose" className="form-label">채널 목적</label>
              <textarea
                id="channel-purpose"
                value={channelPurpose}
                onChange={(e) => setChannelPurpose(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="channel-keywords" className="form-label">채널 키워드</label>
              <textarea
                id="channel-keywords"
                value={channelKeywords}
                onChange={(e) => setChannelKeywords(e.target.value)}
                rows={2}
                className="form-textarea"
                placeholder="채널과 관련된 주요 키워드를 쉼표로 구분하여 입력하세요 (예: 뉴스 해석, 시사 분석, 정보 정리)"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="core-target-audience" className="form-label">핵심 타겟 시청자</label>
              <textarea
                id="core-target-audience"
                value={coreTargetAudience}
                onChange={(e) => setCoreTargetAudience(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="main-viewing-situation" className="form-label">주요 시청 상황</label>
              <textarea
                id="main-viewing-situation"
                value={mainViewingSituation}
                onChange={(e) => setMainViewingSituation(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="viewer-core-problem" className="form-label">시청자 핵심 문제</label>
              <textarea
                id="viewer-core-problem"
                value={viewerCoreProblem}
                onChange={(e) => setViewerCoreProblem(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="content-topic-range" className="form-label">콘텐츠 주제 범위</label>
              <textarea
                id="content-topic-range"
                value={contentTopicRange}
                onChange={(e) => setContentTopicRange(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="video-structure" className="form-label">영상 전개 구조</label>
              <textarea
                id="video-structure"
                value={videoStructure}
                onChange={(e) => setVideoStructure(e.target.value)}
                rows={4}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="channel-tone-and-mood" className="form-label">채널 말투 및 분위기</label>
              <textarea
                id="channel-tone-and-mood"
                value={channelToneAndMood}
                onChange={(e) => setChannelToneAndMood(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="channel-character-position" className="form-label">채널 캐릭터 포지션</label>
              <textarea
                id="channel-character-position"
                value={channelCharacterPosition}
                onChange={(e) => setChannelCharacterPosition(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="repeat-viewing-inducement" className="form-label">반복 시청 유도 장치</label>
              <textarea
                id="repeat-viewing-inducement"
                value={repeatViewingInducement}
                onChange={(e) => setRepeatViewingInducement(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-row form-row-textarea">
              <label htmlFor="production-sustainability" className="form-label">제작 지속 가능</label>
              <textarea
                id="production-sustainability"
                value={productionSustainability}
                onChange={(e) => setProductionSustainability(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>
          </div>

          <div className="button-group">
            <button
              onClick={handleGeneratePrompt}
              className="primary-button"
              disabled={isGenerating}
            >
              {isGenerating ? "생성 중..." : "프롬프트 생성"}
            </button>
          </div>

          {generatedPrompt && (
            <div className="prompt-result">
              <div className="result-header">
                <h3>생성된 프롬프트</h3>
                <button
                  onClick={handleCopyPrompt}
                  className="copy-button"
                >
                  {copied ? "✓ 복사됨" : "📋 복사"}
                </button>
              </div>
              <div className="prompt-content">
                <pre>{generatedPrompt}</pre>
              </div>
              <div className="result-actions">
                <div className="result-hint-box">
                  <h4 className="result-hint-title">📋 다음 단계</h4>
                  <ol className="result-hint-steps">
                    <li>위의 "📋 복사" 버튼을 클릭하여 프롬프트를 복사하세요.</li>
                    <li>ChatGPT, Claude, Gemini 등 AI 도구를 열어주세요.</li>
                    <li>복사한 프롬프트를 AI 도구에 붙여넣고 실행하세요.</li>
                    <li>AI가 생성한 채널 컨셉 설계 결과를 확인하세요.</li>
                  </ol>
                  <p className="result-hint-note">
                    💡 <strong>팁:</strong> 생성된 결과에서 채널 이름, 슬로건, 콘텐츠 카테고리 등을 확인하고 필요시 프롬프트를 수정하여 다시 생성할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </section>
    </main>
  );
}
