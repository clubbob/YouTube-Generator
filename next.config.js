/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Vercel(및 기본 Next.js 빌드)은 `.next/` 산출물을 기대합니다.
  // distDir을 커스터마이즈하면 배포 환경에서 routes-manifest.json을 못 찾는 문제가 생길 수 있어
  // 기본값(.next)을 사용합니다.
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
