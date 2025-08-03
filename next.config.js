/** @type {import('next').NextConfig} */
const nextConfig = {
  // 개발 모드에서 trace 파일 생성 비활성화
  experimental: {
    // trace 관련 설정 비활성화
  },
  // 이미지 최적화 설정
  images: {
    domains: [],
  },
  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig