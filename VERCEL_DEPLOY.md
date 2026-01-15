# Vercel 배포 가이드

## 1. GitHub 저장소 생성 및 푸시

### GitHub에서 새 저장소 생성
1. GitHub에 로그인
2. "New repository" 클릭
3. 저장소 이름: `YouTube-Generator`
4. Public 또는 Private 선택
5. "Create repository" 클릭

### 로컬 저장소 연결 및 푸시
```bash
# 원격 저장소 추가 (GitHub 저장소 URL로 변경)
git remote add origin https://github.com/사용자명/YouTube-Generator.git

# 브랜치 이름을 main으로 변경
git branch -M main

# 코드 푸시
git push -u origin main
```

## 2. Vercel 배포

### Vercel 프로젝트 생성
1. https://vercel.com 접속 및 로그인
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택: `YouTube-Generator`
4. "Import" 클릭

### 프로젝트 설정
- **Framework Preset**: Next.js (자동 감지)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

### 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수들을 추가하세요:

#### YouTube API
```
YOUTUBE_API_KEY=your_youtube_api_key_here
```

#### Firebase (Public)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Firebase Admin (Server-side)
```
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY=your_private_key
```

**주의**: `FIREBASE_ADMIN_PRIVATE_KEY`는 여러 줄로 구성될 수 있습니다. Vercel에서는 줄바꿈을 `\n`으로 입력하거나 전체를 한 줄로 입력해야 합니다.

### 배포 실행
1. "Deploy" 버튼 클릭
2. 배포 완료까지 대기 (약 2-3분)
3. 배포된 URL 확인 (예: `https://youtube-generator.vercel.app`)

## 3. 배포 후 확인사항

### 환경 변수 확인
- Vercel 대시보드 → Settings → Environment Variables에서 모든 변수가 설정되었는지 확인

### API 엔드포인트 테스트
- `https://your-app.vercel.app/api/health` 접속하여 서버 상태 확인

### YouTube API 할당량 확인
- Google Cloud Console에서 YouTube Data API v3 할당량 확인
- 필요시 할당량 증가 요청

## 4. 자동 배포 설정

Vercel은 기본적으로 GitHub 저장소에 푸시할 때마다 자동으로 배포됩니다.

### 배포 브랜치 설정
- Settings → Git → Production Branch: `main`

### 프리뷰 배포
- Pull Request 생성 시 자동으로 프리뷰 배포 URL 생성

## 5. 문제 해결

### 빌드 실패
- Vercel 대시보드의 "Deployments" 탭에서 로그 확인
- 환경 변수가 모두 설정되었는지 확인

### API 오류
- 환경 변수 값이 올바른지 확인
- YouTube API 키가 활성화되어 있는지 확인
- Firebase 설정이 올바른지 확인

### 환경 변수 포맷 오류
- `FIREBASE_ADMIN_PRIVATE_KEY`는 줄바꿈을 `\n`으로 입력
- 따옴표 없이 입력
