# YouTube API 할당량 관리 가이드

## 할당량 초과 문제 해결

### 1. 할당량 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **API 및 서비스** > **할당량** 메뉴로 이동
4. "YouTube Data API v3" 검색
5. 현재 사용량 및 한도 확인

### 2. 할당량 사용량

현재 코드에서 한 번의 검색에 사용되는 할당량:
- `search.list`: **100 units**
- `videos.list`: **1 unit per video** (최대 50개 = 50 units)
- `channels.list`: **1 unit per channel** (최대 50개 = 50 units)
- **총 최대: 약 200 units per search**

기본 할당량: **10,000 units/day**
- 하루에 약 **50번의 검색** 가능

### 3. 할당량 증가 요청

1. Google Cloud Console에서 **할당량** 페이지로 이동
2. "YouTube Data API v3" 선택
3. **할당량 편집** 클릭
4. 할당량 증가 요청 제출
   - 일반적으로 24-48시간 내 승인
   - 무료 티어에서도 증가 가능 (제한적)

### 4. 할당량 절약 방법

#### 방법 1: 검색 결과 수 줄이기
- 현재: `maxResults: 50` (기본값 100에서 변경됨)
- 더 줄이려면: `maxResults: 25` 또는 `30`

#### 방법 2: 캐시 활용
- 동일한 검색은 캐시에서 로드 (할당량 사용 안 함)
- 캐시 시간: 6시간 (기본값)
- 더 길게 설정하려면 `lib/cache.ts`의 `getExpiresAt()` 함수 수정

#### 방법 3: 검색 빈도 줄이기
- 테스트 시 동일한 키워드 재사용
- 캐시된 결과 활용

### 5. 할당량 모니터링

Google Cloud Console에서 실시간으로 할당량 사용량을 확인할 수 있습니다:
- **API 및 서비스** > **대시보드**
- "YouTube Data API v3" 선택
- 사용량 그래프 확인

### 6. 임시 해결책

할당량이 초과된 경우:
1. **다음 날까지 대기** (할당량은 매일 자정(태평양 표준시)에 리셋)
2. **새로운 Google Cloud 프로젝트 생성** (새 API 키 발급)
3. **할당량 증가 요청** (가장 권장)

### 7. 코드 최적화

현재 코드는 이미 최적화되어 있습니다:
- ✅ 배치 처리 (채널 정보 50개씩)
- ✅ 캐시 활용
- ✅ 불필요한 API 호출 최소화

추가 최적화가 필요하면:
- `maxResults`를 더 줄이기
- 캐시 시간 늘리기 (6시간 → 12시간 또는 24시간)

## 할당량 리셋 시간

YouTube API 할당량은 **매일 자정(태평양 표준시, PST/PDT)**에 리셋됩니다.
- 한국 시간 기준: **오후 5시 또는 6시** (일광절약시간에 따라 다름)

## 참고 자료

- [YouTube Data API 할당량 문서](https://developers.google.com/youtube/v3/getting-started#quota)
- [Google Cloud 할당량 관리](https://cloud.google.com/apis/docs/capping-api-usage)
