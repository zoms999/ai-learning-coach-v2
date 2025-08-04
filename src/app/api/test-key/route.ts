import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// CORS 헤더 설정 함수
function setCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// OPTIONS 요청 처리 (preflight)
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response);
}

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      const errorResponse = NextResponse.json({
        success: false,
        error: 'API 키가 설정되지 않았습니다.'
      });
      return setCorsHeaders(errorResponse);
    }

    // 간단한 테스트 요청
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('안녕하세요! 간단한 인사말로 답변해주세요.');
    const response = await result.response;
    const text = response.text();

    const successResponse = NextResponse.json({
      success: true,
      message: 'API 키가 정상적으로 작동합니다.',
      testResponse: text.substring(0, 100) + '...' // 처음 100자만 표시
    });
    return setCorsHeaders(successResponse);

  } catch (error) {
    console.error('API 키 테스트 오류:', error);
    
    const errorResponse = NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: 'API 키가 유효하지 않거나 Gemini API에 문제가 있을 수 있습니다.'
    });
    return setCorsHeaders(errorResponse);
  }
}