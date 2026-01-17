# Firebase 설정 가이드 - 채널 컨셉 저장 기능

채널 컨셉 저장 기능을 사용하려면 Firebase 프로젝트를 설정해야 합니다.

## 1단계: Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 이름 입력 (예: `youtube-generator`)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

## 2단계: Firestore 데이터베이스 활성화

1. Firebase 콘솔에서 **Firestore Database** 선택
2. **데이터베이스 만들기** 클릭
3. **테스트 모드로 시작** 선택 (개발 단계)
   - 프로덕션 환경에서는 보안 규칙을 설정해야 합니다
4. 위치 선택 (가장 가까운 리전, 예: `asia-northeast3` (서울))
5. **사용 설정** 클릭

## 3단계: Firebase Admin SDK 서비스 계정 키 발급

1. Firebase 콘솔에서 **프로젝트 설정** (톱니바퀴 아이콘) 클릭
2. **서비스 계정** 탭으로 이동
3. **새 비공개 키 만들기** 클릭
4. JSON 파일이 다운로드됨 (예: `youtube-generator-xxxxx-firebase-adminsdk-xxxxx.json`)
   - ⚠️ 이 파일을 안전하게 보관하세요 (Git에 커밋하지 마세요!)

## 4단계: 환경 변수 설정

프로젝트 루트의 `.env.local` 파일에 다음 변수를 추가하세요:

```env
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
- 여러 줄로 구성된 private key는 `\n`으로 줄바꿈을 표현해야 합니다

### 예시:

```env
FIREBASE_ADMIN_PROJECT_ID=youtube-generator-12345
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-abcde@youtube-generator-12345.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## 5단계: 개발 서버 재시작

환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다:

```bash
# 서버 중지 (Ctrl+C)
# 서버 재시작
npm run dev
```

## 6단계: 설정 확인

브라우저에서 [http://localhost:3000/api/health](http://localhost:3000/api/health)에 접속하여 Firebase 설정이 올바른지 확인하세요.

다음 항목이 모두 "설정됨"으로 표시되어야 합니다:
- Firebase Project ID
- Firebase Email
- Firebase Private Key

## Firestore 컬렉션 구조

채널 컨셉이 다음 구조로 저장됩니다:

```
channel_concepts (컬렉션)
  └── local (문서) - 현재는 "local" 사용
      └── items (서브컬렉션)
          └── {conceptId} (문서)
              ├── channelNames: string[]
              ├── slogan: string
              ├── targetAudience: string
              ├── contentCategories: string[]
              ├── videoStructure: string
              ├── toneAndCharacter: string
              ├── differentiation: string
              ├── expansion: string
              ├── createdAt: string (ISO 8601)
              └── updatedAt: string (ISO 8601)
```

## 문제 해결

### Firebase 연결 오류

1. `.env.local` 파일의 값이 정확한지 확인하세요
2. `FIREBASE_ADMIN_PRIVATE_KEY`의 `\n` 문자가 제대로 포함되어 있는지 확인하세요
3. Firebase 프로젝트에서 Firestore가 활성화되어 있는지 확인하세요
4. 개발 서버를 재시작했는지 확인하세요

### 저장 실패 오류

1. Firestore 데이터베이스가 생성되어 있는지 확인하세요
2. 브라우저 콘솔에서 오류 메시지를 확인하세요
3. `/api/health` 엔드포인트에서 Firebase 설정 상태를 확인하세요

## 보안 주의사항

- ⚠️ `.env.local` 파일은 절대 Git에 커밋하지 마세요 (이미 `.gitignore`에 포함되어 있음)
- ⚠️ 서비스 계정 JSON 파일을 안전하게 보관하세요
- ⚠️ 프로덕션 환경에서는 Firestore 보안 규칙을 설정해야 합니다
