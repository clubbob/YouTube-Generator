# 프로젝트 설정 가이드

## 1단계: 의존성 설치

터미널에서 다음 명령어를 실행하세요:

```bash
npm install
```

## 2단계: YouTube API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스** > **라이브러리**로 이동
4. "YouTube Data API v3" 검색 후 활성화
5. **사용자 인증 정보** > **사용자 인증 정보 만들기** > **API 키** 선택
6. 생성된 API 키 복사

## 2-1단계: 네이버 검색 API 키 설정 (선택사항)

**pollsday 프로젝트에서 이미 사용 중인 키를 재사용할 수 있습니다.**

pollsday 프로젝트의 `env.txt` 파일에서 다음 값들을 복사하여 사용하세요:
- `NAVER_CLIENT_ID`
- `NAVER_CLIENT_SECRET`

또는 새로 발급받으려면:

1. [네이버 개발자 센터](https://developers.naver.com/apps/#/register)에 접속
2. 애플리케이션 등록
3. 검색 API 사용 신청
4. Client ID와 Client Secret 발급

## 3단계: Firebase 프로젝트 설정

### 3-1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 이름 입력 및 생성

### 3-2. Firestore 데이터베이스 활성화

1. Firebase 콘솔에서 **Firestore Database** 선택
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택 (개발 단계)
4. 위치 선택 (가장 가까운 리전)

### 3-3. Firebase Admin SDK 서비스 계정 키 발급

1. Firebase 콘솔에서 **프로젝트 설정** (톱니바퀴 아이콘) 클릭
2. **서비스 계정** 탭으로 이동
3. **새 비공개 키 만들기** 클릭
4. JSON 파일이 다운로드됨 (이 파일을 안전하게 보관하세요)

## 4단계: 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```env
# YouTube Data API v3
YOUTUBE_API_KEY=여기에_발급받은_YouTube_API_키_입력

# 네이버 검색 API (뉴스 조회용)
# pollsday 프로젝트에서 사용 중인 키를 재사용하거나, 새로 발급받을 수 있습니다
NAVER_CLIENT_ID=여기에_네이버_Client_ID_입력
NAVER_CLIENT_SECRET=여기에_네이버_Client_Secret_입력

# Firebase Admin SDK (서비스 계정 JSON 파일에서 가져온 값)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n여기에_private_key_내용\n-----END PRIVATE KEY-----\n"
```

### Firebase Admin SDK 값 찾는 방법

다운로드한 서비스 계정 JSON 파일을 열면 다음과 같은 구조입니다:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",           // 이것이 FIREBASE_ADMIN_PROJECT_ID
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",  // 이것이 FIREBASE_ADMIN_PRIVATE_KEY
  "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",  // 이것이 FIREBASE_ADMIN_CLIENT_EMAIL
  ...
}
```

**주의사항:**
- `FIREBASE_ADMIN_PRIVATE_KEY`는 따옴표로 감싸고, `\n` 문자를 그대로 포함해야 합니다
- JSON 파일의 `private_key` 값을 복사할 때 전체를 복사하세요 (BEGIN/END 포함)

## 5단계: 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 문제 해결

### YouTube API 할당량 초과 오류

- YouTube Data API v3는 일일 할당량이 제한되어 있습니다 (기본 10,000 units)
- 검색 요청은 100 units, 비디오 조회는 1 unit입니다
- 할당량을 늘리려면 Google Cloud Console에서 할당량 증가 요청을 해야 합니다

### Firebase 연결 오류

- `.env.local` 파일의 값이 정확한지 확인하세요
- `FIREBASE_ADMIN_PRIVATE_KEY`의 `\n` 문자가 제대로 포함되어 있는지 확인하세요
- Firebase 프로젝트에서 Firestore가 활성화되어 있는지 확인하세요

### TypeScript 오류

- `npm install`이 완료되었는지 확인하세요
- IDE를 재시작해보세요

## 다음 단계

설정이 완료되면:

1. 메인 페이지에서 키워드 검색 테스트
2. 검색 결과가 Hit Score 순으로 정렬되는지 확인
3. 영상 저장 기능 테스트
4. 저장된 영상 보드에서 태그/메모 수정 테스트
