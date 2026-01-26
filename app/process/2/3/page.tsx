"use client";

import { useState, useEffect } from "react";
import BackButton from "@/components/BackButton";

interface NewsItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
  category?: string;
}

type ContentMode =
  | "default"
  | "early"
  | "data"
  | "life"
  | "conflict"
  | "forecast"
  | "global"
  | "structure"
  | "human"
  | "factcheck"
  | "ai";

const CONTENT_MODE_LABELS: Record<ContentMode, string> = {
  default: "기본",
  early: "아직 뜨기 전(초기 이슈)",
  data: "숫자·데이터",
  life: "생활 체감",
  conflict: "갈등 구조",
  forecast: "전망·변수",
  global: "해외→국내 영향",
  structure: "구조/제도 해석",
  human: "사람·현장 스토리",
  factcheck: "팩트체크/오해 교정",
  ai: "AI/기술",
};

// 인기 뉴스 자동 로드용 키워드
const POPULAR_KEYWORDS = [
  "시사", "정치", "경제", "사회", "국제", "문화", "연예", "스포츠",
  "IT", "과학", "부동산", "건강", "AI", "금융", "교육", "환경", "게임", "음식",
];

// 프롬프트 버전 관리 (기본값, DB에서 템플릿을 불러올 수 없을 때 사용)
const NEWS_SCRIPT_PROMPT_VERSION = "3.3"; // 프롬프트 업데이트 시 이 버전 번호를 증가시키세요
const KNOWLEDGE_SCRIPT_PROMPT_VERSION = "1.0"; // 지식 전달 대본 프롬프트 버전

