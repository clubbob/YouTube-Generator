# YouTube Generator - Trend Finder (v0.1)

유튜브 키워드를 입력하면 최근 기간 내 조회수 성장 속도가 빠른 영상을 찾아 Hit Score 기준으로 랭킹하여 보여주고, 유망 영상을 저장할 수 있는 웹 툴입니다.

## 기술 스택

- **Frontend**: Next.js 14 (App Router, TypeScript)
- **Backend**: Next.js API Routes
- **Database**: Firestore
- **External API**: YouTube Data API v3
- **Deploy**: Vercel

## 주요 기능

- ✅ 키워드 검색
- ✅ 최근 기간 필터 (7/30/90일)
- ✅ 조회수 성장 기반 랭킹 (Hit Score)
- ✅ 작은 채널 필터
- ✅ 결과 저장 (Saved Board)
- ✅ 저장된 영상 태그/메모 수정

## 시작하기

### 1. 환경 변수 설정

`.env.example` 파일을 참고하여 `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
YOUTUBE_API_KEY=your_youtube_api_key_here

NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
app/
 ├─ page.tsx              # 메인 검색 UI
 ├─ saved/page.tsx        # 저장된 영상 보드
 ├─ layout.tsx            # 루트 레이아웃
 ├─ globals.css           # 전역 스타일
 └─ api/
    ├─ youtube/search/
    │   └─ route.ts       # YouTube 검색 API
    └─ saved/
        └─ route.ts       # 저장된 영상 관리 API

lib/
 ├─ youtube.ts            # YouTube API 클라이언트
 ├─ scoring.ts            # Hit Score 계산 로직
 ├─ cache.ts              # 캐싱 유틸리티
 └─ firestore.ts          # Firestore 연동

components/
 ├─ SearchForm.tsx         # 검색 폼 컴포넌트
 ├─ VideoList.tsx         # 영상 리스트 컴포넌트
 └─ VideoCard.tsx         # 영상 카드 컴포넌트

types/
 └─ index.ts              # TypeScript 타입 정의
```

## Hit Score 계산 로직

Hit Score는 다음 공식으로 계산됩니다:

```
HitScore = freshnessWeight * (
  0.6 * normalize(viewsPerDay)
+ 0.4 * normalize(viewsToSubsRatio)
)
```

- **Freshness Weight**: 
  - 0-7일: 1.2
  - 8-30일: 1.0
  - 31-90일: 0.8

- **Views per Day**: `views / ageDays`
- **Views / Subs Ratio**: `views / max(1, subscriberCount)`

## Firestore 스키마

### search_cache
```
search_cache/{cacheId}
- query: string
- params: object
- createdAt: timestamp
- expiresAt: timestamp
- results: array
```

### saved_videos
```
saved_videos/{userId}/items/{itemId}
- videoId: string
- title: string
- channelTitle: string
- views: number
- subs: number
- viewsPerDay: number
- hitScore: number
- tags: array
- memo: string
- createdAt: timestamp
```

## API 엔드포인트

### POST /api/youtube/search
YouTube 영상 검색

**Request:**
```json
{
  "query": "ai productivity",
  "timeframeDays": 30,
  "regionCode": "US",
  "language": "en",
  "contentType": "shorts_like",
  "maxResults": 100,
  "filters": {
    "subscriberMax": 50000,
    "minViews": 10000,
    "hasShortsTag": true
  }
}
```

### GET /api/saved
저장된 영상 목록 조회

### POST /api/saved
영상 저장

### DELETE /api/saved?videoId={videoId}
영상 삭제

### PATCH /api/saved
영상 태그/메모 업데이트

## 배포

Vercel에 배포하려면:

1. GitHub 저장소에 코드를 푸시
2. Vercel에 프로젝트 연결
3. 환경 변수 설정
4. 배포 완료

## 향후 확장 계획

이 프로젝트는 다음 순서로 확장될 예정입니다:

1. **Trend Finder** (현재) ✅
2. **Script Generator** (대본 생성)
3. **Shorts Generator** (영상/쇼츠 생성)

## 라이선스

MIT
