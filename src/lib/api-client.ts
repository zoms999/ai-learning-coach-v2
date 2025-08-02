import { UserInput, AIResponse, ChatRequest } from '@/types';

// API 클라이언트 설정
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com' 
  : '';

const DEFAULT_TIMEOUT = 30000; // 30초
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1초

// 지연 함수
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 타임아웃을 포함한 fetch 함수
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    }
    throw error;
  }
}

// 재시도 로직을 포함한 API 호출 함수
async function apiCallWithRetry<T>(
  apiCall: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (retries > 0) {
      console.warn(`API 호출 실패, ${retries}번 재시도 남음:`, error);
      await delay(RETRY_DELAY);
      return apiCallWithRetry(apiCall, retries - 1);
    }
    throw error;
  }
}

// AI 채팅 API 호출 함수
export async function callChatAPI(userInput: UserInput): Promise<AIResponse> {
  const apiCall = async (): Promise<AIResponse> => {
    const requestBody: ChatRequest = { userInput };

    const response = await fetchWithTimeout(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || 
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data: AIResponse = await response.json();
    
    // 응답 데이터 검증
    if (!data.feedback) {
      throw new Error('서버 응답이 올바르지 않습니다.');
    }

    return data;
  };

  try {
    return await apiCallWithRetry(apiCall);
  } catch (error) {
    console.error('Chat API 호출 오류:', error);
    
    // 사용자 친화적 에러 메시지 반환
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    
    return {
      success: false,
      error: errorMessage,
      feedback: getErrorFeedback(errorMessage),
      recommendations: getErrorRecommendations()
    };
  }
}

// 에러 상황별 피드백 메시지
function getErrorFeedback(errorMessage: string): string {
  if (errorMessage.includes('시간이 초과')) {
    return '요청 처리 시간이 초과되었습니다. 네트워크 상태를 확인하고 다시 시도해주세요.';
  }
  
  if (errorMessage.includes('네트워크') || errorMessage.includes('fetch')) {
    return '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
  }
  
  if (errorMessage.includes('API 키')) {
    return '서비스 설정에 문제가 있습니다. 관리자에게 문의해주세요.';
  }
  
  return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

// 에러 상황에서 제공할 기본 추천사항
function getErrorRecommendations() {
  return [
    {
      id: 'error_rec_1',
      title: '잠시 후 다시 시도',
      description: '일시적인 서버 오류일 수 있습니다. 1-2분 후 다시 시도해보세요.',
      category: '문제해결',
      priority: 1
    },
    {
      id: 'error_rec_2',
      title: '네트워크 연결 확인',
      description: '인터넷 연결 상태를 확인하고 안정적인 네트워크에서 다시 시도해보세요.',
      category: '문제해결',
      priority: 2
    },
    {
      id: 'error_rec_3',
      title: '브라우저 새로고침',
      description: '페이지를 새로고침하거나 브라우저를 다시 시작해보세요.',
      category: '문제해결',
      priority: 3
    }
  ];
}

// API 상태 확인 함수
export async function checkAPIStatus(): Promise<{ status: string; apiKeyConfigured: boolean }> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/chat`, {
      method: 'GET',
    }, 5000);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 상태 확인 오류:', error);
    return { 
      status: 'error', 
      apiKeyConfigured: false 
    };
  }
}