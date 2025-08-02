import { NextRequest, NextResponse } from 'next/server';
import { callGeminiAPI, validateAPIKey } from '@/lib/gemini';
import { ChatRequest, UserInput } from '@/types';

// POST 요청 처리
export async function POST(request: NextRequest) {
  console.log('=== API Route POST 요청 시작 ===');
  
  try {
    // API 키 검증
    console.log('API 키 검증 중...');
    if (!validateAPIKey()) {
      console.error('API 키 검증 실패');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gemini API 키가 설정되지 않았습니다.' 
        },
        { status: 500 }
      );
    }
    console.log('API 키 검증 성공');

    // 요청 본문 파싱
    console.log('요청 본문 파싱 중...');
    const body: ChatRequest = await request.json();
    console.log('파싱된 요청 본문:', JSON.stringify(body, null, 2));
    
    // 입력 데이터 검증
    if (!body.userInput) {
      console.error('사용자 입력 데이터 없음');
      return NextResponse.json(
        { 
          success: false, 
          error: '사용자 입력 데이터가 필요합니다.' 
        },
        { status: 400 }
      );
    }

    const { userInput } = body;

    // 필수 필드 검증 (learningGoal만 필수, 나머지는 선택사항)
    if (!userInput.learningGoal || userInput.learningGoal.trim().length === 0) {
      console.error('필수 필드 누락:', { userInput });
      return NextResponse.json(
        { 
          success: false, 
          error: '학습 목표를 입력해주세요.' 
        },
        { status: 400 }
      );
    }

    // 빈 필드를 기본값으로 채우기
    const processedUserInput: UserInput = {
      learningGoal: userInput.learningGoal.trim(),
      interests: userInput.interests?.trim() || '일반적인 학습',
      currentConcerns: userInput.currentConcerns?.trim() || '효과적인 학습 방법에 대한 조언이 필요합니다.'
    };

    // 입력 데이터 길이 검증
    if (processedUserInput.learningGoal.length > 500 || 
        processedUserInput.interests.length > 200 || 
        processedUserInput.currentConcerns.length > 1000) {
      console.error('입력 데이터 길이 초과:', {
        learningGoalLength: processedUserInput.learningGoal.length,
        interestsLength: processedUserInput.interests.length,
        currentConcernsLength: processedUserInput.currentConcerns.length
      });
      return NextResponse.json(
        { 
          success: false, 
          error: '입력 데이터가 허용된 길이를 초과했습니다.' 
        },
        { status: 400 }
      );
    }

    console.log('모든 검증 통과, Gemini API 호출 시작...');
    console.log('처리된 사용자 입력:', processedUserInput);
    
    // Gemini API 호출
    const aiResponse = await callGeminiAPI(processedUserInput);
    
    console.log('Gemini API 응답 받음:', {
      success: aiResponse.success,
      feedbackLength: aiResponse.feedback?.length,
      recommendationsCount: aiResponse.recommendations?.length,
      error: aiResponse.error
    });

    // 응답 반환
    return NextResponse.json(aiResponse, { 
      status: aiResponse.success ? 200 : 500 
    });

  } catch (error) {
    console.error('=== API Route 치명적 오류 ===');
    console.error('오류 상세:', {
      error,
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 내부 오류가 발생했습니다.',
        feedback: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        recommendations: []
      },
      { status: 500 }
    );
  }
}

// GET 요청 처리 (헬스 체크)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'AI Learning Coach API is running',
    apiKeyConfigured: validateAPIKey()
  });
}