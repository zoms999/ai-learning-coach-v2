# 🚀 AI 학습 코치 배포 가이드

## 📋 목차
1. [배포 준비](#배포-준비)
2. [환경 변수 설정](#환경-변수-설정)
3. [Vercel 배포](#vercel-배포)
4. [성능 최적화](#성능-최적화)
5. [모니터링 설정](#모니터링-설정)
6. [문제 해결](#문제-해결)

---

## 🛠️ 배포 준비

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- Vercel 계정
- Google AI Studio API 키

### 프로덕션 빌드 테스트
```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 로컬에서 프로덕션 버전 테스트
npm start
```

---

## ⚙️ 환경 변수 설정

### 필수 환경 변수

#### 1. Gemini API 설정
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**설정 방법:**
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. 새 API 키 생성
3. 키를 안전하게 보관

#### 2. EmailJS 설정 (이메일 기능 사용 시)
```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_ai_coach
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_learning_report
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key_here
```

**설정 방법:**
1. [EmailJS](https://www.emailjs.com/) 계정 생성
2. 이메일 서비스 연결 (Gmail, Outlook 등)
3. 템플릿 생성
4. Public Key 발급

### 선택적 환경 변수

#### 3. 애플리케이션 설정
```env
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_NAME=AI 학습 코치
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
```

#### 4. 기능 활성화/비활성화
```env
NEXT_PUBLIC_ENABLE_FEEDBACK=true
NEXT_PUBLIC_ENABLE_PDF_EXPORT=true
NEXT_PUBLIC_ENABLE_EMAIL_EXPORT=true
NEXT_PUBLIC_ENABLE_DARK_MODE=true
```

#### 5. 성능 및 제한 설정
```env
RATE_LIMIT_PER_MINUTE=30
PDF_GENERATION_TIMEOUT=30000
MAX_CONVERSATIONS_PER_USER=50
```

---

## 🌐 Vercel 배포

### 방법 1: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 디렉토리에서 배포
cd ai-learning-coach
vercel

# 프로덕션 배포
vercel --prod
```

### 방법 2: GitHub 연동

1. **GitHub 리포지토리 생성**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Learning Coach"
   git remote add origin https://github.com/your-username/ai-learning-coach.git
   git push -u origin main
   ```

2. **Vercel에서 프로젝트 가져오기**
   - [Vercel Dashboard](https://vercel.com/dashboard) 접속
   - "New Project" 클릭
   - GitHub 리포지토리 선택
   - 자동 배포 설정

### 환경 변수 설정 (Vercel)

1. Vercel 대시보드에서 프로젝트 선택
2. Settings → Environment Variables
3. 필수 환경 변수 추가:
   ```
   GEMINI_API_KEY = your_api_key
   NEXT_PUBLIC_EMAILJS_SERVICE_ID = your_service_id
   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID = your_template_id
   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY = your_public_key
   ```

### 도메인 설정

1. Vercel 대시보드에서 Domains 탭
2. 커스텀 도메인 추가 (선택사항)
3. DNS 설정 업데이트

---

## ⚡ 성능 최적화

### 1. Build 최적화 설정

**next.config.ts 추가 설정:**
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 번들 분석
  experimental: {
    bundlePagesRouterDependencies: true,
  },
  
  // 압축 설정
  compress: true,
  
  // 성능 향상
  swcMinify: true,
  
  // PWA 설정 (향후)
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  // },
};

export default nextConfig;
```

### 2. 번들 크기 분석
```bash
# 번들 분석기 설치
npm install --save-dev @next/bundle-analyzer

# 번들 분석 실행
ANALYZE=true npm run build
```

### 3. 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP/AVIF 형식 활용
- 적절한 크기 및 품질 설정

### 4. 캐싱 전략
```typescript
// API 응답 캐싱
export const revalidate = 3600; // 1시간

// 정적 생성 최적화
export const dynamic = 'force-static';
```

---

## 📊 모니터링 설정

### 1. Vercel Analytics
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx에 추가
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### 2. 에러 모니터링 (Sentry)
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### 3. 성능 모니터링
```typescript
// 커스텀 성능 메트릭
export function reportWebVitals(metric) {
  console.log(metric);
  // Analytics 서비스로 전송
}
```

---

## 🔧 문제 해결

### 빌드 오류

#### 1. TypeScript 오류
```bash
# 타입 체크
npm run type-check

# 타입 오류 무시 (임시)
# next.config.ts에 추가
typescript: {
  ignoreBuildErrors: true,
}
```

#### 2. ESLint 오류
```bash
# ESLint 검사
npm run lint

# 자동 수정
npm run lint -- --fix
```

#### 3. 메모리 부족
```bash
# Node.js 메모리 제한 증가
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 런타임 오류

#### 1. API 키 설정 확인
```typescript
// 환경 변수 검증
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY is required');
}
```

#### 2. CORS 문제
```typescript
// API 라우트에서 CORS 헤더 설정
export async function GET() {
  return new Response(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
    },
  });
}
```

#### 3. 클라이언트/서버 불일치
```typescript
// 하이드레이션 오류 방지
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./Component'), {
  ssr: false,
});
```

### 성능 문제

#### 1. 느린 로딩
- 이미지 최적화 확인
- 번들 크기 분석
- 코드 분할 적용

#### 2. 메모리 누수
- useEffect 정리 함수 확인
- 이벤트 리스너 제거
- 타이머 정리

---

## 📋 배포 체크리스트

### 배포 전 확인사항
- [ ] 모든 환경 변수 설정 완료
- [ ] 프로덕션 빌드 성공
- [ ] 타입 체크 통과
- [ ] ESLint 검사 통과
- [ ] 주요 기능 테스트 완료
- [ ] 모바일 반응형 확인
- [ ] 다크 모드 동작 확인

### 배포 후 확인사항
- [ ] 웹사이트 정상 접속
- [ ] AI 채팅 기능 동작
- [ ] PDF 다운로드 기능
- [ ] 이메일 전송 기능
- [ ] 대화 저장/불러오기
- [ ] 피드백 시스템
- [ ] 에러 페이지 확인
- [ ] 성능 메트릭 확인

### 보안 확인사항
- [ ] API 키 노출 방지
- [ ] HTTPS 적용
- [ ] 보안 헤더 설정
- [ ] 입력 값 검증
- [ ] 레이트 리미팅 적용

---

## 🚨 긴급 대응

### 서비스 장애 시
1. Vercel 대시보드에서 로그 확인
2. 이전 버전으로 롤백
3. 에러 원인 파악 및 수정
4. 핫픽스 배포

### 롤백 방법
```bash
# Vercel CLI로 이전 배포로 롤백
vercel --prod --rollback
```

---

## 📞 지원 및 문의

- **기술 문의**: dev@ai-learning-coach.com
- **버그 신고**: GitHub Issues
- **긴급 상황**: Slack #emergency 채널

---

## 📈 다음 단계

### 확장 계획
1. **데이터베이스 도입** (PostgreSQL + Prisma)
2. **사용자 인증** (NextAuth.js)
3. **실시간 채팅** (WebSocket)
4. **모바일 앱** (React Native)
5. **다국어 지원** (i18n)

### 성능 개선
1. **CDN 활용**
2. **이미지 최적화**
3. **코드 분할 확장**
4. **서버리스 함수 최적화**
5. **캐싱 전략 고도화**

---

*배포 가이드 v1.0 - 최종 업데이트: 2024년 1월* 