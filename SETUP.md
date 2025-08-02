# AI 학습 코치 설정 가이드

## 🚀 시작하기

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Gemini API 설정
GEMINI_API_KEY=your_gemini_api_key_here

# EmailJS 설정 (선택사항)
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_ai_coach
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_learning_report
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key_here

# 개발용 설정
NODE_ENV=development
```

### 2. Gemini API 키 발급 받기

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. Google 계정으로 로그인
3. "Create API Key" 버튼 클릭
4. 생성된 API 키를 복사하여 `.env.local` 파일의 `GEMINI_API_KEY` 값으로 설정

### 3. EmailJS 설정하기 (선택사항)

이메일 전송 기능을 사용하려면 EmailJS 계정을 설정해야 합니다.

#### 3.1 EmailJS 계정 생성

1. [EmailJS](https://www.emailjs.com/)에 접속
2. 무료 계정을 생성합니다 (월 200회 무료)
3. 이메일 인증을 완료합니다

#### 3.2 이메일 서비스 연결

1. EmailJS 대시보드에서 "Email Services" 탭으로 이동
2. "Add New Service" 클릭
3. Gmail, Outlook, 또는 기타 이메일 서비스 선택
4. 이메일 계정 연결 및 인증 완료
5. **Service ID**를 복사하여 `NEXT_PUBLIC_EMAILJS_SERVICE_ID`에 설정

#### 3.3 이메일 템플릿 생성

1. EmailJS 대시보드에서 "Email Templates" 탭으로 이동
2. "Create New Template" 클릭
3. 다음 템플릿을 사용하세요:

```html
안녕하세요 {{to_name}}님,

{{from_name}}가 보내드리는 {{subject}}입니다.

{{message}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{{report_content}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이 보고서가 학습에 도움이 되길 바랍니다.
추가 질문이 있으시면 언제든지 AI 학습 코치를 다시 이용해 주세요!

감사합니다.
```

4. 템플릿을 저장하고 **Template ID**를 복사하여 `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`에 설정

#### 3.4 Public Key 설정

1. EmailJS 대시보드에서 "Account" 탭으로 이동
2. "Public Key" 섹션에서 키를 확인
3. 키를 복사하여 `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY`에 설정

#### 3.5 템플릿 변수 설정

EmailJS 템플릿에서 다음 변수들이 사용됩니다:

- `{{to_email}}` - 받는 사람 이메일
- `{{to_name}}` - 받는 사람 이름
- `{{from_name}}` - 보내는 사람 이름
- `{{subject}}` - 이메일 제목
- `{{message}}` - 사용자 메시지
- `{{report_content}}` - 상담 보고서 전체 내용
- `{{user_goal}}` - 사용자 학습 목표
- `{{user_interests}}` - 관심 분야
- `{{message_count}}` - 메시지 개수
- `{{recommendation_count}}` - 추천사항 개수
- `{{high_priority_count}}` - 높은 우선순위 추천사항 개수

### 4. 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)으로 접속하여 애플리케이션을 확인하세요.

## 🛠️ 기능별 설정

### PDF 생성 기능

PDF 생성 기능은 Puppeteer를 사용하여 서버사이드에서 동작합니다. 추가 설정이 필요하지 않습니다.

**주의사항:**
- 첫 번째 PDF 생성 시 Chrome 다운로드로 인해 시간이 오래 걸릴 수 있습니다
- 메모리 사용량이 높을 수 있으므로 서버 리소스를 확인하세요

### 이메일 전송 기능

이메일 전송 기능은 EmailJS 서비스를 통해 클라이언트 사이드에서 동작합니다.

**제한사항:**
- 무료 계정: 월 200회 전송 제한
- 이메일 크기: 최대 50KB (긴 대화의 경우 제한될 수 있음)
- 첨부파일: 지원되지 않음 (텍스트 형태로만 전송)

### 로컬 스토리지

대화 기록은 브라우저의 로컬 스토리지에 저장됩니다.

**주의사항:**
- 브라우저 데이터 삭제 시 기록이 사라집니다
- 다른 브라우저나 기기에서는 기록이 공유되지 않습니다
- 약 5-10MB의 스토리지 용량이 사용됩니다

## 🔧 문제 해결

### Gemini API 오류

- API 키가 올바른지 확인하세요
- API 할당량을 확인하세요
- 네트워크 연결을 확인하세요

### EmailJS 오류

- Service ID, Template ID, Public Key가 올바른지 확인하세요
- 이메일 서비스 연결 상태를 확인하세요
- 브라우저 콘솔에서 에러 메시지를 확인하세요

### PDF 생성 오류

- 서버 메모리가 충분한지 확인하세요
- 방화벽이 Puppeteer를 차단하지 않는지 확인하세요
- 대화 내용이 너무 길지 않은지 확인하세요

## 📞 지원

문제가 지속되면 다음을 확인해 주세요:

1. Node.js 버전 (18.0.0 이상 권장)
2. 패키지 설치 상태: `npm install`
3. 환경 변수 설정
4. 브라우저 콘솔 에러 메시지

즐겁게 AI 학습 코치를 사용하세요! 🚀 