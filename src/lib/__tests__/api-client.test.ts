import { callChatAPI, checkAPIStatus } from '../api-client';
import { UserInput } from '@/types';

// Mock fetch
global.fetch = jest.fn();

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('callChatAPI', () => {
    const mockUserInput: UserInput = {
      learningGoal: '웹 개발자가 되고 싶습니다',
      interests: 'React, Node.js',
      currentConcerns: '어떤 순서로 공부해야 할지 모르겠습니다'
    };

    it('성공적인 API 호출 시 올바른 응답을 반환해야 함', async () => {
      const mockResponse = {
        success: true,
        feedback: '테스트 피드백',
        recommendations: [
          {
            id: 'test_1',
            title: '테스트 추천',
            description: '테스트 설명',
            category: '학습자료',
            priority: 1
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await callChatAPI(mockUserInput);

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: mockUserInput }),
      });
    });

    it('API 호출 실패 시 에러 응답을 반환해야 함', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: '서버 오류' })
      });

      const result = await callChatAPI(mockUserInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('서버 오류');
      expect(result.feedback).toContain('일시적인 오류');
    });

    it('네트워크 오류 시 적절한 에러 메시지를 반환해야 함', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await callChatAPI(mockUserInput);

      expect(result.success).toBe(false);
      expect(result.feedback).toContain('네트워크 연결');
    });

    it('타임아웃 오류 시 적절한 에러 메시지를 반환해야 함', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      (fetch as jest.Mock).mockRejectedValueOnce(abortError);

      const result = await callChatAPI(mockUserInput);

      expect(result.success).toBe(false);
      expect(result.feedback).toContain('시간이 초과');
    });
  });

  describe('checkAPIStatus', () => {
    it('API 상태 확인 성공 시 올바른 응답을 반환해야 함', async () => {
      const mockStatus = {
        status: 'ok',
        apiKeyConfigured: true
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      });

      const result = await checkAPIStatus();

      expect(result).toEqual(mockStatus);
    });

    it('API 상태 확인 실패 시 에러 상태를 반환해야 함', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const result = await checkAPIStatus();

      expect(result.status).toBe('error');
      expect(result.apiKeyConfigured).toBe(false);
    });
  });
});