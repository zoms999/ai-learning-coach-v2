import { NextRequest, NextResponse } from 'next/server';
import { PDFGenerator, PDFExportOptions } from '@/lib/pdf-generator';
import { ChatSession } from '@/stores/chatStore';

export interface PDFExportRequest {
  session: ChatSession;
  options?: {
    includeRecommendations?: boolean;
    includeTimestamps?: boolean;
    format?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
  };
}

export async function POST(request: NextRequest) {
  console.log('=== PDF Export API 요청 시작 ===');
  
  try {
    // 요청 본문 파싱
    const body: PDFExportRequest = await request.json();
    console.log('PDF 생성 요청:', {
      sessionId: body.session?.id,
      sessionTitle: body.session?.title,
      messagesCount: body.session?.messages?.length,
      recommendationsCount: body.session?.recommendations?.length,
      options: body.options
    });

    // 입력 데이터 검증
    if (!body.session) {
      console.error('세션 데이터 없음');
      return NextResponse.json(
        { 
          success: false, 
          error: '세션 데이터가 필요합니다.' 
        },
        { status: 400 }
      );
    }

    if (!body.session.messages || body.session.messages.length === 0) {
      console.error('메시지 데이터 없음');
      return NextResponse.json(
        { 
          success: false, 
          error: '내보낼 메시지가 없습니다.' 
        },
        { status: 400 }
      );
    }

    // PDF 생성 옵션 설정
    const pdfOptions: PDFExportOptions = {
      session: body.session,
      includeRecommendations: body.options?.includeRecommendations ?? true,
      includeTimestamps: body.options?.includeTimestamps ?? true,
      format: body.options?.format || 'A4',
      orientation: body.options?.orientation || 'portrait'
    };

    console.log('PDF 생성 시작...');
    
    // PDF 생성
    const pdfBuffer = await PDFGenerator.generatePDF(pdfOptions);
    
    console.log('PDF 생성 완료:', {
      bufferSize: pdfBuffer.length,
      sizeInKB: Math.round(pdfBuffer.length / 1024)
    });

    // 파일명 생성
    const fileName = PDFGenerator.generateFileName(body.session);

    // PDF 응답 반환
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('=== PDF Export API 치명적 오류 ===');
    console.error('오류 상세:', {
      error,
      message: error instanceof Error ? error.message : '알 수 없는 오류',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'PDF 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// GET 요청 처리 (헬스 체크)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'PDF Export API is running',
    timestamp: new Date().toISOString()
  });
}