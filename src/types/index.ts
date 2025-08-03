// 사용자 입력 데이터 타입 정의
export interface UserInput {
  learningGoal: string;
  interests: string;
  currentConcerns: string;
}

// 폼 유효성 검사 에러 타입
export interface FormErrors {
  learningGoal?: string;
  interests?: string;
  currentConcerns?: string;
}

// API 응답 타입
export interface AIResponse {
  feedback: string;
  recommendations: Recommendation[];
  success: boolean;
  error?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: number;
  url?: string;
}

// API 요청 타입
export interface ChatRequest {
  userInput: UserInput;
}

// API 에러 타입
export interface APIError {
  message: string;
  code?: string;
  details?: unknown;
}

// 채팅 메시지 타입
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

// 채팅 세션 타입
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}