export default function ScriptGenerationPage() {
  // 뉴스 조회 관련 상태
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [newsByCategory, setNewsByCategory] = useState<{ [key: string]: NewsItem[] }>({});
  const [activeTab, setActiveTab] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<NewsItem[]>([]);
  const [useInterestRerank, setUseInterestRerank] = useState(true);
  const [contentMode, setContentMode] = useState<ContentMode>("default");
  
  // 지식 전달 대본 관련 상태
  const [knowledgeTopic, setKnowledgeTopic] = useState("");
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [previousSuggestions, setPreviousSuggestions] = useState<string[]>([]); // 이전 추천 기억

  // 채널 컨셉 정보
  const [channelPurpose, setChannelPurpose] = useState("복잡한 뉴스와 정보를 3분 안에 쉽게 이해하게 만드는 채널. 단순 정보 전달이 아니라 원인, 구조, 맥락을 연결하여 시청자의 사고를 정리해주는 해석형 채널");
  const [channelKeywords, setChannelKeywords] = useState("뉴스 해석, 시사 분석, 정보 정리, 트렌드 분석, 경제 뉴스, 시사 뉴스, 뉴스 요약, 인사이트, 맥락 이해");
  const [coreTargetAudience, setCoreTargetAudience] = useState("20-30대 직장인 및 대학생. 경제, 투자, 시사, 트렌드에 관심이 있지만 정보 과부하로 인해 핵심만 빠르게 알고 싶어하는 사람들");
  const [videoStructure, setVideoStructure] = useState("오프닝 훅 (9초): 질문이나 관점으로 시작 → 핵심 설명 (153초): 사실 → 원인 → 구조 → 맥락 순서로 전개 → 인사이트 요약 (9초): 한 문장으로 정리 → 마무리 (9초): 반복 시청 유도 멘트");
  const [channelToneAndMood, setChannelToneAndMood] = useState("차분하고 분석적인 말투. 감정적 선동이나 판단 강요 없이, 이해를 확장하고 사고를 정리할 수 있도록 설명하는 톤");
  const [channelCharacterPosition, setChannelCharacterPosition] = useState("'설명하는 채널'이 아닌 '생각하게 만드는 채널'. 자극적 제목과 감정 선동을 피하고, 원인과 구조를 보여주는 해석자 역할");

  // 대본 생성 관련 상태
  const [videoTopic, setVideoTopic] = useState("");
  const [additionalRequirements, setAdditionalRequirements] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedScript, setGeneratedScript] = useState(""); // 실제 생성된 대본
  const [knowledgeGeneratedScript, setKnowledgeGeneratedScript] = useState(""); // 지식 전달 대본
  const [usedPrompt, setUsedPrompt] = useState(""); // 대본 생성에 사용된 프롬프트
  const [knowledgeUsedPrompt, setKnowledgeUsedPrompt] = useState(""); // 지식 전달 대본 생성에 사용된 프롬프트
  const [fullContentLength, setFullContentLength] = useState(0); // 가져온 전체 본문 길이
  const [contentSource, setContentSource] = useState<"full_article" | "description">("description"); // 본문 출처
  const [showUsedPrompt, setShowUsedPrompt] = useState(false); // 사용된 프롬프트 표시 여부
  const [showKnowledgeUsedPrompt, setShowKnowledgeUsedPrompt] = useState(false); // 지식 전달 사용된 프롬프트 표시 여부
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // 프롬프트 템플릿 상태
  const [newsScriptTemplate, setNewsScriptTemplate] = useState<string | null>(null);
  const [newsScriptVersion, setNewsScriptVersion] = useState<string>(NEWS_SCRIPT_PROMPT_VERSION);
  const [knowledgeScriptTemplate, setKnowledgeScriptTemplate] = useState<string | null>(null);
  const [knowledgeScriptVersion, setKnowledgeScriptVersion] = useState<string>("1.0");

  useEffect(() => {
    window.scrollTo(0, 0);
    // 프롬프트 템플릿 불러오기
    loadPromptTemplates();
  }, []);

  // 최신 지식 전달 대본 템플릿 내용 추출 (플레이스홀더 변환)
  const getLatestKnowledgeScriptTemplate = (): string => {
    return `앤디리스트 3분 지식 전달 프롬프트 (v{version})
유연한 구조 적용 - 반복 방지형
너는 유튜브 상식·정보 전달 콘텐츠를 전문으로 하는 대본 작성 전문가다.
너의 역할은 단순히 정보를 나열하는 것이 아니라, 시청자가 "아, 이제 이해했다"라고 느끼도록 원인–구조–맥락을 명확하게 정리해주는 것이다.

아래 주제를 바탕으로 시청자의 관심을 끌고, 비구독자도 끝까지 보게 만드는 3분(180초) 분량의 유튜브 영상 대본과 제목을 작성하라.

────────────────

[주제]
{knowledgeTopic}

────────────────

[채널 컨셉]

채널 목적: 복잡한 상식과 정보를 3분 안에 쉽게 이해시키는 해석형 채널. 단순 전달이 아니라 사고를 정리해주는 콘텐츠.

채널 말투: 차분하고 분석적인 톤을 유지하되, 딱딱한 보고서 말투는 피한다. 시청자의 감정을 붙잡는 **따뜻한 공감**과 **장면감**을 함께 넣는다. 감정적 선동, 판단 강요, 훈계 어조는 사용하지 않는다. '설명해주는 사람'의 시점으로 말한다.

음성 전제: 여자 AI 음성, 약간 빠른 속도로 낭독될 것을 전제로 한다. 따라서 문장은 짧고 명확하게 작성한다.

────────────────

[주요 변경사항 (v{version})]
- 중간 궁금증 트리거 규칙 추가: 본문 초반 핵심 설명 직후 필수 1회 삽입 (30~40% 지점 이탈 방지, 3분 기준 약 54초~72초)
- 앵커 문장, 비유, 긴장 유지 문장을 "필수"에서 "참고용"으로 변경
- 고정된 문구 사용을 피하고 주제 내용에 맞는 자연스러운 전환 사용
- 모든 문장을 다 사용할 필요 없음. 주제 내용에 맞게 자연스럽게 선택

**금지 사항 (매우 중요 - 반드시 준수):**
- 아래 문구들은 예시일 뿐이며, 실제 대본에서 반복적으로 사용하지 말 것:
  * "그런데 여기서 대부분이 놓치는 지점이 있습니다"
  * "이 부분을 놓치면 이해가 달라집니다" / "이 부분을 놓치면 해석이 달라집니다"
  * "시간 관점에서 보면" / "개인 관점에서 보면" / "구조 관점에서 보면" (반복 사용 시 지루함)
  * "사실부터 정리해보겠습니다"
- 이런 고정된 문구를 사용하면 대본이 복불처럼 들립니다. 주제 내용에 맞는 자연스러운 문구를 직접 만들어 사용하세요.

**중간 궁금증 트리거 구간에서 절대 사용 금지:**
- "여기서 핵심은"
- "정리하면"
- "결론적으로"
- "이게 중요한 이유는"
- 위 표현들은 시청자에게 '이제 이해 끝' 신호를 주므로 금지한다.

────────────────

[영상 구조 및 작성 규칙]

1. 오프닝 훅
- 질문 또는 관점 제시로 시작
- "이 영상을 끝까지 보면 무엇을 이해하게 되는지"가 분명해야 함
- 2문장 이내
- 각 문장은 20자 내외의 짧은 문장으로 구성
  - 오프닝 2문장 중 1문장은 반드시 **시청자의 체감/감정**을 건드리는 문장으로 쓴다. (예: 불안, 답답함, 궁금함, 기대 같은 감정 단어를 과장 없이 한 번만 사용)

2. 핵심 설명 (본문)
- 전개 순서: 사실 → 원인 → 구조 → 맥락
- 설명형 나열이 아니라 '질문 → 답변' 흐름으로 작성
- 한 문장은 최대 2줄을 넘지 않게 작성
- **중요: 본문은 반드시 1400자 이상이어야 합니다. 3분 분량을 채우기 위해 충분한 내용이 필요합니다.**
- **분량 확보를 위해:**
  * 각 개념을 단순히 설명하지 말고, 왜 그런지, 어떻게 작동하는지, 어떤 영향을 미치는지 등을 자세히 설명
  * 실제 사례를 구체적으로 제시 (예: "2023년 한국은행이 금리를 인상했을 때..." 같은 구체적 사례)
  * 비교 설명 추가 (예: "A와 B의 차이는..." 같은 비교)
  * 배경 지식이나 역사적 맥락 포함
  * 숫자, 통계, 데이터를 구체적으로 제시
  * 다양한 관점이나 측면을 다룸
  * 각 주제를 깊이 있게 설명하여 분량을 채워야 함
  * 단순히 요약만 하지 말고, 충분한 설명과 예시를 포함

────────────────

(1) 감정 장면 삽입 규칙
- 본문 초반(첫 1~2문단)에 **사람이 보이는 장면 1개**를 반드시 넣는다. (3~4문장, 일상적 상황/짧은 사례/대화 한 줄. 실명·과장 금지)
- 이 인물은:
  - 판단하거나 결론을 내리지 않는다
  - 대신 망설이거나, 헷갈리거나, 불편해한다
  - 일상적 상황 / 짧은 내적 독백 1줄 허용
- 목적: 시청자를 '관찰자'가 아니라 '당사자'로 만든다

────────────────

(2) 설명 전환 규칙
- 설명은 자연스러운 흐름을 따른다 (느낌 → 질문 → 구조 설명 순서를 참고하되, 주제 내용에 맞게 유연하게 구성)
- 설명이 너무 빨리 나오면 안 된다
- ※ "사실부터 정리해보겠습니다" 같은 고정된 시작 문구는 피하고, 주제 내용에 맞는 자연스러운 전환 사용

────────────────

(2-1) 중간 궁금증 트리거 규칙 (필수 1회)
- 본문 초반의 핵심 설명이 끝난 직후, 반드시 1회 삽입 (3분 기준 약 54초~72초 지점, 30~40% 구간)
- 이 문장은:
  - 새로운 정보를 제공하지 않는다
  - 결론이나 평가를 제시하지 않는다
  - 다음 내용을 직접적으로 예고하지 않는다
  - 대신 "지금까지의 이해가 충분하지 않다"는 감각만 만들어야 한다
- 단독 줄로 배치하며, 앞뒤 설명과 바로 연결하지 않는다

역할 정의:
이 문장은 흥미 유발이 아니라
시청자가 스스로 판단을 멈추게 만드는 인지적 미완성 상태를 만드는 장치다.

문장 톤 가이드 (예시 방향, 그대로 사용 금지):
- "여기까지 들으면 다 이해한 것 같죠. 그런데 아직 중요한 얘기는 나오지 않았습니다."
- "이쯤에서 고개를 끄덕이게 됩니다. 그래서 다음 얘기가 필요해집니다."
- "지금 이 설명, 맞는 말처럼 들립니다. 문제는 그 다음입니다."
- "여기서 멈추면, 이 주제는 평범해집니다."

※ 실제 대본에서는 주제 내용에 맞게 새로운 문장을 직접 생성할 것
※ 동일 문구 반복 사용 금지

────────────────

(3) 앵커 문장 규칙 (참고용 - 필수 아님)
- **중요: 아래 문장들은 예시일 뿐이며, 반드시 사용할 필요가 없습니다.**
- 주제 내용과 흐름에 자연스럽게 맞을 때만 선택적으로 사용하세요.
- 모든 문장을 다 사용하거나, 특정 문장을 반드시 포함시킬 필요는 전혀 없습니다.
- 가능한 문장 유형 (참고용 예시):
  - "여기서 핵심은 이겁니다."
  - "이걸 한 문장으로 정리하면"
  - "이 지점에서 이해가 달라집니다."
  - "솔직히, 여기서 마음이 갈립니다."
  - "여기서 많은 사람이 멈칫합니다."
- **금지: "이 부분을 놓치면 이해가 달라집니다" / "이 부분을 놓치면 해석이 달라집니다" 같은 문구는 사용하지 말 것 (너무 자주 사용되어 복불처럼 들림)**
- ※ 주제 내용에 맞는 자연스러운 전환 문구를 직접 만들어 사용하는 것을 권장합니다
- ※ 동일 문장 중복 사용 금지

────────────────

(4) 관점 포함 규칙 (참고용 - 필수 아님)
- **중요: 아래 관점들은 참고용이며, 반드시 사용할 필요가 없습니다.**
- 주제 내용에 자연스럽게 맞을 때만 선택적으로 사용하세요.
- 가능한 관점 유형 (참고용):
  ① 개인 관점 (개인의 선택·심리·판단)
  ② 구조 관점 (제도·시스템·환경)
  ③ 시간 관점 (누적·지연·타이밍)
- ※ 어떤 관점을 썼다면 드러나게 표현할 것. 하지만 강제로 포함시킬 필요는 없음.

────────────────

(5) 비유/은유 규칙 (선택적 활용)
- 본문 중간에 설명이 필요할 때만 비유 사용 (필수 아님)
- 설명을 돕는 용도만 허용
- 감정 과잉, 문학적 표현 금지
- 1~2문장 이내
- 비유가 자연스럽지 않으면 사용하지 않아도 됨

3. 긴장 유지 문장 (의식적 멈춤 구간 - 참고용, 필수 아님)
- **중요: 아래 문장들은 예시일 뿐이며, 반드시 사용할 필요가 없습니다.**
- 본문 흐름상 자연스럽게 필요할 때만 선택적으로 사용하세요.
- 앞뒤 문단과 리듬 차이를 만들 때 활용 (단독 줄 권장)
- 가능한 문장 유형 (참고용 예시):
  - "이 주제는 여기서부터 다르게 봐야 합니다."
  - "이 부분이 앞으로 더 중요해질 수 있습니다."
- **금지: "그런데 여기서 대부분이 놓치는 지점이 있습니다" 같은 문구는 사용하지 말 것 (너무 자주 사용되어 복불처럼 들림)**
- ※ 주제 내용에 맞는 자연스러운 전환 문구를 직접 만들어 사용하는 것을 권장합니다
- 목적: 시청자의 사고를 잠시 멈추게 하기 (필요시에만, 자연스러울 때만)

4. 인사이트 요약 (잔상 구간)
- **중요: 본문에서 이미 설명한 사실이나 내용을 단순히 반복하지 말 것**
- 본문과 구분되는 새로운 관점, 의미, 또는 앞으로의 방향을 제시해야 함
- 단순 결론 금지
- '정리'보다 방향 제시
- 이 구간은 문장 길이를 더 짧게 작성
- 설명보다 단정한 문장 사용
  - 이 구간에는 **감정 정리 1문장**을 포함한다. (예: "그래서 우리가 느끼는 궁금함은 당연한 것이고, 이해하면 더 명확해집니다." 같은 톤)

5. 마무리 (반복 인식 강화)
- 질문형으로 끝낼 것
- 이 지식이 개별 정보가 아니라 일상에서 반복되는 구조임을 암시
- 구독·좋아요는 정보 제공의 수단으로 자연스럽게 연결
- 구독·좋아요 문장이 영상의 마지막 문장
- 이후 어떤 멘트도 추가하지 말 것
────────────────
[출력 요구사항]
- 유튜브 영상 제목:
  * 30~40자 이내
  * 정보 나열 금지 (기사 제목처럼 쓰지 말 것)
  * 제목이 '뉴스'처럼 보이면 구독이 멈춘다. **기사 냄새(헤드라인 톤)** 가 나면 실패다.
  * 제목은 정보가 아니라 **질문**이어야 한다.
  * 제목에는 물음표(?)를 사용하지 않는다. 문장 자체를 의문형으로 끝낸다(예: ~일까, ~왜일까, ~어쩌다 이런 일이 반복될까).
  * **제목 끝에 항상 마침표(.)를 추가할 것**
- 전체 대본 분량:
  * **최소 1700자 이상 필수** (3분 분량, 빠른 속도로 읽을 것을 고려하여 충분한 분량 확보)
  * 1700자 미만으로 작성하는 것은 절대 금지
  * 자연스러운 구어체
  * 시간·초 단위 표현 사용 금지
- 오프닝 훅:
  * 약 45~60자
  * 질문형 또는 관점 제시형
- 본문:
  * **최소 1400자 이상 필수** (전체 분량 1700자 이상을 달성하기 위해 필수)
  * **중요: 본문이 1400자 미만이면 절대 안 됩니다. 반드시 1400자 이상 작성하세요.**
  * 예시·비유·사례를 충분히 포함하여 분량을 확보해야 함
  * 각 개념에 대한 구체적인 설명, 실제 사례, 비교 설명 등을 추가하여 충분한 분량을 확보
  * 단순히 요약만 하지 말고, 각 주제를 깊이 있게 설명하여 분량을 채워야 함
  * 3분 분량(180초)을 채우기 위해서는 본문만으로도 최소 1400자 이상이 필수입니다
- 인사이트 요약:
  * 3~4문장
  * 약 75~90자
- 마무리:
  * 질문형
  * 약 60~80자
  * 구독·좋아요 문구 포함
  * 구독·좋아요 문구가 **마지막 문장**이어야 함 (이후 추가 문장 금지)

**분량 검증 (매우 중요 - 반드시 준수):**
- 대본 작성 후 반드시 전체 글자 수를 확인하세요
- **전체 대본이 1700자 미만이면 절대 안 됩니다. 반드시 1700자 이상으로 작성하세요.**
- **본문이 1400자 미만이면 절대 안 됩니다. 반드시 1400자 이상으로 작성하세요.**
- 분량이 부족하면:
  * 각 개념에 대한 더 자세한 설명 추가
  * 실제 사례나 예시를 더 많이 포함
  * 비교 설명이나 배경 지식 추가
  * 구체적인 숫자, 데이터, 통계 포함
  * 주제와 관련된 다양한 관점 제시
  * 각 주제를 더 깊이 있게 설명
- **3분 분량(180초)을 채우기 위해서는 최소 1700자 이상이 필수입니다.**
- **대본이 짧으면 시청자가 영상을 끝까지 보지 않고 이탈합니다. 반드시 충분한 분량을 확보하세요.**
- **현재 대본이 1700자 미만이면, 본문에 더 많은 설명, 사례, 예시를 추가하여 반드시 1700자 이상으로 작성하세요.**
────────────────

한 줄 요약: 이 프롬프트의 목표는 '이해시켰다'가 아니라 '나도 모르게 고개가 끄덕여졌다'다.

**최종 목표:**
이 프롬프트의 목적은 정보 전달 속도를 높이는 것이 아니라, 시청자가 스스로 '아직 판단하면 안 된다'고 느끼게 만드는 구조를 고정하는 것이다. 특히 30~40% 지점(3분 기준 약 54초~72초)에서 이탈하지 않고 끝까지 보도록 만드는 구조적 장치를 포함한다.`;
  }

  // 최신 fallback 템플릿 내용 추출 (플레이스홀더 변환)
  const getLatestNewsScriptTemplate = (): string => {
    return `앤디리스트 2분 30초 기사 해석 프롬프트 (v{version})
감정 진입 강화형 - 집중 분석형
너는 유튜브 뉴스 해석 콘텐츠를 전문으로 하는 대본 작성 전문가다. 너의 역할은 뉴스를 요약하는 것이 아니라, 시청자가 "아, 그래서 내가 이런 느낌을 받았구나", **"그래서 이런 뉴스가 반복되는구나"**라고 감정과 사고가 함께 정리되도록 돕는 것이다.

아래 뉴스 기사를 바탕으로 시청자의 관심을 끌고, 비구독자도 끝까지 보게 만드는 2분 30초(150초) 분량의 유튜브 영상 대본과 제목을 작성하라.

**중요: 반드시 아래 [뉴스 기사 정보] 섹션의 내용을 먼저 읽고, 그 내용을 기반으로 대본을 작성해야 한다. 뉴스 기사 정보를 읽지 않고 일반적인 설명만 하는 것은 절대 금지다.**

────────────────

[핵심 지향점]

이 대본은 정답을 설명하는 콘텐츠가 아니다

시청자가 자기 경험을 떠올리게 만드는 콘텐츠다

이해보다 먼저 **'멈칫하는 순간'**이 한 번은 반드시 들어가야 한다

감동은 설득이 아니라 공감과 잔상에서 나온다

※ 판단, 훈계, 결론 강요는 금지 ※ 설명은 항상 시청자의 감정 이후에 등장해야 한다

────────────────

[뉴스 기사 정보]
- 제목: {newsTitle}
- 내용: {newsDescription}

**중요: 입력 본문이 짧을 경우 (200자 미만):**
- 위 내용이 요약본일 가능성이 높습니다
- 기사 링크를 직접 확인하여 더 자세한 정보를 찾아야 합니다
- 가능한 한 구체적인 사실, 숫자, 이름, 제품명 등을 포함하여 대본을 작성하세요
- 요약본만으로는 부족하므로, 일반적인 설명보다는 기사 제목과 요약본에 나온 구체적 정보를 최대한 활용하세요

**뉴스 기사 정보 활용 원칙 (매우 중요 - 반드시 준수):**

1. **뉴스 기사 내용을 먼저 읽어야 함:**
   - 위 뉴스 기사 제목과 내용을 반드시 먼저 읽고 이해한 후 대본 작성
   - 뉴스 기사 정보를 읽지 않고 일반적인 설명만 하는 것은 절대 금지

2. **구체적 정보 반드시 포함:**
   - 뉴스 기사에 나온 모든 구체적 정보를 반드시 활용해야 함
   - 숫자, 통계, 기업명, 제품명, 지역명, 시기 등 구체적 사실을 빠짐없이 포함
   - 예: "58억 5,000만 달러", "23억 1,000만 달러", "Hilti", "Nuron 배터리 플랫폼", "다이아몬드 코어 드릴" 등
   - 뉴스 기사에 언급된 모든 숫자, 이름, 제품명을 대본에 반드시 포함

3. **추상적 요약 금지:**
   - 뉴스 기사에 언급된 내용을 추상적으로 요약하지 말고, 구체적 사실을 그대로 제시한 후 해석
   - "기업이 똑똑해졌다", "시장이 변했다" 같은 추상적 설명만으로는 부족함
   - 반드시 뉴스 기사에 나온 구체적 사실을 먼저 제시하고, 그 다음에 해석과 맥락을 덧붙임

4. **사실 우선 원칙:**
   - 맥락 설명은 구체적 사실 위에 쌓아올리는 방식으로 작성
   - 사실 없이 맥락만 설명하는 것은 절대 금지
   - 뉴스 기사에 나온 정보만으로는 부족하다고 판단되더라도, 기사에 나온 내용을 최대한 활용하여 구체성을 확보

5. **검증 방법:**
   - 대본을 작성한 후, 뉴스 기사에 나온 모든 주요 정보(숫자, 이름, 제품명 등)가 대본에 포함되었는지 확인
   - 빠진 정보가 있다면 반드시 추가

────────────────

[채널 컨셉]

채널 목적: 복잡한 뉴스와 이슈를 2분 30초 안에 집중적으로 해석해 시청자의 생각과 감정을 동시에 정리해주는 채널

채널 말투: 차분하고 분석적이되, '멀리서 설명하는 전문가'가 아니라 '옆에서 같이 생각해주는 사람'의 시점을 유지한다.

감정 사용 원칙:
- 감정을 자극하지 않는다
- 감정을 부정하지도 않는다
- "그렇게 느꼈다면 자연스럽다"는 태도를 유지한다

음성 전제: 여자 AI 음성, 약간 빠른 속도 → 문장은 짧고, 호흡은 자주 끊는다

────────────────

[주요 변경사항 (v{version})]
- 중간 궁금증 트리거 규칙 추가: 본문 초반 핵심 설명 직후 필수 1회 삽입 (30~40% 지점 이탈 방지, 2분 30초 기준 약 45초~60초)
- 앵커 문장, 비유, 긴장 유지 문장을 "필수"에서 "참고용"으로 변경
- 고정된 문구 사용을 피하고 뉴스 내용에 맞는 자연스러운 전환 사용
- 모든 문장을 다 사용할 필요 없음. 뉴스 내용에 맞게 자연스럽게 선택

**금지 사항 (매우 중요 - 반드시 준수):**
- 아래 문구들은 예시일 뿐이며, 실제 대본에서 반복적으로 사용하지 말 것:
  * "그런데 여기서 대부분이 놓치는 지점이 있습니다"
  * "이 부분을 놓치면 해석이 달라집니다" / "이 부분을 놓치면 이해가 달라집니다"
  * "시간 관점에서 보면" / "개인 관점에서 보면" / "구조 관점에서 보면" (기사 해석 대본에서는 사용 금지)
  * "사실부터 정리해보겠습니다"
- 이런 고정된 문구를 사용하면 대본이 복불처럼 들립니다. 뉴스 내용에 맞는 자연스러운 문구를 직접 만들어 사용하세요.

**중간 궁금증 트리거 구간에서 절대 사용 금지:**
- "여기서 핵심은"
- "정리하면"
- "결론적으로"
- "이게 중요한 이유는"
- 위 표현들은 시청자에게 '이제 이해 끝' 신호를 주므로 금지한다.

────────────────

[영상 구조 및 작성 규칙]
1. 오프닝 훅 (감정 진입 구간)
- 질문 또는 관점 제시로 시작
- 정보보다 감정이 먼저 등장해야 한다
- 2문장 이내
- 두 문장 중:
  1문장은 시청자의 실제 감정 상태를 건드릴 것
  1문장은 이 영상에서 무엇이 정리될지 암시할 것
- 감정 단어는 1개만 사용, 과장 금지
- 목적: 시청자가 "이거 내 얘긴데" 하고 멈추게 만드는 것
2. 본문 – 핵심 설명 (사실 → 원인 → 구조 → 맥락)

**집중 분석 원칙 (매우 중요 - 2분 30초 분량에 맞춘 집중적 해설):**
- 뉴스 기사에 나온 구체적인 숫자, 데이터, 사례를 반드시 포함해야 함
- 예: "58억 5,000만 달러", "Nuron 배터리 플랫폼", "다이아몬드 코어 드릴, 절단기, 레이저 측정기" 등
- 추상적 설명("기업이 똑똑해졌다", "시장이 변했다")만으로는 부족함
- **2분 30초 분량이므로 본문 해설을 더 집중적으로 분석해야 함:**
  * 핵심 사실을 빠르게 제시하고, 그 의미를 깊이 있게 분석
  * 원인과 결과를 명확하게 연결하여 설명
  * 구조적 맥락을 간결하지만 명확하게 제시
  * 불필요한 장식적 표현은 줄이고, 핵심 분석에 집중
  * 각 문장이 정보 밀도를 높게 유지
  * 뉴스 기사의 핵심 내용을 놓치지 않고 집중적으로 해설
- 구체적 사실을 먼저 제시하고, 그 다음에 집중적인 해석과 맥락을 덧붙이는 순서
- 뉴스 기사에 언급된 실제 사례, 기업명, 제품명, 숫자 등을 활용하여 구체성을 확보
- 맥락 설명은 구체적 사실 위에 쌓아올리는 방식으로 작성하되, 더 간결하고 집중적으로

(1) 감정 장면 삽입 규칙
- 본문 초반 1~2문단에는 '사람이 흔들리는 장면' 1개를 반드시 포함
- 이 인물은:
  - 판단하거나 결론을 내리지 않는다
  - 대신 망설이거나, 헷갈리거나, 불편해한다
  - 일상적 상황 / 짧은 내적 독백 1줄 허용
- 목적: 시청자를 '관찰자'가 아니라 '당사자'로 만든다

────────────────

(2) 설명 전환 규칙
- 설명은 자연스러운 흐름을 따른다 (느낌 → 질문 → 구조 설명 순서를 참고하되, 뉴스 내용에 맞게 유연하게 구성)
- 설명이 너무 빨리 나오면 안 된다
- ※ "사실부터 정리해보겠습니다" 같은 고정된 시작 문구는 피하고, 뉴스 내용에 맞는 자연스러운 전환 사용

────────────────

(2-1) 중간 궁금증 트리거 규칙 (필수 1회)
- 본문 초반의 핵심 설명이 끝난 직후, 반드시 1회 삽입 (2분 30초 기준 약 45초~60초 지점, 30~40% 구간)
- 이 문장은:
  - 새로운 정보를 제공하지 않는다
  - 결론이나 평가를 제시하지 않는다
  - 다음 내용을 직접적으로 예고하지 않는다
  - 대신 "지금까지의 이해가 충분하지 않다"는 감각만 만들어야 한다
- 단독 줄로 배치하며, 앞뒤 설명과 바로 연결하지 않는다

역할 정의:
이 문장은 흥미 유발이 아니라
시청자가 스스로 판단을 멈추게 만드는 인지적 미완성 상태를 만드는 장치다.

문장 톤 가이드 (예시 방향, 그대로 사용 금지):
- "여기까지 들으면 다 이해한 것 같죠. 그런데 아직 중요한 얘기는 나오지 않았습니다."
- "이쯤에서 고개를 끄덕이게 됩니다. 그래서 다음 얘기가 필요해집니다."
- "지금 이 설명, 맞는 말처럼 들립니다. 문제는 그 다음입니다."
- "여기서 멈추면, 이 뉴스는 평범해집니다."

※ 실제 대본에서는 뉴스 내용에 맞게 새로운 문장을 직접 생성할 것
※ 동일 문구 반복 사용 금지

────────────────

(3) 앵커 문장 규칙 (참고용 - 필수 아님)
- **중요: 아래 문장들은 예시일 뿐이며, 반드시 사용할 필요가 없습니다.**
- 뉴스 내용과 흐름에 자연스럽게 맞을 때만 선택적으로 사용하세요.
- 모든 문장을 다 사용하거나, 특정 문장을 반드시 포함시킬 필요는 전혀 없습니다.
- 가능한 문장 유형 (참고용 예시):
  - "여기서 핵심은 이겁니다."
  - "이걸 한 문장으로 정리하면"
  - "이 지점에서 뉴스의 성격이 달라집니다."
  - "솔직히, 여기서 마음이 갈립니다."
  - "여기서 많은 사람이 멈칫합니다."
- **금지: "이 부분을 놓치면 해석이 달라집니다" / "이 부분을 놓치면 이해가 달라집니다" 같은 문구는 사용하지 말 것 (너무 자주 사용되어 복불처럼 들림)**
- ※ 뉴스 내용에 맞는 자연스러운 전환 문구를 직접 만들어 사용하는 것을 권장합니다
- ※ 동일 문장 중복 사용 금지

────────────────

(4) 비유/은유 규칙 (선택적 활용)
- 본문 중간에 설명이 필요할 때만 비유 사용 (필수 아님)
- 설명을 돕는 용도만 허용
- 감정 과잉, 문학적 표현 금지
- 1~2문장 이내
- 비유가 자연스럽지 않으면 사용하지 않아도 됨
3. 긴장 유지 문장 (의식적 멈춤 구간 - 참고용, 필수 아님)
- **중요: 아래 문장들은 예시일 뿐이며, 반드시 사용할 필요가 없습니다.**
- 본문 흐름상 자연스럽게 필요할 때만 선택적으로 사용하세요.
- 앞뒤 문단과 리듬 차이를 만들 때 활용 (단독 줄 권장)
- 가능한 문장 유형 (참고용 예시):
  - "이 뉴스는 여기서부터 다르게 봐야 합니다."
  - "이 부분이 앞으로 더 중요해질 수 있습니다."
- **금지: "그런데 여기서 대부분이 놓치는 지점이 있습니다" 같은 문구는 사용하지 말 것 (너무 자주 사용되어 복불처럼 들림)**
- ※ 뉴스 내용에 맞는 자연스러운 전환 문구를 직접 만들어 사용하는 것을 권장합니다
- 목적: 시청자의 사고를 잠시 멈추게 하기 (필요시에만, 자연스러울 때만)
4. 인사이트 요약 (잔상 구간)
- **중요: 본문에서 이미 설명한 사실이나 내용을 단순히 반복하지 말 것**
- 본문과 구분되는 새로운 관점, 의미, 또는 앞으로의 방향을 제시해야 함
- 단순 결론 금지
- '정리'보다 방향 제시
- 이 구간은 문장 길이를 더 짧게 작성
- 설명보다 단정한 문장 사용
  - 이 구간에는 **감정 정리 1문장**을 포함한다. (예: "그래서 우리가 느끼는 불안은 개인 탓이 아니라 구조의 신호다." 같은 톤)
5. 마무리 (반복 인식 강화)
- 질문형으로 끝낼 것
- 이 이슈가 개별 사건이 아니라 반복되는 구조임을 암시
- 구독·좋아요는 정보 제공의 수단으로 자연스럽게 연결
- 구독·좋아요 문장이 영상의 마지막 문장
- 이후 어떤 멘트도 추가하지 말 것
────────────────

[출력 요구사항]

유튜브 영상 제목:
- 30~40자
- 정보 나열 금지
- 기사 헤드라인 톤 금지
- 질문형 문장
- 물음표 사용 금지 (문장 자체로 의문형)
- **제목 끝에 항상 마침표(.)를 추가할 것**

전체 분량:
- **최소 1400자 이상 필수** (2분 30초 분량, 빠른 속도로 읽을 것을 고려하여 충분한 분량 확보)
- 1400자 미만으로 작성하는 것은 절대 금지
- 자연스러운 구어체
- 시간·초 단위 표현 금지

오프닝 훅: 45~60자
본문: **최소 1200자 이상 필수** (전체 분량 1400자 이상을 달성하기 위해 필수, 집중적 분석 필수)
인사이트 요약: 75~90자
마무리: 60~80자

**분량 검증:**
- 대본 작성 후 반드시 전체 글자 수를 확인하세요
- 1400자 미만이면 추가 내용을 보강하여 반드시 1400자 이상으로 작성하세요
- 본문이 1200자 미만이면 구체적인 설명, 사례, 분석을 추가하여 충분한 분량을 확보하세요

────────────────

한 줄 요약: 이 프롬프트의 목표는 '이해시켰다'가 아니라 '나도 모르게 고개가 끄덕여졌다'다.

**최종 목표:**
이 프롬프트의 목적은 정보 전달 속도를 높이는 것이 아니라, 시청자가 스스로 '아직 판단하면 안 된다'고 느끼게 만드는 구조를 고정하는 것이다. 특히 30~40% 지점(2분 30초 기준 약 45초~60초)에서 이탈하지 않고 끝까지 보도록 만드는 구조적 장치를 포함한다.`;
  };

  // 프롬프트 템플릿 불러오기 및 자동 업데이트
  const loadPromptTemplates = async () => {
    try {
      // 기사 해석 대본 템플릿
      const newsResponse = await fetch("/api/prompt-templates?type=news_script");
      if (newsResponse.ok) {
        const newsData = await newsResponse.json();
        if (newsData.success && newsData.template) {
          const latestTemplate = getLatestNewsScriptTemplate();
          
          // 항상 최신 템플릿과 DB 템플릿 내용을 비교하여 다르면 업데이트
          // (코드에서 프롬프트를 수정하면 자동으로 DB도 업데이트되도록)
          const dbContent = newsData.template.content || "";
          const latestContent = latestTemplate;
          
          // 내용이 다르면 업데이트 (버전도 자동으로 업데이트)
          const contentChanged = dbContent !== latestContent;
          
          if (contentChanged) {
            // 내용이 변경되었으므로 버전을 자동으로 업데이트
            // 현재 날짜를 버전에 추가 (예: 3.3.20250121)
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
            const autoVersion = `${NEWS_SCRIPT_PROMPT_VERSION}.${dateStr}`;
            
            console.log("[Template Update] 템플릿 내용이 변경되어 DB를 자동 업데이트합니다.");
            console.log("[Template Update] 버전이 자동으로 업데이트됩니다:", newsData.template.version, "→", autoVersion);
            
            // DB 템플릿 업데이트
            try {
              const updateResponse = await fetch("/api/prompt-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  templateId: newsData.template.templateId,
                  templateType: "news_script",
                  version: autoVersion, // 자동 생성된 버전 사용
                  content: latestTemplate,
                  isActive: true,
                }),
              });
              
              if (updateResponse.ok) {
                const today = new Date();
                const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
                const autoVersion = `${NEWS_SCRIPT_PROMPT_VERSION}.${dateStr}`;
                console.log("[Template Update] ✅ 뉴스 스크립트 템플릿이 최신 버전으로 업데이트되었습니다.");
                setNewsScriptTemplate(latestTemplate);
                setNewsScriptVersion(autoVersion); // 자동 생성된 버전 사용
              } else {
                const errorText = await updateResponse.text();
                console.error("[Template Update] ❌ 템플릿 업데이트 실패:", errorText);
                // 업데이트 실패해도 최신 템플릿을 사용 (DB는 나중에 업데이트됨)
                const today = new Date();
                const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
                const autoVersion = `${NEWS_SCRIPT_PROMPT_VERSION}.${dateStr}`;
                console.log("[Template Update] 최신 템플릿을 메모리에 로드합니다.");
                setNewsScriptTemplate(latestTemplate);
                setNewsScriptVersion(autoVersion);
              }
            } catch (updateError) {
              console.error("[Template Update] ❌ 템플릿 업데이트 중 오류:", updateError);
              // 오류가 발생해도 최신 템플릿을 사용
              const today = new Date();
              const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
              const autoVersion = `${NEWS_SCRIPT_PROMPT_VERSION}.${dateStr}`;
              setNewsScriptTemplate(latestTemplate);
              setNewsScriptVersion(autoVersion);
            }
          } else {
            // 내용이 동일하더라도 최신 템플릿과 버전 사용 (일관성 유지)
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
            const autoVersion = `${NEWS_SCRIPT_PROMPT_VERSION}.${dateStr}`;
            
            console.log("[Template Update] 템플릿 내용이 최신 상태입니다. 버전:", autoVersion);
            setNewsScriptTemplate(latestTemplate);
            setNewsScriptVersion(autoVersion); // 항상 최신 버전 형식 사용
          }
        } else {
          // 템플릿이 없으면 최신 템플릿을 DB에 저장
          const latestTemplate = getLatestNewsScriptTemplate();
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
          const autoVersion = `${NEWS_SCRIPT_PROMPT_VERSION}.${dateStr}`;
          
          try {
            const createResponse = await fetch("/api/prompt-templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                templateType: "news_script",
                version: autoVersion, // 날짜 기반 버전 사용
                content: latestTemplate,
                isActive: true,
              }),
            });
            
            if (createResponse.ok) {
              console.log("[Template Update] 뉴스 스크립트 템플릿이 생성되었습니다. 버전:", autoVersion);
              setNewsScriptTemplate(latestTemplate);
              setNewsScriptVersion(autoVersion);
            }
          } catch (createError) {
            console.warn("템플릿 생성 실패:", createError);
          }
        }
      }
      
      // 지식 전달 대본 템플릿
      const knowledgeResponse = await fetch("/api/prompt-templates?type=knowledge_script");
      if (knowledgeResponse.ok) {
        const knowledgeData = await knowledgeResponse.json();
        if (knowledgeData.success && knowledgeData.template) {
          // 최신 fallback 템플릿 가져오기
          const latestKnowledgeTemplate = getLatestKnowledgeScriptTemplate();
          const dbContent = knowledgeData.template.content;
          const dbVersion = knowledgeData.template.version || KNOWLEDGE_SCRIPT_PROMPT_VERSION;
          
          // 최신 템플릿과 DB 템플릿 비교 (플레이스홀더 제외하고 비교)
          const latestNormalized = latestKnowledgeTemplate.replace(/\{version\}/g, KNOWLEDGE_SCRIPT_PROMPT_VERSION).replace(/\{knowledgeTopic\}/g, "TEST_TOPIC");
          const dbNormalized = dbContent.replace(/\{version\}/g, KNOWLEDGE_SCRIPT_PROMPT_VERSION).replace(/\{knowledgeTopic\}/g, "TEST_TOPIC");
          
          const contentChanged = latestNormalized !== dbNormalized;
          
          // 최신 템플릿에 필수 섹션이 있는지 확인
          const hasRequiredSections = latestKnowledgeTemplate.includes("최소 1700자 이상 필수") && 
                                     latestKnowledgeTemplate.includes("분량 검증");
          
          // 버전이 날짜 형식이 아니면 업데이트 필요 (예: "1.0" -> "1.0.YYYYMMDD")
          const versionNeedsUpdate = !dbVersion.includes(".") || dbVersion.split(".").length < 3;
          
          if (contentChanged || versionNeedsUpdate || !hasRequiredSections) {
            // 템플릿 업데이트 필요
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
            const autoVersion = `${KNOWLEDGE_SCRIPT_PROMPT_VERSION}.${dateStr}`;
            
            console.log("[Template Update] 지식 전달 템플릿 내용이 변경되어 DB를 자동 업데이트합니다.");
            
            try {
              const updateResponse = await fetch("/api/prompt-templates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  templateId: knowledgeData.template.templateId,
                  templateType: "knowledge_script",
                  version: autoVersion,
                  content: latestKnowledgeTemplate,
                  isActive: true,
                }),
              });
              
              if (updateResponse.ok) {
                const autoVersion = `${KNOWLEDGE_SCRIPT_PROMPT_VERSION}.${dateStr}`;
                console.log("[Template Update] ✅ 지식 전달 스크립트 템플릿이 최신 버전으로 업데이트되었습니다.");
                setKnowledgeScriptTemplate(latestKnowledgeTemplate);
                setKnowledgeScriptVersion(autoVersion);
              } else {
                // 업데이트 실패 시 최신 템플릿 사용
                const autoVersion = `${KNOWLEDGE_SCRIPT_PROMPT_VERSION}.${dateStr}`;
                console.log("[Template Update] 최신 템플릿을 메모리에 로드합니다.");
                setKnowledgeScriptTemplate(latestKnowledgeTemplate);
                setKnowledgeScriptVersion(autoVersion);
              }
            } catch (updateError) {
              console.warn("템플릿 업데이트 실패:", updateError);
              // 업데이트 실패해도 최신 템플릿 사용
              const today = new Date();
              const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
              const autoVersion = `${KNOWLEDGE_SCRIPT_PROMPT_VERSION}.${dateStr}`;
              setKnowledgeScriptTemplate(latestKnowledgeTemplate);
              setKnowledgeScriptVersion(autoVersion);
            }
          } else {
            // 내용이 동일하더라도 항상 날짜 기반 버전 사용 (일관성 유지)
            const today = new Date();
            const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
            const autoVersion = `${KNOWLEDGE_SCRIPT_PROMPT_VERSION}.${dateStr}`;
            
            // 버전이 날짜 형식이 아니거나 오늘 날짜가 아니면 업데이트
            const versionNeedsUpdate = !dbVersion.includes(".") || dbVersion.split(".").length < 3 || !dbVersion.match(/\d{8}$/) || dbVersion === "1.0" || dbVersion === KNOWLEDGE_SCRIPT_PROMPT_VERSION || !dbVersion.endsWith(dateStr);
            
            if (versionNeedsUpdate) {
              console.log("[Template Update] 지식 전달 템플릿 버전 형식을 업데이트합니다:", autoVersion, "(현재 버전:", dbVersion, ")");
              try {
                const updateResponse = await fetch("/api/prompt-templates", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    templateId: knowledgeData.template.templateId,
                    templateType: "knowledge_script",
                    version: autoVersion,
                    content: latestKnowledgeTemplate,
                    isActive: true,
                  }),
                });
                
                if (updateResponse.ok) {
                  console.log("[Template Update] ✅ 지식 전달 스크립트 템플릿 버전이 업데이트되었습니다:", autoVersion);
                  setKnowledgeScriptTemplate(latestKnowledgeTemplate);
                  setKnowledgeScriptVersion(autoVersion);
                } else {
                  // 업데이트 실패해도 최신 버전 형식 사용
                  console.log("[Template Update] DB 업데이트 실패했지만 최신 버전 형식을 사용합니다:", autoVersion);
                  setKnowledgeScriptTemplate(latestKnowledgeTemplate);
                  setKnowledgeScriptVersion(autoVersion);
                }
              } catch (updateError) {
                console.warn("템플릿 버전 업데이트 실패:", updateError);
                // 업데이트 실패해도 최신 버전 형식 사용
                setKnowledgeScriptTemplate(latestKnowledgeTemplate);
                setKnowledgeScriptVersion(autoVersion);
              }
            } else {
              // 버전 형식이 올바르면 그대로 사용
              console.log("[Template Update] 지식 전달 템플릿 내용이 최신 상태입니다. 버전:", dbVersion);
              setKnowledgeScriptTemplate(latestKnowledgeTemplate);
              setKnowledgeScriptVersion(dbVersion);
            }
          }
        } else {
          // 템플릿이 없으면 최신 템플릿을 DB에 저장
          const latestKnowledgeTemplate = getLatestKnowledgeScriptTemplate();
          const today = new Date();
          const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
          const autoVersion = `${KNOWLEDGE_SCRIPT_PROMPT_VERSION}.${dateStr}`;
          
          try {
            const createResponse = await fetch("/api/prompt-templates", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                templateType: "knowledge_script",
                version: autoVersion,
                content: latestKnowledgeTemplate,
                isActive: true,
              }),
            });
            
            if (createResponse.ok) {
              console.log("[Template Update] 지식 전달 스크립트 템플릿이 생성되었습니다. 버전:", autoVersion);
              setKnowledgeScriptTemplate(latestKnowledgeTemplate);
              setKnowledgeScriptVersion(autoVersion);
            }
          } catch (createError) {
            console.warn("템플릿 생성 실패:", createError);
          }
        }
      }
    } catch (error) {
      console.warn("프롬프트 템플릿 불러오기 실패:", error);
      // 실패해도 기본 템플릿 사용 가능
    }
  };

  // 과거 버전 프롬프트에 남아있던 "출력 형식" 블록이 혹시 섞여 들어오더라도
  // 화면에 노출되지 않도록 마지막에 한 번 정리합니다.
  const sanitizeGeneratedPrompt = (text: string) => {
    if (!text) return text;

    // 예전 템플릿에서 사용하던 출력 형식 블록 제거
    // (줄바꿈/공백 변형에 강하게 매칭)
    const outputFormatBlock =
      /-?\s*출력\s*형식\s*:\s*\r?\n\s*\[영상\s*제목\]\s*\r?\n\s*제목\s*작성\s*\r?\n\s*\[대본\]\s*\r?\n\s*대본\s*작성\s*/gim;

    return text.replace(outputFormatBlock, "").trim();
  };

  // 뉴스 검색 함수
  const fetchNews = async (searchQuery: string, display: number = 20, sort: string = "date") => {
    try {
      const params = new URLSearchParams({
        query: searchQuery,
        display: String(display),
        sort,
      });
      if (useInterestRerank) params.set("rerank", "interest");
      if (contentMode !== "default") params.set("mode", contentMode);

      const response = await fetch(`/api/naver/news?${params.toString()}`);

      if (!response.ok) {
        let errorMessage = "뉴스 검색 중 오류가 발생했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error(`[뉴스 검색 실패] ${searchQuery}:`, errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // items가 없거나 빈 배열인 경우도 체크
      if (!data.items || data.items.length === 0) {
        console.warn(`[뉴스 검색 결과 없음] ${searchQuery}: API는 성공했지만 결과가 비어있습니다.`);
      }
      
      return data.items || [];
    } catch (err: any) {
      console.error(`[뉴스 검색 예외] ${searchQuery}:`, err.message || err);
      throw err;
    }
  };

  // 인기 뉴스 로드 함수
  const loadPopularNews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const keywordsToSearch = POPULAR_KEYWORDS;
      const itemsPerKeyword = 10;
      
      const categoryPromises = keywordsToSearch.map(async (category) => {
        const items = await fetchNews(category, itemsPerKeyword, "sim");
        return {
          category,
          items: items.map((item: NewsItem) => ({
            ...item,
            category,
          })),
        };
      });

      const categoryResults = await Promise.allSettled(categoryPromises);
      
      const groupedNews: { [key: string]: NewsItem[] } = {};
      
      let successCount = 0;
      let failCount = 0;
      
      categoryResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successCount++;
          const items = result.value.items || [];
          groupedNews[result.value.category] = items;
          if (items.length === 0) {
            console.warn(`키워드 "${keywordsToSearch[index]}" 검색 결과가 비어있습니다.`);
          }
        } else {
          failCount++;
          const reason = result.reason?.message || result.reason || "알 수 없는 오류";
          console.error(`키워드 "${keywordsToSearch[index]}" 검색 실패:`, reason);
          groupedNews[keywordsToSearch[index]] = [];
        }
      });
      
      console.log(`검색 완료: 성공 ${successCount}개 키워드, 실패 ${failCount}개 키워드`);
      
      // 모든 검색이 실패했거나 결과가 모두 비어있는 경우
      const hasAnyResults = Object.values(groupedNews).some(items => items.length > 0);
      if (!hasAnyResults && successCount === 0) {
        setError("모든 카테고리 검색이 실패했습니다. 네이버 API 키 설정을 확인하거나 잠시 후 다시 시도해주세요.");
      } else if (!hasAnyResults) {
        setError("검색은 성공했지만 결과가 없습니다. 다른 검색어나 카테고리를 시도해보세요.");
      }
      
      setNewsByCategory(groupedNews);
      
      if (Object.keys(groupedNews).length > 0) {
        setActiveTab(Object.keys(groupedNews)[0]);
      }
    } catch (err: any) {
      const errorMsg = err.message || "인기 뉴스를 불러오는 중 오류가 발생했습니다.";
      console.error("[인기 뉴스 로드 실패]:", errorMsg);
      setError(errorMsg);
      setNewsByCategory({});
    } finally {
      setIsLoading(false);
    }
  };

  // 뉴스 조회 함수 (통합)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 쉼표로 구분된 키워드를 AND 조건(공백)으로 변환
    let processedQuery = query.trim();
    if (processedQuery.includes(",")) {
      processedQuery = processedQuery.split(",").map(k => k.trim()).filter(k => k).join(" ");
    }
    
    setIsLoading(true);
    setError(null);
    // 검색 조건이 바뀌면 기존 생성 프롬프트는 의미가 없어져서 자동 초기화
    // 또한 기존에 선택한 뉴스(체크 상태)도 새 결과에 섞여 보일 수 있어 함께 초기화
    setSelectedNews([]);
    setVideoTopic("");
    setGeneratedPrompt("");
    setCopied(false);
    setKnowledgeTopic(""); // 지식 전달 모드 초기화

    try {
      // 카테고리 선택이나 검색어 입력이 없으면 인기 뉴스 자동 조회
      if (selectedCategories.length === 0 && !processedQuery) {
        await loadPopularNews();
        return;
      }

      const newsByCategoryMap: { [key: string]: NewsItem[] } = {};

      if (selectedCategories.length > 0 && processedQuery) {
        const categoryPromises = selectedCategories.map(async (category) => {
          const searchTerm = `${category} ${processedQuery}`;
          const items = await fetchNews(searchTerm, 10, "sim");
          return {
            category,
            items: items.map((item: NewsItem) => ({
              ...item,
              category,
            })),
          };
        });

        const categoryResults = await Promise.allSettled(categoryPromises);
        
        categoryResults.forEach((result, index) => {
          const category = selectedCategories[index];
          if (result.status === 'fulfilled') {
            newsByCategoryMap[result.value.category] = result.value.items;
          } else {
            newsByCategoryMap[category] = [];
          }
        });

        if (selectedCategories.length > 0) {
          setActiveTab(selectedCategories[0]);
        }
      } else if (processedQuery) {
        const searchItems = await fetchNews(processedQuery, 10, "sim");
        newsByCategoryMap["검색 결과"] = searchItems.map((item: NewsItem) => ({
          ...item,
          category: undefined,
        }));
        
        setActiveTab("검색 결과");
      } else if (selectedCategories.length > 0) {
        const categoryPromises = selectedCategories.map(async (category) => {
          const items = await fetchNews(category, 10, "sim");
          return {
            category,
            items: items.map((item: NewsItem) => ({
              ...item,
              category,
            })),
          };
        });

        const categoryResults = await Promise.allSettled(categoryPromises);
        
        categoryResults.forEach((result, index) => {
          const category = selectedCategories[index];
          if (result.status === 'fulfilled') {
            newsByCategoryMap[result.value.category] = result.value.items;
          } else {
            newsByCategoryMap[category] = [];
          }
        });

        if (selectedCategories.length > 0) {
          setActiveTab(selectedCategories[0]);
        }
      }
      
      setNewsByCategory(newsByCategoryMap);
    } catch (err: any) {
      setError(err.message || "뉴스 검색 중 오류가 발생했습니다.");
      setNewsByCategory({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // 뉴스 선택/해제 함수 (하나만 선택 가능)
  const toggleNewsSelection = (news: NewsItem) => {
    setSelectedNews((prev) => {
      const isSelected = prev.some((item) => item.link === news.link);
      if (isSelected) {
        // 같은 뉴스를 클릭하면 선택 해제
        setVideoTopic("");
        setGeneratedPrompt("");
        setCopied(false);
        return [];
      } else {
        // 새로운 뉴스를 선택하면 기존 선택을 해제하고 새로 선택
        setVideoTopic(news.title);
        setGeneratedPrompt("");
        setCopied(false);
        return [news];
      }
    });
  };

  const isNewsSelected = (news: NewsItem) => {
    return selectedNews.some((item) => item.link === news.link);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // 템플릿 플레이스홀더 치환 함수
  const replaceTemplatePlaceholders = (template: string, placeholders: Record<string, string>): string => {
    let result = template;
    for (const [key, value] of Object.entries(placeholders)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  };

  const handleGenerateScript = async () => {
    if (selectedNews.length === 0) {
      alert("대본을 만들 뉴스를 최소 1개 이상 선택해주세요.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedScript(""); // 이전 대본 초기화
    // 지식 주제 초기화 (뉴스 해설 모드로 전환)
    setKnowledgeTopic("");

    // 첫 번째 선택한 뉴스 사용 (하나만)
    const news = selectedNews[0];

    // 뉴스 기사 전체 본문 가져오기 시도
    let fullContent = news.description; // 기본값은 description
    let contentSourceType: "full_article" | "description" = "description"; // 본문 출처 추적
    try {
      const newsUrl = news.originallink || news.link;
      if (newsUrl) {
        console.log("[Script Generation] Attempting to fetch full article from:", newsUrl);
        const contentResponse = await fetch(`/api/naver/news-content?url=${encodeURIComponent(newsUrl)}`);
        if (contentResponse.ok) {
          const contentData = await contentResponse.json();
          if (contentData.content && contentData.content.length > 100) {
            fullContent = contentData.content;
            contentSourceType = "full_article";
            console.log("[Script Generation] ✅ Full article content fetched, length:", fullContent.length);
          } else {
            console.warn("[Script Generation] ⚠️ Content extraction failed or too short, using description");
            if (contentData.error) {
              console.warn("[Script Generation] Extraction error:", contentData.error);
            }
            // 본문 추출 실패 시 경고 표시
            setError("⚠️ 전체 기사 본문을 가져오지 못했습니다. 요약본만 사용되므로 대본이 짧을 수 있습니다. 기사 링크를 직접 확인해주세요.");
          }
        } else {
          console.warn("[Script Generation] ⚠️ Content API request failed, using description");
          setError("⚠️ 전체 기사 본문을 가져오지 못했습니다. 요약본만 사용되므로 대본이 짧을 수 있습니다.");
        }
      }
    } catch (err) {
      console.warn("[Script Generation] ⚠️ Failed to fetch full content, using description:", err);
      // 본문 가져오기 실패 시 description 사용
      setError("⚠️ 전체 기사 본문을 가져오지 못했습니다. 요약본만 사용되므로 대본이 짧을 수 있습니다.");
    }
    
    // 전체 본문 길이 및 출처 저장 (확인용)
    setFullContentLength(fullContent.length);
    setContentSource(contentSourceType);
    
    // 본문이 너무 짧으면(200자 미만) 경고 추가
    if (fullContent.length < 200 && contentSourceType === "description") {
      setError("⚠️ 경고: 입력 본문이 너무 짧습니다 (" + fullContent.length + "자). 전체 기사 본문을 가져오지 못해 요약본만 사용됩니다. 대본이 부족할 수 있으니 기사 링크를 직접 확인해주세요.");
    }

    // DB에서 템플릿을 불러왔으면 사용, 없으면 기본 템플릿 사용
    let prompt: string;
    const versionToUse = newsScriptVersion || NEWS_SCRIPT_PROMPT_VERSION; // DB 버전 우선, 없으면 상수 사용
    if (newsScriptTemplate) {
      prompt = replaceTemplatePlaceholders(newsScriptTemplate, {
        version: versionToUse, // DB에서 불러온 버전 사용
        newsTitle: news.title,
        newsDescription: fullContent, // 전체 본문 사용
      });
    } else {
      // 기본 템플릿 (fallback) - DB 버전 사용
      prompt = `앤디리스트 2분 30초 기사 해석 프롬프트 (v${versionToUse})
감정 진입 강화형 - 집중 분석형
너는 유튜브 뉴스 해석 콘텐츠를 전문으로 하는 대본 작성 전문가다. 너의 역할은 뉴스를 요약하는 것이 아니라, 시청자가 "아, 그래서 내가 이런 느낌을 받았구나", **"그래서 이런 뉴스가 반복되는구나"**라고 감정과 사고가 함께 정리되도록 돕는 것이다.

아래 뉴스 기사를 바탕으로 시청자의 관심을 끌고, 비구독자도 끝까지 보게 만드는 2분 30초(150초) 분량의 유튜브 영상 대본과 제목을 작성하라.

**중요: 반드시 아래 [뉴스 기사 정보] 섹션의 내용을 먼저 읽고, 그 내용을 기반으로 대본을 작성해야 한다. 뉴스 기사 정보를 읽지 않고 일반적인 설명만 하는 것은 절대 금지다.**

────────────────

[핵심 지향점]

이 대본은 정답을 설명하는 콘텐츠가 아니다

시청자가 자기 경험을 떠올리게 만드는 콘텐츠다

이해보다 먼저 **'멈칫하는 순간'**이 한 번은 반드시 들어가야 한다

감동은 설득이 아니라 공감과 잔상에서 나온다

※ 판단, 훈계, 결론 강요는 금지 ※ 설명은 항상 시청자의 감정 이후에 등장해야 한다

────────────────

[뉴스 기사 정보]
- 제목: ${news.title}
- 내용: ${fullContent}

${fullContent.length < 200 ? `**⚠️ 중요: 입력 본문이 짧습니다 (${fullContent.length}자).**
- 위 내용이 요약본일 가능성이 높습니다
- 기사 링크를 직접 확인하여 더 자세한 정보를 찾아야 합니다
- 가능한 한 구체적인 사실, 숫자, 이름, 제품명 등을 포함하여 대본을 작성하세요
- 요약본만으로는 부족하므로, 일반적인 설명보다는 기사 제목과 요약본에 나온 구체적 정보를 최대한 활용하세요
- 하지만 반드시 1400자 이상의 충분한 분량의 대본을 작성해야 합니다` : ''}

**뉴스 기사 정보 활용 원칙 (매우 중요 - 반드시 준수):**

1. **뉴스 기사 내용을 먼저 읽어야 함:**
   - 위 뉴스 기사 제목과 내용을 반드시 먼저 읽고 이해한 후 대본 작성
   - 뉴스 기사 정보를 읽지 않고 일반적인 설명만 하는 것은 절대 금지

2. **구체적 정보 반드시 포함:**
   - 뉴스 기사에 나온 모든 구체적 정보를 반드시 활용해야 함
   - 숫자, 통계, 기업명, 제품명, 지역명, 시기 등 구체적 사실을 빠짐없이 포함
   - 예: "58억 5,000만 달러", "23억 1,000만 달러", "Hilti", "Nuron 배터리 플랫폼", "다이아몬드 코어 드릴" 등
   - 뉴스 기사에 언급된 모든 숫자, 이름, 제품명을 대본에 반드시 포함

3. **추상적 요약 금지:**
   - 뉴스 기사에 언급된 내용을 추상적으로 요약하지 말고, 구체적 사실을 그대로 제시한 후 해석
   - "기업이 똑똑해졌다", "시장이 변했다" 같은 추상적 설명만으로는 부족함
   - 반드시 뉴스 기사에 나온 구체적 사실을 먼저 제시하고, 그 다음에 해석과 맥락을 덧붙임

4. **사실 우선 원칙:**
   - 맥락 설명은 구체적 사실 위에 쌓아올리는 방식으로 작성
   - 사실 없이 맥락만 설명하는 것은 절대 금지
   - 뉴스 기사에 나온 정보만으로는 부족하다고 판단되더라도, 기사에 나온 내용을 최대한 활용하여 구체성을 확보

5. **검증 방법:**
   - 대본을 작성한 후, 뉴스 기사에 나온 모든 주요 정보(숫자, 이름, 제품명 등)가 대본에 포함되었는지 확인
   - 빠진 정보가 있다면 반드시 추가

────────────────

[채널 컨셉]

채널 목적: 복잡한 뉴스와 이슈를 2분 30초 안에 집중적으로 해석해 시청자의 생각과 감정을 동시에 정리해주는 채널

채널 말투: 차분하고 분석적이되, '멀리서 설명하는 전문가'가 아니라 '옆에서 같이 생각해주는 사람'의 시점을 유지한다.

감정 사용 원칙:
- 감정을 자극하지 않는다
- 감정을 부정하지도 않는다
- "그렇게 느꼈다면 자연스럽다"는 태도를 유지한다

음성 전제: 여자 AI 음성, 약간 빠른 속도 → 문장은 짧고, 호흡은 자주 끊는다

────────────────

[주요 변경사항 (v${versionToUse})]
- 중간 궁금증 트리거 규칙 추가: 본문 초반 핵심 설명 직후 필수 1회 삽입 (30~40% 지점 이탈 방지, 2분 30초 기준 약 45초~60초)
- 앵커 문장, 비유, 긴장 유지 문장을 "필수"에서 "참고용"으로 변경
- 고정된 문구 사용을 피하고 뉴스 내용에 맞는 자연스러운 전환 사용
- 모든 문장을 다 사용할 필요 없음. 뉴스 내용에 맞게 자연스럽게 선택

**금지 사항 (매우 중요 - 반드시 준수):**
- 아래 문구들은 예시일 뿐이며, 실제 대본에서 반복적으로 사용하지 말 것:
  * "그런데 여기서 대부분이 놓치는 지점이 있습니다"
  * "이 부분을 놓치면 해석이 달라집니다" / "이 부분을 놓치면 이해가 달라집니다"
  * "시간 관점에서 보면" / "개인 관점에서 보면" / "구조 관점에서 보면" (기사 해석 대본에서는 사용 금지)
  * "사실부터 정리해보겠습니다"
- 이런 고정된 문구를 사용하면 대본이 복불처럼 들립니다. 뉴스 내용에 맞는 자연스러운 문구를 직접 만들어 사용하세요.

**중간 궁금증 트리거 구간에서 절대 사용 금지:**
- "여기서 핵심은"
- "정리하면"
- "결론적으로"
- "이게 중요한 이유는"
- 위 표현들은 시청자에게 '이제 이해 끝' 신호를 주므로 금지한다.

────────────────

[영상 구조 및 작성 규칙]
1. 오프닝 훅 (감정 진입 구간)
- 질문 또는 관점 제시로 시작
- 정보보다 감정이 먼저 등장해야 한다
- 2문장 이내
- 두 문장 중:
  1문장은 시청자의 실제 감정 상태를 건드릴 것
  1문장은 이 영상에서 무엇이 정리될지 암시할 것
- 감정 단어는 1개만 사용, 과장 금지
- 목적: 시청자가 "이거 내 얘긴데" 하고 멈추게 만드는 것
2. 본문 – 핵심 설명 (사실 → 원인 → 구조 → 맥락)

**집중 분석 원칙 (매우 중요 - 2분 30초 분량에 맞춘 집중적 해설):**
- 뉴스 기사에 나온 구체적인 숫자, 데이터, 사례를 반드시 포함해야 함
- 예: "58억 5,000만 달러", "Nuron 배터리 플랫폼", "다이아몬드 코어 드릴, 절단기, 레이저 측정기" 등
- 추상적 설명("기업이 똑똑해졌다", "시장이 변했다")만으로는 부족함
- **2분 30초 분량이므로 본문 해설을 더 집중적으로 분석해야 함:**
  * 핵심 사실을 빠르게 제시하고, 그 의미를 깊이 있게 분석
  * 원인과 결과를 명확하게 연결하여 설명
  * 구조적 맥락을 간결하지만 명확하게 제시
  * 불필요한 장식적 표현은 줄이고, 핵심 분석에 집중
  * 각 문장이 정보 밀도를 높게 유지
  * 뉴스 기사의 핵심 내용을 놓치지 않고 집중적으로 해설
- 구체적 사실을 먼저 제시하고, 그 다음에 집중적인 해석과 맥락을 덧붙이는 순서
- 뉴스 기사에 언급된 실제 사례, 기업명, 제품명, 숫자 등을 활용하여 구체성을 확보
- 맥락 설명은 구체적 사실 위에 쌓아올리는 방식으로 작성하되, 더 간결하고 집중적으로

(1) 감정 장면 삽입 규칙
- 본문 초반 1~2문단에는 '사람이 흔들리는 장면' 1개를 반드시 포함
- 이 인물은:
  - 판단하거나 결론을 내리지 않는다
  - 대신 망설이거나, 헷갈리거나, 불편해한다
  - 일상적 상황 / 짧은 내적 독백 1줄 허용
- 목적: 시청자를 '관찰자'가 아니라 '당사자'로 만든다

────────────────

(2) 설명 전환 규칙
- 설명은 자연스러운 흐름을 따른다 (느낌 → 질문 → 구조 설명 순서를 참고하되, 뉴스 내용에 맞게 유연하게 구성)
- 설명이 너무 빨리 나오면 안 된다
- ※ "사실부터 정리해보겠습니다" 같은 고정된 시작 문구는 피하고, 뉴스 내용에 맞는 자연스러운 전환 사용

────────────────

(2-1) 중간 궁금증 트리거 규칙 (필수 1회)
- 본문 초반의 핵심 설명이 끝난 직후, 반드시 1회 삽입 (2분 30초 기준 약 45초~60초 지점, 30~40% 구간)
- 이 문장은:
  - 새로운 정보를 제공하지 않는다
  - 결론이나 평가를 제시하지 않는다
  - 다음 내용을 직접적으로 예고하지 않는다
  - 대신 "지금까지의 이해가 충분하지 않다"는 감각만 만들어야 한다
- 단독 줄로 배치하며, 앞뒤 설명과 바로 연결하지 않는다

역할 정의:
이 문장은 흥미 유발이 아니라
시청자가 스스로 판단을 멈추게 만드는 인지적 미완성 상태를 만드는 장치다.

문장 톤 가이드 (예시 방향, 그대로 사용 금지):
- "여기까지 들으면 다 이해한 것 같죠. 그런데 아직 중요한 얘기는 나오지 않았습니다."
- "이쯤에서 고개를 끄덕이게 됩니다. 그래서 다음 얘기가 필요해집니다."
- "지금 이 설명, 맞는 말처럼 들립니다. 문제는 그 다음입니다."
- "여기서 멈추면, 이 뉴스는 평범해집니다."

※ 실제 대본에서는 뉴스 내용에 맞게 새로운 문장을 직접 생성할 것
※ 동일 문구 반복 사용 금지

────────────────

(3) 앵커 문장 규칙 (참고용 - 필수 아님)
- **중요: 아래 문장들은 예시일 뿐이며, 반드시 사용할 필요가 없습니다.**
- 뉴스 내용과 흐름에 자연스럽게 맞을 때만 선택적으로 사용하세요.
- 모든 문장을 다 사용하거나, 특정 문장을 반드시 포함시킬 필요는 전혀 없습니다.
- 가능한 문장 유형 (참고용 예시):
  - "여기서 핵심은 이겁니다."
  - "이걸 한 문장으로 정리하면"
  - "이 지점에서 뉴스의 성격이 달라집니다."
  - "솔직히, 여기서 마음이 갈립니다."
  - "여기서 많은 사람이 멈칫합니다."
- **금지: "이 부분을 놓치면 해석이 달라집니다" / "이 부분을 놓치면 이해가 달라집니다" 같은 문구는 사용하지 말 것 (너무 자주 사용되어 복불처럼 들림)**
- ※ 뉴스 내용에 맞는 자연스러운 전환 문구를 직접 만들어 사용하는 것을 권장합니다
- ※ 동일 문장 중복 사용 금지

────────────────

(4) 비유/은유 규칙 (선택적 활용)
- 본문 중간에 설명이 필요할 때만 비유 사용 (필수 아님)
- 설명을 돕는 용도만 허용
- 감정 과잉, 문학적 표현 금지
- 1~2문장 이내
- 비유가 자연스럽지 않으면 사용하지 않아도 됨
3. 긴장 유지 문장 (의식적 멈춤 구간 - 참고용, 필수 아님)
- **중요: 아래 문장들은 예시일 뿐이며, 반드시 사용할 필요가 없습니다.**
- 본문 흐름상 자연스럽게 필요할 때만 선택적으로 사용하세요.
- 앞뒤 문단과 리듬 차이를 만들 때 활용 (단독 줄 권장)
- 가능한 문장 유형 (참고용 예시):
  - "이 뉴스는 여기서부터 다르게 봐야 합니다."
  - "이 부분이 앞으로 더 중요해질 수 있습니다."
- **금지: "그런데 여기서 대부분이 놓치는 지점이 있습니다" 같은 문구는 사용하지 말 것 (너무 자주 사용되어 복불처럼 들림)**
- ※ 뉴스 내용에 맞는 자연스러운 전환 문구를 직접 만들어 사용하는 것을 권장합니다
- 목적: 시청자의 사고를 잠시 멈추게 하기 (필요시에만, 자연스러울 때만)
4. 인사이트 요약 (잔상 구간)
- **중요: 본문에서 이미 설명한 사실이나 내용을 단순히 반복하지 말 것**
- 본문과 구분되는 새로운 관점, 의미, 또는 앞으로의 방향을 제시해야 함
- 단순 결론 금지
- '정리'보다 방향 제시
- 이 구간은 문장 길이를 더 짧게 작성
- 설명보다 단정한 문장 사용
  - 이 구간에는 **감정 정리 1문장**을 포함한다. (예: “그래서 우리가 느끼는 불안은 개인 탓이 아니라 구조의 신호다.” 같은 톤)
5. 마무리 (반복 인식 강화)
- 질문형으로 끝낼 것
- 이 이슈가 개별 사건이 아니라 반복되는 구조임을 암시
- 구독·좋아요는 정보 제공의 수단으로 자연스럽게 연결
- 구독·좋아요 문장이 영상의 마지막 문장
- 이후 어떤 멘트도 추가하지 말 것
────────────────

[출력 요구사항]

유튜브 영상 제목:
- 30~40자
- 정보 나열 금지
- 기사 헤드라인 톤 금지
- 질문형 문장
- 물음표 사용 금지 (문장 자체로 의문형)
- **제목 끝에 항상 마침표(.)를 추가할 것**

전체 분량:
- **최소 1700자 이상 필수** (빠른 속도로 읽을 것을 고려하여 충분한 분량 확보)
- 1700자 미만으로 작성하는 것은 절대 금지
- 자연스러운 구어체
- 시간·초 단위 표현 금지

오프닝 훅: 45~60자
본문: **최소 1400자 이상 필수** (전체 분량 1700자 이상을 달성하기 위해 필수)
인사이트 요약: 75~90자
마무리: 60~80자

**분량 검증:**
- 대본 작성 후 반드시 전체 글자 수를 확인하세요
- 1700자 미만이면 추가 내용을 보강하여 반드시 1700자 이상으로 작성하세요

────────────────

한 줄 요약: 이 프롬프트의 목표는 '이해시켰다'가 아니라 '나도 모르게 고개가 끄덕여졌다'다.

**최종 목표:**
이 프롬프트의 목적은 정보 전달 속도를 높이는 것이 아니라, 시청자가 스스로 '아직 판단하면 안 된다'고 느끼게 만드는 구조를 고정하는 것이다. 특히 30~40% 지점(2분 30초 기준 약 45초~60초)에서 이탈하지 않고 끝까지 보도록 만드는 구조적 장치를 포함한다.
`;
    }

    // 프롬프트 저장 (참고용 및 확인용)
    const sanitizedPrompt = sanitizeGeneratedPrompt(prompt);
    setGeneratedPrompt(sanitizedPrompt);
    setUsedPrompt(sanitizedPrompt); // 대본 생성에 사용된 프롬프트 저장

    // AI API를 호출하여 실제 대본 생성
    try {
      console.log("[Script Generation] Calling AI API to generate script...");
      console.log("[Script Generation] Content source:", contentSourceType, "Length:", fullContent.length);
      console.log("[Script Generation] Prompt length:", prompt.length);
      
      const response = await fetch("/api/ai/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      console.log("[Script Generation] API Response status:", response.status);

      if (!response.ok) {
        let errorMessage = "대본 생성 중 오류가 발생했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("[Script Generation] API Error:", errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error("[Script Generation] API Error (text):", errorText);
          errorMessage = `대본 생성 실패 (HTTP ${response.status}): ${errorText.substring(0, 200)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("[Script Generation] API Response data:", { 
        success: data.success, 
        hasScript: !!data.script,
        scriptLength: data.script?.length 
      });
      
      if (data.success && data.script) {
        console.log("[Script Generation] ✅ Script generated successfully, length:", data.script.length);
        setGeneratedScript(data.script);
        setError(null); // 성공 시 에러 초기화
      } else {
        console.error("[Script Generation] ❌ Invalid response format:", data);
        throw new Error(data.error || "대본 생성에 실패했습니다. 응답 형식이 올바르지 않습니다.");
      }
    } catch (err: any) {
      console.error("[Script Generation] ❌ Error generating script:", err);
      const errorMessage = err.message || "대본 생성 중 오류가 발생했습니다. OpenAI API 키가 설정되어 있는지 확인해주세요.";
      setError(errorMessage);
      // 오류가 발생해도 프롬프트는 표시 (사용자가 수동으로 사용 가능)
    } finally {
      setCopied(false);
      setIsGenerating(false);
    }
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

  const handleResetSelection = () => {
    setSelectedNews([]);
    setVideoTopic("");
    setGeneratedPrompt("");
    setCopied(false);
  };

  // 지식 전달 대본 프롬프트 초기화 함수
  const handleResetKnowledgePrompt = () => {
    setKnowledgeTopic("");
    setGeneratedPrompt("");
    setKnowledgeGeneratedScript("");
    setKnowledgeUsedPrompt("");
    setCopied(false);
    setTopicSuggestions([]);
    setShowSuggestions(false);
    setPreviousSuggestions([]); // 이전 추천 목록도 초기화
  };

  // AI 주제 추천 함수
  const handleGetTopicSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setShowSuggestions(false);
    setError(null);

    try {
      // 쉼표로 구분된 키워드를 AND 조건(공백)으로 변환
      let processedInput = knowledgeTopic.trim();
      if (processedInput.includes(",")) {
        processedInput = processedInput.split(",").map(k => k.trim()).filter(k => k).join(" ");
      }
      
      // 사용자 입력 내용을 함께 전달
      const userInput = processedInput;
      const timestamp = Date.now();
      
      // 사용자 입력이 있으면 함께 전달, 없으면 일반 추천
      const url = userInput 
        ? `/api/ai/topic-suggestions?t=${timestamp}&input=${encodeURIComponent(userInput)}`
        : `/api/ai/topic-suggestions?t=${timestamp}`;
      
      const response = await fetch(url, {
        cache: 'no-store', // 캐시 방지
      });

      if (!response.ok) {
        throw new Error("주제 추천 중 오류가 발생했습니다.");
      }

      const data = await response.json();
      const newSuggestions = data.suggestions || [];
      
      // 이전 추천과 중복되지 않는 주제만 필터링
      const uniqueSuggestions = newSuggestions.filter(
        (topic: string) => !previousSuggestions.includes(topic)
      );
      
      // 중복이 많으면 원본 사용 (모두 중복인 경우 방지)
      const finalSuggestions = uniqueSuggestions.length >= 3 
        ? uniqueSuggestions.slice(0, 5)
        : newSuggestions.slice(0, 5);
      
      setTopicSuggestions(finalSuggestions);
      // 이전 추천 목록에 추가 (최대 20개까지만 유지)
      setPreviousSuggestions((prev) => {
        const combined = [...prev, ...finalSuggestions];
        return combined.slice(-20); // 최근 20개만 유지
      });
      setShowSuggestions(true);
    } catch (err: any) {
      console.error("[주제 추천 실패]:", err.message);
      setError("주제 추천을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // 추천 주제 선택 함수
  const handleSelectSuggestion = (topic: string) => {
    setKnowledgeTopic(topic);
    setShowSuggestions(false);
  };

  // 지식 전달 대본 생성 함수
  const handleGenerateKnowledgePrompt = async () => {
    if (!knowledgeTopic.trim()) {
      alert("주제를 입력해주세요.");
      return;
    }

    // 쉼표로 구분된 키워드를 AND 조건(공백)으로 변환
    let processedTopic = knowledgeTopic.trim();
    if (processedTopic.includes(",")) {
      processedTopic = processedTopic.split(",").map(k => k.trim()).filter(k => k).join(" ");
    }

    setIsGenerating(true);
    setError(null);
    setKnowledgeGeneratedScript(""); // 이전 대본 초기화
    // 뉴스 선택 상태 초기화 (지식 전달 모드로 전환)
    setSelectedNews([]);
    setVideoTopic("");

    // DB에서 템플릿을 불러왔으면 사용, 없으면 기본 템플릿 사용
    let prompt: string;
    if (knowledgeScriptTemplate) {
      prompt = replaceTemplatePlaceholders(knowledgeScriptTemplate, {
        version: knowledgeScriptVersion, // DB에서 불러온 버전 사용
        knowledgeTopic: processedTopic,
      });
    } else {
      // 기본 템플릿 (fallback)
      prompt = `앤디리스트 3분 지식 전달 프롬프트 (v${knowledgeScriptVersion})
유연한 구조 적용 - 반복 방지형
너는 유튜브 상식·정보 전달 콘텐츠를 전문으로 하는 대본 작성 전문가다.
너의 역할은 단순히 정보를 나열하는 것이 아니라, 시청자가 "아, 이제 이해했다"라고 느끼도록 원인–구조–맥락을 명확하게 정리해주는 것이다.

아래 주제를 바탕으로 시청자의 관심을 끌고, 비구독자도 끝까지 보게 만드는 3분(180초) 분량의 유튜브 영상 대본과 제목을 작성하라.

────────────────

[주제]
${processedTopic}

────────────────

[채널 컨셉]

채널 목적: 복잡한 상식과 정보를 3분 안에 쉽게 이해시키는 해석형 채널. 단순 전달이 아니라 사고를 정리해주는 콘텐츠.

채널 말투: 차분하고 분석적인 톤을 유지하되, 딱딱한 보고서 말투는 피한다. 시청자의 감정을 붙잡는 **따뜻한 공감**과 **장면감**을 함께 넣는다. 감정적 선동, 판단 강요, 훈계 어조는 사용하지 않는다. '설명해주는 사람'의 시점으로 말한다.

음성 전제: 여자 AI 음성, 약간 빠른 속도로 낭독될 것을 전제로 한다. 따라서 문장은 짧고 명확하게 작성한다.

────────────────

[주요 변경사항 (v${knowledgeScriptVersion})]
- 중간 궁금증 트리거 규칙 추가: 본문 초반 핵심 설명 직후 필수 1회 삽입 (30~40% 지점 이탈 방지, 3분 기준 약 54초~72초)
- 앵커 문장, 비유, 긴장 유지 문장을 "필수"에서 "참고용"으로 변경
- 고정된 문구 사용을 피하고 주제 내용에 맞는 자연스러운 전환 사용
- 모든 문장을 다 사용할 필요 없음. 주제 내용에 맞게 자연스럽게 선택

**금지 사항 (매우 중요 - 반드시 준수):**
- 아래 문구들은 예시일 뿐이며, 실제 대본에서 반복적으로 사용하지 말 것:
  * "그런데 여기서 대부분이 놓치는 지점이 있습니다"
  * "이 부분을 놓치면 이해가 달라집니다" / "이 부분을 놓치면 해석이 달라집니다"
  * "시간 관점에서 보면" / "개인 관점에서 보면" / "구조 관점에서 보면" (반복 사용 시 지루함)
  * "사실부터 정리해보겠습니다"
- 이런 고정된 문구를 사용하면 대본이 복불처럼 들립니다. 주제 내용에 맞는 자연스러운 문구를 직접 만들어 사용하세요.

**중간 궁금증 트리거 구간에서 절대 사용 금지:**
- "여기서 핵심은"
- "정리하면"
- "결론적으로"
- "이게 중요한 이유는"
- 위 표현들은 시청자에게 '이제 이해 끝' 신호를 주므로 금지한다.

────────────────

[영상 구조 및 작성 규칙]

1. 오프닝 훅
- 질문 또는 관점 제시로 시작
- "이 영상을 끝까지 보면 무엇을 이해하게 되는지"가 분명해야 함
- 2문장 이내
- 각 문장은 20자 내외의 짧은 문장으로 구성
  - 오프닝 2문장 중 1문장은 반드시 **시청자의 체감/감정**을 건드리는 문장으로 쓴다. (예: 불안, 답답함, 궁금함, 기대 같은 감정 단어를 과장 없이 한 번만 사용)

2. 핵심 설명 (본문)
- 전개 순서: 사실 → 원인 → 구조 → 맥락
- 설명형 나열이 아니라 '질문 → 답변' 흐름으로 작성
- 한 문장은 최대 2줄을 넘지 않게 작성

────────────────

(1) 감정 장면 삽입 규칙
- 본문 초반(첫 1~2문단)에 **사람이 보이는 장면 1개**를 반드시 넣는다. (3~4문장, 일상적 상황/짧은 사례/대화 한 줄. 실명·과장 금지)
- 이 인물은:
  - 판단하거나 결론을 내리지 않는다
  - 대신 망설이거나, 헷갈리거나, 불편해한다
  - 일상적 상황 / 짧은 내적 독백 1줄 허용
- 목적: 시청자를 '관찰자'가 아니라 '당사자'로 만든다

────────────────

(2) 설명 전환 규칙
- 설명은 자연스러운 흐름을 따른다 (느낌 → 질문 → 구조 설명 순서를 참고하되, 주제 내용에 맞게 유연하게 구성)
- 설명이 너무 빨리 나오면 안 된다
- ※ "사실부터 정리해보겠습니다" 같은 고정된 시작 문구는 피하고, 주제 내용에 맞는 자연스러운 전환 사용

────────────────

(2-1) 중간 궁금증 트리거 규칙 (필수 1회)
- 본문 초반의 핵심 설명이 끝난 직후, 반드시 1회 삽입 (3분 기준 약 54초~72초 지점, 30~40% 구간)
- 이 문장은:
  - 새로운 정보를 제공하지 않는다
  - 결론이나 평가를 제시하지 않는다
  - 다음 내용을 직접적으로 예고하지 않는다
  - 대신 "지금까지의 이해가 충분하지 않다"는 감각만 만들어야 한다
- 단독 줄로 배치하며, 앞뒤 설명과 바로 연결하지 않는다

역할 정의:
이 문장은 흥미 유발이 아니라
시청자가 스스로 판단을 멈추게 만드는 인지적 미완성 상태를 만드는 장치다.

문장 톤 가이드 (예시 방향, 그대로 사용 금지):
- "여기까지 들으면 다 이해한 것 같죠. 그런데 아직 중요한 얘기는 나오지 않았습니다."
- "이쯤에서 고개를 끄덕이게 됩니다. 그래서 다음 얘기가 필요해집니다."
- "지금 이 설명, 맞는 말처럼 들립니다. 문제는 그 다음입니다."
- "여기서 멈추면, 이 주제는 평범해집니다."

※ 실제 대본에서는 주제 내용에 맞게 새로운 문장을 직접 생성할 것
※ 동일 문구 반복 사용 금지

────────────────

(3) 앵커 문장 규칙 (참고용 - 필수 아님)
- **중요: 아래 문장들은 예시일 뿐이며, 반드시 사용할 필요가 없습니다.**
- 주제 내용과 흐름에 자연스럽게 맞을 때만 선택적으로 사용하세요.
- 모든 문장을 다 사용하거나, 특정 문장을 반드시 포함시킬 필요는 전혀 없습니다.
- 가능한 문장 유형 (참고용 예시):
  - "여기서 핵심은 이겁니다."
  - "이걸 한 문장으로 정리하면"
  - "이 지점에서 이해가 달라집니다."
  - "솔직히, 여기서 마음이 갈립니다."
  - "여기서 많은 사람이 멈칫합니다."
- **금지: "이 부분을 놓치면 이해가 달라집니다" / "이 부분을 놓치면 해석이 달라집니다" 같은 문구는 사용하지 말 것 (너무 자주 사용되어 복불처럼 들림)**
- ※ 주제 내용에 맞는 자연스러운 전환 문구를 직접 만들어 사용하는 것을 권장합니다
- ※ 동일 문장 중복 사용 금지

────────────────

(4) 관점 포함 규칙 (참고용 - 필수 아님)
- **중요: 아래 관점들은 참고용이며, 반드시 사용할 필요가 없습니다.**
- 주제 내용에 자연스럽게 맞을 때만 선택적으로 사용하세요.
- 가능한 관점 유형 (참고용):
  ① 개인 관점 (개인의 선택·심리·판단)
  ② 구조 관점 (제도·시스템·환경)
  ③ 시간 관점 (누적·지연·타이밍)
- ※ 어떤 관점을 썼다면 드러나게 표현할 것. 하지만 강제로 포함시킬 필요는 없음.

────────────────

(5) 비유/은유 규칙 (선택적 활용)
- 본문 중간에 설명이 필요할 때만 비유 사용 (필수 아님)
- 설명을 돕는 용도만 허용
- 감정 과잉, 문학적 표현 금지
- 1~2문장 이내
- 비유가 자연스럽지 않으면 사용하지 않아도 됨

3. 긴장 유지 문장 (의식적 멈춤 구간 - 참고용, 필수 아님)
- **중요: 아래 문장들은 예시일 뿐이며, 반드시 사용할 필요가 없습니다.**
- 본문 흐름상 자연스럽게 필요할 때만 선택적으로 사용하세요.
- 앞뒤 문단과 리듬 차이를 만들 때 활용 (단독 줄 권장)
- 가능한 문장 유형 (참고용 예시):
  - "이 주제는 여기서부터 다르게 봐야 합니다."
  - "이 부분이 앞으로 더 중요해질 수 있습니다."
- **금지: "그런데 여기서 대부분이 놓치는 지점이 있습니다" 같은 문구는 사용하지 말 것 (너무 자주 사용되어 복불처럼 들림)**
- ※ 주제 내용에 맞는 자연스러운 전환 문구를 직접 만들어 사용하는 것을 권장합니다
- 목적: 시청자의 사고를 잠시 멈추게 하기 (필요시에만, 자연스러울 때만)

4. 인사이트 요약 (잔상 구간)
- **중요: 본문에서 이미 설명한 사실이나 내용을 단순히 반복하지 말 것**
- 본문과 구분되는 새로운 관점, 의미, 또는 앞으로의 방향을 제시해야 함
- 단순 결론 금지
- '정리'보다 방향 제시
- 이 구간은 문장 길이를 더 짧게 작성
- 설명보다 단정한 문장 사용
  - 이 구간에는 **감정 정리 1문장**을 포함한다. (예: "그래서 우리가 느끼는 궁금함은 당연한 것이고, 이해하면 더 명확해집니다." 같은 톤)

5. 마무리 (반복 인식 강화)
- 질문형으로 끝낼 것
- 이 지식이 개별 정보가 아니라 일상에서 반복되는 구조임을 암시
- 구독·좋아요는 정보 제공의 수단으로 자연스럽게 연결
- 구독·좋아요 문장이 영상의 마지막 문장
- 이후 어떤 멘트도 추가하지 말 것
────────────────
[출력 요구사항]
- 유튜브 영상 제목:
  * 30~40자 이내
  * 정보 나열 금지 (기사 제목처럼 쓰지 말 것)
  * 제목이 '뉴스'처럼 보이면 구독이 멈춘다. **기사 냄새(헤드라인 톤)** 가 나면 실패다.
  * 제목은 정보가 아니라 **질문**이어야 한다.
  * 제목에는 물음표(?)를 사용하지 않는다. 문장 자체를 의문형으로 끝낸다(예: ~일까, ~왜일까, ~어쩌다 이런 일이 반복될까).
  * **제목 끝에 항상 마침표(.)를 추가할 것**
- 전체 대본 분량:
  * **최소 1700자 이상 필수** (3분 분량, 빠른 속도로 읽을 것을 고려하여 충분한 분량 확보)
  * 1700자 미만으로 작성하는 것은 절대 금지
  * 자연스러운 구어체
  * 시간·초 단위 표현 사용 금지
- 오프닝 훅:
  * 약 45~60자
  * 질문형 또는 관점 제시형
- 본문:
  * **최소 1400자 이상 필수** (전체 분량 1700자 이상을 달성하기 위해 필수)
  * 예시·비유·사례 포함 (과도하지 않게)
  * 구체적인 설명과 사례를 충분히 포함하여 분량을 확보해야 함
- 인사이트 요약:
  * 3~4문장
  * 약 75~90자
- 마무리:
  * 질문형
  * 약 60~80자
  * 구독·좋아요 문구 포함
  * 구독·좋아요 문구가 **마지막 문장**이어야 함 (이후 추가 문장 금지)

**분량 검증:**
- 대본 작성 후 반드시 전체 글자 수를 확인하세요
- 1700자 미만이면 추가 내용을 보강하여 반드시 1700자 이상으로 작성하세요
- 본문이 1400자 미만이면 구체적인 설명, 사례, 예시를 추가하여 충분한 분량을 확보하세요
────────────────

한 줄 요약: 이 프롬프트의 목표는 '이해시켰다'가 아니라 '나도 모르게 고개가 끄덕여졌다'다.

**최종 목표:**
이 프롬프트의 목적은 정보 전달 속도를 높이는 것이 아니라, 시청자가 스스로 '아직 판단하면 안 된다'고 느끼게 만드는 구조를 고정하는 것이다. 특히 30~40% 지점(3분 기준 약 54초~72초)에서 이탈하지 않고 끝까지 보도록 만드는 구조적 장치를 포함한다.
`;
    }

    // 프롬프트 저장 (참고용 및 확인용)
    const sanitizedPrompt = sanitizeGeneratedPrompt(prompt);
    setGeneratedPrompt(sanitizedPrompt);
    setKnowledgeUsedPrompt(sanitizedPrompt); // 지식 전달 대본 생성에 사용된 프롬프트 저장

    // 지식 전달 대본용 추가 지시사항을 프롬프트에 추가
    const enhancedPrompt = `${prompt}

────────────────

**최종 확인 사항 (반드시 준수):**
- 전체 대본이 반드시 1700자 이상이어야 합니다. 1700자 미만이면 절대 안 됩니다.
- 본문이 반드시 1400자 이상이어야 합니다. 1400자 미만이면 절대 안 됩니다.
- 대본을 작성한 후 반드시 글자 수를 확인하고, 부족하면 더 많은 설명, 사례, 예시를 추가하세요.
- 3분 분량(180초)을 채우기 위해서는 최소 1700자 이상이 필수입니다.
- 현재 대본이 1700자 미만이면, 본문에 더 많은 내용을 추가하여 반드시 1700자 이상으로 작성하세요.`;

    // AI API를 호출하여 실제 대본 생성
    try {
      console.log("[Knowledge Script Generation] Calling AI API to generate script...");
      console.log("[Knowledge Script Generation] Topic:", processedTopic);
      console.log("[Knowledge Script Generation] Prompt length:", enhancedPrompt.length);
      
      const response = await fetch("/api/ai/generate-script", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: enhancedPrompt }),
      });

      console.log("[Knowledge Script Generation] API Response status:", response.status);

      if (!response.ok) {
        let errorMessage = "대본 생성 중 오류가 발생했습니다.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("[Knowledge Script Generation] API Error:", errorData);
        } catch (parseError) {
          const errorText = await response.text();
          console.error("[Knowledge Script Generation] API Error (text):", errorText);
          errorMessage = `대본 생성 실패 (HTTP ${response.status}): ${errorText.substring(0, 200)}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("[Knowledge Script Generation] API Response data:", { 
        success: data.success, 
        hasScript: !!data.script,
        scriptLength: data.script?.length 
      });
      
      if (data.success && data.script) {
        console.log("[Knowledge Script Generation] ✅ Script generated successfully, length:", data.script.length);
        setKnowledgeGeneratedScript(data.script);
        setError(null); // 성공 시 에러 초기화
      } else {
        console.error("[Knowledge Script Generation] ❌ Invalid response format:", data);
        throw new Error(data.error || "대본 생성에 실패했습니다. 응답 형식이 올바르지 않습니다.");
      }
    } catch (err: any) {
      console.error("[Knowledge Script Generation] ❌ Error generating script:", err);
      const errorMessage = err.message || "대본 생성 중 오류가 발생했습니다. OpenAI API 키가 설정되어 있는지 확인해주세요.";
      setError(errorMessage);
      // 오류가 발생해도 프롬프트는 표시 (사용자가 수동으로 사용 가능)
    } finally {
      setCopied(false);
      setIsGenerating(false);
    }
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
        <h1>대본 만들기</h1>
        <p>인기 뉴스를 조회하고 선택하여 영상 대본을 생성합니다</p>
      </div>

      <section className="process-content">
        {/* 인기 뉴스 조회 섹션 */}
        <div className="news-section">
          <h2 className="section-title">📰 인기 뉴스 조회</h2>
          <p className="section-description">
            아래 "검색" 버튼을 클릭하면 인기 뉴스가 조회됩니다. 카테고리를 선택하거나 검색어를 입력하면 해당 조건에 맞는 뉴스만 조회됩니다.
          </p>

          <div className="news-search-form">
            <div className="category-selector">
              <label className="category-label">
                카테고리 선택 (복수 선택 가능):
              </label>
              <div className="category-buttons">
                <button
                  type="button"
                  className={`category-button select-all-button ${selectedCategories.length === POPULAR_KEYWORDS.length ? "active" : ""}`}
                  onClick={() => {
                    if (selectedCategories.length === POPULAR_KEYWORDS.length) {
                      setSelectedCategories([]);
                    } else {
                      setSelectedCategories([...POPULAR_KEYWORDS]);
                    }
                  }}
                >
                  {selectedCategories.length === POPULAR_KEYWORDS.length ? "전체 해제" : "전체 선택"}
                </button>
                {POPULAR_KEYWORDS.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`category-button ${selectedCategories.includes(category) ? "active" : ""}`}
                    onClick={() => handleCategoryToggle(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleSearch}>
              <div className="search-input-group">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="뉴스 검색어를 입력하세요 (쉼표로 구분 시 AND 검색, 예: AI, 코딩, 기술)"
                  className="news-search-input"
                />
                <button type="submit" className="news-search-button" disabled={isLoading}>
                  {isLoading ? "검색 중..." : "검색"}
                </button>
              </div>
              <div className="news-options">
                <div className="news-option-group">
                  <div className="news-option-title">정렬 방식(랭킹)</div>
                  <div className="news-option-desc">
                    같은 후보 기사들을 어떤 순서로 보여줄지 결정합니다.
                  </div>
                  <label className="news-option">
                    <input
                      type="checkbox"
                      checked={useInterestRerank}
                      onChange={(e) => setUseInterestRerank(e.target.checked)}
                    />
                    흥미도 우선 정렬
                  </label>
                </div>

                <div className="news-option-group">
                  <div className="news-option-title">큐레이션(콘텐츠 모드)</div>
                  <div className="news-option-desc">
                    어떤 “종류”의 기사를 더 우선으로 모아볼지 선택합니다.
                  </div>
                  <label className="news-option">
                    콘텐츠 모드
                    <select
                      className="news-mode-select"
                      value={contentMode}
                      onChange={(e) => setContentMode(e.target.value as ContentMode)}
                    >
                      {(Object.keys(CONTENT_MODE_LABELS) as ContentMode[]).map((m) => (
                        <option key={m} value={m}>
                          {CONTENT_MODE_LABELS[m]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </form>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          {isLoading && (
            <div className="loading">
              <p>뉴스를 검색하는 중...</p>
            </div>
          )}

          {!isLoading && Object.keys(newsByCategory).length > 0 && (
            <div className="news-results">
              {selectedNews.length > 0 && (
                <div className="selected-news-banner">
                  <div className="selected-news-info">
                    <span className="selected-count">뉴스 선택됨</span>
                  </div>
                </div>
              )}

              {Object.keys(newsByCategory).length > 1 && (
                <div className="category-tabs">
                  {Object.keys(newsByCategory).map((category) => (
                    <button
                      key={category}
                      type="button"
                      className={`category-tab ${activeTab === category ? "active" : ""}`}
                      onClick={() => setActiveTab(category)}
                    >
                      {category} ({newsByCategory[category].length})
                    </button>
                  ))}
                </div>
              )}

              {activeTab && newsByCategory[activeTab] && (
                <div className="news-tab-content">
                  <div className="news-results-header">
                    <h3>
                      {activeTab === "검색 결과"
                        ? `"${query}" 검색 결과`
                        : `${activeTab} 카테고리 뉴스`} ({newsByCategory[activeTab].length}개)
                    </h3>
                  </div>
                  <div className="news-list">
                    {newsByCategory[activeTab].map((item, index) => {
                      const isSelected = isNewsSelected(item);
                      return (
                        <div
                          key={index}
                          className={`news-card ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleNewsSelection(item)}
                        >
                          <div className="news-card-header">
                            <div className="news-checkbox-wrapper">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleNewsSelection(item)}
                                onClick={(e) => e.stopPropagation()}
                                className="news-checkbox"
                              />
                            </div>
                            <div className="news-title-wrapper">
                              <h4 className="news-title">{item.title}</h4>
                            </div>
                          </div>
                          <p className="news-description">{item.description}</p>
                          <div className="news-meta">
                            <span className="news-date">{formatDate(item.pubDate)}</span>
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="news-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              원문 보기 →
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isLoading && Object.keys(newsByCategory).length === 0 && !error && (
            <div className="no-results">
              <p>뉴스를 조회해주세요. 위의 "인기 뉴스 조회" 버튼을 클릭하거나 검색어를 입력하여 검색하세요.</p>
            </div>
          )}
        </div>

        {/* 대본 생성 섹션 */}
        {selectedNews.length > 0 && (
          <div className="prompt-section">
            <div className="selected-news-section">
              <div className="form-section-title">
                선택한 뉴스
                <button
                  onClick={handleResetSelection}
                  className="reset-selection-button"
                  title="선택 초기화"
                >
                  🔄 새로고침
                </button>
              </div>
              <div className="selected-news-list">
                {selectedNews.slice(0, 1).map((news, index) => (
                  <div key={index} className="selected-news-card">
                    <div className="selected-news-header">
                      <h4 className="selected-news-title">{news.title}</h4>
                      <a
                        href={news.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        원문 보기 →
                      </a>
                    </div>
                    <p className="selected-news-description">{news.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="button-group">
              <button
                onClick={handleGenerateScript}
                className="primary-button"
                disabled={isGenerating}
              >
                {isGenerating ? "대본 생성 중..." : "기사 해석 대본 생성"}
              </button>
            </div>

            {generatedScript && selectedNews.length > 0 && (
              <div className="prompt-result">
                <div className="result-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>생성된 대본</h3>
                    <span className="version-badge" style={{ fontSize: '0.85em', color: '#666' }}>
                      (템플릿 버전: v{newsScriptVersion})
                    </span>
                    <span className="version-badge" style={{ fontSize: '0.85em', color: contentSource === 'full_article' ? '#28a745' : '#ffc107' }}>
                      {contentSource === 'full_article' 
                        ? `✅ 전체 기사 본문 (${fullContentLength.toLocaleString()}자)`
                        : `⚠️ 요약본만 사용 (${fullContentLength.toLocaleString()}자)`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setShowUsedPrompt(!showUsedPrompt)}
                      className="copy-button"
                      style={{ fontSize: '0.9em', padding: '6px 12px' }}
                    >
                      {showUsedPrompt ? "📄 프롬프트 숨기기" : "📄 사용된 프롬프트 보기"}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(generatedScript);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (err) {
                          console.error("복사 실패:", err);
                        }
                      }}
                      className="copy-button"
                    >
                      {copied ? "✓ 복사됨" : "📋 복사"}
                    </button>
                  </div>
                </div>
                {showUsedPrompt && usedPrompt && (
                  <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                    <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9em', color: '#666' }}>
                      📋 대본 생성에 사용된 프롬프트 (전체 기사 본문 포함)
                    </div>
                    <div className="prompt-content" style={{ maxHeight: '400px', overflow: 'auto' }}>
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85em' }}>{usedPrompt}</pre>
                    </div>
                  </div>
                )}
                <div className="prompt-content">
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{generatedScript}</pre>
                </div>
              </div>
            )}
            
            {error && selectedNews.length > 0 && (
              <div className="error-message" style={{ 
                padding: '16px', 
                backgroundColor: '#fff3cd', 
                border: '1px solid #ffc107', 
                borderRadius: '4px',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>⚠️ 대본 생성 실패</h4>
                <p style={{ margin: 0, color: '#856404' }}>{error}</p>
                <p style={{ margin: '8px 0 0 0', fontSize: '0.9em', color: '#856404' }}>
                  브라우저 콘솔(F12)에서 자세한 오류 로그를 확인할 수 있습니다.
                </p>
              </div>
            )}
            
            {!generatedScript && generatedPrompt && selectedNews.length > 0 && (
              <div className="prompt-result">
                <div className="result-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>생성된 대본 프롬프트</h3>
                    <span className="version-badge" style={{ fontSize: '0.85em', color: '#666' }}>
                      (템플릿 버전: v{newsScriptVersion})
                    </span>
                    {error && (
                      <span className="version-badge" style={{ fontSize: '0.85em', color: '#ffc107' }}>
                        (대본 생성 실패 - 프롬프트만 표시)
                      </span>
                    )}
                  </div>
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
                      <li>AI가 생성한 대본을 확인하세요.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 지식 전달 대본 생성 섹션 */}
        <div className="prompt-section" style={{ marginTop: "40px" }}>
          <div className="form-section-title">
            📚 지식 전달 대본 프롬프트
            <button
              onClick={handleResetKnowledgePrompt}
              className="reset-selection-button"
              title="입력 초기화"
            >
              🔄 새로고침
            </button>
          </div>
          <p className="section-description" style={{ marginBottom: "20px" }}>
            뉴스 기사가 아닌 상식·정보 주제를 입력하면, 해당 주제에 대한 지식 전달 대본 프롬프트를 생성합니다. (예: "환율이 오르내리는 원인과 결과", "인플레이션이 우리 생활에 미치는 영향" 등)
          </p>

          <div className="input-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label htmlFor="knowledge-topic" className="form-label" style={{ margin: 0 }}>주제 입력</label>
              <button
                type="button"
                onClick={handleGetTopicSuggestions}
                disabled={isLoadingSuggestions}
                className="secondary-button"
                style={{ 
                  fontSize: "0.9rem", 
                  padding: "6px 12px",
                  minWidth: "auto"
                }}
              >
                {isLoadingSuggestions ? "추천 중..." : "🤖 AI 주제 추천"}
              </button>
            </div>
            <textarea
              id="knowledge-topic"
              value={knowledgeTopic}
              onChange={(e) => setKnowledgeTopic(e.target.value)}
              placeholder="예: 환율이 오르내리는 원인과 결과&#10;또는 여러 주제를 쉼표로 구분: 인도, 다이아몬드&#10;&#10;여러 내용을 입력할 수도 있습니다:&#10;- 관심 있는 주제&#10;- 만들고 싶은 영상의 방향&#10;- 궁금한 점 등"
              className="textarea-input"
              style={{ width: "100%", minHeight: "120px", fontSize: "1rem", lineHeight: "1.6" }}
              rows={5}
            />
            {showSuggestions && topicSuggestions.length > 0 && (
              <div style={{ 
                marginTop: "12px", 
                padding: "16px", 
                background: "#f9f9f9", 
                borderRadius: "8px",
                border: "1px solid #e0e0e0"
              }}>
                <div style={{ 
                  fontSize: "0.9rem", 
                  fontWeight: 600, 
                  color: "#333", 
                  marginBottom: "12px" 
                }}>
                  추천 주제 (클릭하여 선택):
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {topicSuggestions.map((topic, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectSuggestion(topic)}
                      style={{
                        padding: "10px 14px",
                        background: "white",
                        border: "1px solid #ddd",
                        borderRadius: "6px",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                        color: "#333",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#0066cc";
                        e.currentTarget.style.background = "#f0f7ff";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#ddd";
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSuggestions(false)}
                  style={{
                    marginTop: "12px",
                    padding: "6px 12px",
                    background: "transparent",
                    border: "none",
                    color: "#666",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  닫기
                </button>
              </div>
            )}
          </div>

          <div className="button-group">
            <button
              onClick={handleGenerateKnowledgePrompt}
              className="primary-button"
              disabled={isGenerating}
            >
              {isGenerating ? "대본 생성 중..." : "지식 전달 대본 생성"}
            </button>
          </div>

          {error && knowledgeTopic && !selectedNews.length && (
            <div className="error-message" style={{ 
              padding: '16px', 
              backgroundColor: '#fff3cd', 
              border: '1px solid #ffc107', 
              borderRadius: '4px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#856404' }}>⚠️ 대본 생성 실패</h4>
              <p style={{ margin: 0, color: '#856404' }}>{error}</p>
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9em', color: '#856404' }}>
                브라우저 콘솔(F12)에서 자세한 오류 로그를 확인할 수 있습니다.
              </p>
            </div>
          )}

          {knowledgeGeneratedScript && knowledgeTopic && !selectedNews.length && (
            <div className="prompt-result">
              <div className="result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>생성된 대본</h3>
                  <span className="version-badge" style={{ fontSize: '0.85em', color: '#666' }}>
                    (템플릿 버전: v{knowledgeScriptVersion})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowKnowledgeUsedPrompt(!showKnowledgeUsedPrompt)}
                    className="copy-button"
                    style={{ fontSize: '0.9em', padding: '6px 12px' }}
                  >
                    {showKnowledgeUsedPrompt ? "📄 프롬프트 숨기기" : "📄 사용된 프롬프트 보기"}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(knowledgeGeneratedScript);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      } catch (err) {
                        console.error("복사 실패:", err);
                      }
                    }}
                    className="copy-button"
                  >
                    {copied ? "✓ 복사됨" : "📋 복사"}
                  </button>
                </div>
              </div>
              {showKnowledgeUsedPrompt && knowledgeUsedPrompt && (
                <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px', border: '1px solid #ddd' }}>
                  <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '0.9em', color: '#666' }}>
                    📋 대본 생성에 사용된 프롬프트
                  </div>
                  <div className="prompt-content" style={{ maxHeight: '400px', overflow: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85em' }}>{knowledgeUsedPrompt}</pre>
                  </div>
                </div>
              )}
              <div className="prompt-content">
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{knowledgeGeneratedScript}</pre>
              </div>
            </div>
          )}
          
          {!knowledgeGeneratedScript && generatedPrompt && knowledgeTopic && !selectedNews.length && (
            <div className="prompt-result">
              <div className="result-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0 }}>생성된 대본 프롬프트</h3>
                  <span className="version-badge" style={{ fontSize: '0.85em', color: '#666' }}>
                    (템플릿 버전: v{knowledgeScriptVersion})
                  </span>
                  {error && (
                    <span className="version-badge" style={{ fontSize: '0.85em', color: '#ffc107' }}>
                      (대본 생성 실패 - 프롬프트만 표시)
                    </span>
                  )}
                </div>
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
                    <li>AI가 생성한 대본을 확인하세요.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
