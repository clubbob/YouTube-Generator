# YouTube API 키 403 에러 해결 가이드

## 에러 분석

현재 에러:
```
API_KEY_SERVICE_BLOCKED
PERMISSION_DENIED
youtube.api.v3.V3DataSearchService.List are blocked
```

이것은 **API 키가 YouTube Data API v3에 대해 차단되었거나 활성화되지 않았다**는 의미입니다.

## 해결 방법 (단계별)

### 1단계: YouTube Data API v3 활성화 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택: **generator-c4ee1** (또는 현재 사용 중인 프로젝트)
3. **API 및 서비스** > **사용 설정된 API 및 서비스** 메뉴로 이동
4. "YouTube Data API v3" 검색
5. **활성화됨** 상태인지 확인
   - ❌ 활성화되지 않았다면 → **"사용 설정"** 버튼 클릭
   - ✅ 활성화되어 있다면 → 다음 단계로

### 2단계: API 키 제한 사항 확인

1. **API 및 서비스** > **사용자 인증 정보** 메뉴로 이동
2. 사용 중인 API 키 클릭 (또는 새로 생성)
3. **API 키 제한사항** 섹션 확인:

   **문제가 될 수 있는 설정:**
   - ❌ **애플리케이션 제한사항**이 설정되어 있고, 현재 도메인/IP가 포함되지 않음
   - ❌ **API 제한사항**에서 YouTube Data API v3가 선택되지 않음

   **해결 방법:**
   - **애플리케이션 제한사항**: 
     - 개발 단계에서는 **"없음"** 선택 (모든 IP/도메인 허용)
     - 또는 **"IP 주소"** 선택 후 `0.0.0.0/0` 추가 (모든 IP 허용 - 개발용)
   - **API 제한사항**:
     - **"키 제한"** 선택
     - **"YouTube Data API v3"** 체크박스 선택
     - 또는 **"제한 없음"** 선택 (모든 API 허용 - 개발용)

### 3단계: 새 API 키 생성 (권장)

기존 키에 문제가 있다면 새로 생성:

1. **API 및 서비스** > **사용자 인증 정보**
2. **+ 사용자 인증 정보 만들기** > **API 키**
3. 생성된 키 복사
4. **API 키 제한사항** 설정:
   - **애플리케이션 제한사항**: **없음** (개발 단계)
   - **API 제한사항**: **YouTube Data API v3** 선택
5. `.env.local` 파일의 `YOUTUBE_API_KEY` 값 업데이트
6. 서버 재시작: `npm run dev`

### 4단계: 프로젝트 결제 계정 확인

YouTube Data API v3는 무료이지만, Google Cloud 프로젝트에 결제 계정이 연결되어 있어야 할 수 있습니다:

1. **결제** 메뉴로 이동
2. 결제 계정이 연결되어 있는지 확인
3. 없으면 연결 (무료 크레딧 사용 가능)

## 빠른 체크리스트

- [ ] YouTube Data API v3가 활성화되어 있음
- [ ] API 키의 "API 제한사항"에 YouTube Data API v3가 포함됨
- [ ] API 키의 "애플리케이션 제한사항"이 적절히 설정됨 (개발 단계에서는 "없음")
- [ ] `.env.local` 파일의 API 키가 올바름
- [ ] 서버가 재시작되어 새로운 환경 변수를 로드함

## 테스트

수정 후 다시 테스트:
```
http://localhost:[포트번호]/api/youtube/ping
```

성공 응답:
```json
{
  "ok": true,
  "status": 200,
  "data": {
    "items": [...]
  }
}
```

## 참고

- API 키는 즉시 적용됩니다 (서버 재시작 필요)
- Google Cloud Console 변경사항은 몇 분 정도 걸릴 수 있습니다
- 문제가 계속되면 새 API 키를 생성하는 것이 가장 빠른 해결책입니다
