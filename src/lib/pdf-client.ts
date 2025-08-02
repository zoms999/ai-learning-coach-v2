'use client';

import { ChatSession } from '@/stores/chatStore';

export interface PDFExportOptions {
  includeRecommendations?: boolean;
  includeTimestamps?: boolean;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export interface PDFExportRequest {
  session: ChatSession;
  options?: PDFExportOptions;
}

export class PDFClient {
  private static readonly API_ENDPOINT = '/api/export-pdf';

  /**
   * PDF 생성 및 다운로드
   */
  static async exportToPDF(
    session: ChatSession, 
    options: PDFExportOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<void> {
    try {
      // 진행률 업데이트
      onProgress?.(10);

      // 요청 데이터 준비
      const requestData: PDFExportRequest = {
        session,
        options: {
          includeRecommendations: options.includeRecommendations ?? true,
          includeTimestamps: options.includeTimestamps ?? true,
          format: options.format || 'A4',
          orientation: options.orientation || 'portrait'
        }
      };

      onProgress?.(30);

      // API 호출
      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      onProgress?.(60);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      // PDF 데이터 받기
      const pdfBlob = await response.blob();
      onProgress?.(80);

      // 파일명 생성
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'AI학습코치_대화내용.pdf';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch) {
          fileName = decodeURIComponent(fileNameMatch[1].replace(/['"]/g, ''));
        }
      }

      // 파일 다운로드
      this.downloadBlob(pdfBlob, fileName);
      onProgress?.(100);

    } catch (error) {
      console.error('PDF 내보내기 오류:', error);
      throw error;
    }
  }

  /**
   * Blob을 파일로 다운로드
   */
  private static downloadBlob(blob: Blob, fileName: string): void {
    try {
      // Blob URL 생성
      const url = window.URL.createObjectURL(blob);
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      // DOM에 추가하고 클릭
      document.body.appendChild(link);
      link.click();
      
      // 정리
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      throw new Error('파일 다운로드 중 오류가 발생했습니다.');
    }
  }

  /**
   * PDF 미리보기 URL 생성
   */
  static async generatePreviewURL(
    session: ChatSession, 
    options: PDFExportOptions = {}
  ): Promise<string> {
    try {
      const requestData: PDFExportRequest = {
        session,
        options: {
          includeRecommendations: options.includeRecommendations ?? true,
          includeTimestamps: options.includeTimestamps ?? true,
          format: options.format || 'A4',
          orientation: options.orientation || 'portrait'
        }
      };

      const response = await fetch(this.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const pdfBlob = await response.blob();
      return window.URL.createObjectURL(pdfBlob);

    } catch (error) {
      console.error('PDF 미리보기 생성 오류:', error);
      throw error;
    }
  }

  /**
   * 세션 유효성 검사
   */
  static validateSession(session: ChatSession): { isValid: boolean; error?: string } {
    if (!session) {
      return { isValid: false, error: '세션 데이터가 없습니다.' };
    }

    if (!session.messages || session.messages.length === 0) {
      return { isValid: false, error: '내보낼 메시지가 없습니다.' };
    }

    if (!session.title || session.title.trim().length === 0) {
      return { isValid: false, error: '세션 제목이 없습니다.' };
    }

    return { isValid: true };
  }

  /**
   * 예상 PDF 크기 계산 (대략적)
   */
  static estimatePDFSize(session: ChatSession): { 
    estimatedSizeKB: number; 
    pageCount: number; 
  } {
    const messageCount = session.messages.length;
    const recommendationCount = session.recommendations.length;
    
    // 대략적인 계산 (실제와 다를 수 있음)
    const baseSize = 50; // KB
    const messageSize = messageCount * 2; // KB per message
    const recommendationSize = recommendationCount * 3; // KB per recommendation
    
    const estimatedSizeKB = baseSize + messageSize + recommendationSize;
    const pageCount = Math.max(1, Math.ceil((messageCount + recommendationCount) / 10));

    return {
      estimatedSizeKB: Math.round(estimatedSizeKB),
      pageCount
    };
  }
}