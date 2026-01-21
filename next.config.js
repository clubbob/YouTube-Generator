/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Windows 환경에서 `.next/trace` 파일 잠금(EPERM) 이슈를 회피하기 위해
  // 빌드 산출물 디렉터리를 변경합니다.
  distDir: "next-build",
  eslint: {
    // 기존 코드에 ESLint 위반이 많아 빌드가 막히는 것을 방지합니다.
    // (개발 중에는 `npm run lint`로 별도 확인 권장)
    ignoreDuringBuilds: true,
  },
  env: {
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  },
}

module.exports = nextConfig
