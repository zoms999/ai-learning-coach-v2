import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'API 키가 설정되지 않았습니다.'
      });
    }

    // 간단한 테스트 요청
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('안녕하세요! 간단한 인사말로 답변해주세요.');
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: 'API 키가 정상적으로 작동합니다.',
      testResponse: text.substring(0, 100) + '...' // 처음 100자만 표시
    });

  } catch (error) {
    console.error('API 키 테스트 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      details: 'API 키가 유효하지 않거나 Gemini API에 문제가 있을 수 있습니다.'
    });
  }
}