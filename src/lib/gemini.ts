import { GoogleGenerativeAI } from '@google/generative-ai';
import { UserInput, AIResponse, Recommendation } from '@/types';

// Gemini API 클라이언트 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// 학습 코칭에 최적화된 프롬프트 생성
export function createLearningCoachPrompt(userInput: UserInput): string {
  return `
당신은 전문적인 AI 학습 코치입니다. 사용자의 학습 목표와 현재 상황을 분석하여 맞춤형 학습 조언을 제공해주세요.

**사용자 정보:**
- 학습 목표: ${userInput.learningGoal}
- 관심 분야: ${userInput.interests}
- 현재 고민: ${userInput.currentConcerns}

**응답 형식:**
다음 JSON 형식으로 응답해주세요:

{
  "feedback": "사용자의 상황에 대한 구체적이고 개인화된 피드백 (300-500자)",
  "recommendations": [
    {
      "id": "unique_id_1",
      "title": "추천사항 제목",
      "description": "구체적인 설명과 실행 방법",
      "category": "학습자료|도구|방법론|커뮤니티|프로젝트",
      "priority": 1-5,
      "url": "관련 링크 (선택사항)"
    }
  ]
}

**지침:**
1. 피드백은 격려적이면서도 구체적이어야 합니다
2. 추천사항은 3-5개 정도로 우선순위를 매겨 제공하세요
3. 각 추천사항은 실행 가능하고 구체적이어야 합니다
4. 사용자의 현재 수준을 고려한 단계적 학습 계획을 제시하세요
5. 무료 리소스와 유료 리소스를 균형있게 추천하세요
6. 실무 경험을 쌓을 수 있는 프로젝트나 활동을 포함하세요

JSON 형식으로만 응답하고, 다른 텍스트는 포함하지 마세요.
`;
}

// Gemini API 호출 함수
export async function callGeminiAPI(userInput: UserInput): Promise<AIResponse> {
  try {
    console.log('Gemini API 호출 시작:', { userInput });
    
    // 최신 모델명 사용
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });
    
    const prompt = createLearningCoachPrompt(userInput);
    console.log('생성된 프롬프트 길이:', prompt.length);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // 응답 상태 확인
    if (!response) {
      throw new Error('Gemini API에서 응답을 받지 못했습니다.');
    }
    
    const text = response.text();
    console.log('Gemini 원본 응답:', text);

    // JSON 응답 파싱
    const parsedResponse = parseGeminiResponse(text);
    
    return {
      ...parsedResponse,
      success: true
    };

  } catch (error) {
    console.error('Gemini API 호출 상세 오류:', {
      error,
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return {
      feedback: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      recommendations: getDefaultRecommendations(),
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    };
  }
}

// 기본 추천사항 생성 함수
function getDefaultRecommendations(): Recommendation[] {
  return [
    {
      id: 'default_1',
      title: '기초 학습 자료 확인',
      description: 'MDN Web Docs, W3Schools 등에서 기본 개념을 학습하세요.',
      category: '학습자료',
      priority: 1,
      url: 'https://developer.mozilla.org'
    },
    {
      id: 'default_2',
      title: '실습 프로젝트 시작',
      description: '간단한 To-Do 앱부터 시작해서 점진적으로 복잡한 프로젝트를 만들어보세요.',
      category: '프로젝트',
      priority: 2
    },
    {
      id: 'default_3',
      title: '개발자 커뮤니티 참여',
      description: 'Stack Overflow, GitHub, 개발자 포럼에서 질문하고 답변하며 학습하세요.',
      category: '커뮤니티',
      priority: 3
    }
  ];
}

// Gemini 응답 파싱 함수
function parseGeminiResponse(text: string): { feedback: string; recommendations: Recommendation[] } {
  try {
    // JSON 부분만 추출 (```json 태그가 있을 수 있음)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('JSON 형식을 찾을 수 없습니다.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // 응답 구조 검증
    if (!parsed.feedback || !Array.isArray(parsed.recommendations)) {
      throw new Error('응답 구조가 올바르지 않습니다.');
    }

    // 추천사항 ID 생성 (없는 경우)
    const recommendations = parsed.recommendations.map((rec: unknown, index: number) => ({
      id: rec.id || `rec_${Date.now()}_${index}`,
      title: rec.title || '제목 없음',
      description: rec.description || '설명 없음',
      category: rec.category || '기타',
      priority: rec.priority || 3,
      url: rec.url || undefined
    }));

    return {
      feedback: parsed.feedback,
      recommendations
    };

  } catch (error) {
    console.error('응답 파싱 오류:', error);
    
    // 파싱 실패 시 기본 응답 반환
    return {
      feedback: '죄송합니다. AI 응답을 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
      recommendations: [
        {
          id: 'fallback_1',
          title: '기본 학습 가이드 확인',
          description: '온라인 학습 플랫폼에서 기초 강의를 수강해보세요.',
          category: '학습자료',
          priority: 1
        }
      ]
    };
  }
}

// API 키 검증 함수
export function validateAPIKey(): boolean {
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';
}