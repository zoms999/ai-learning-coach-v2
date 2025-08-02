'use client';

import { useState, useEffect } from 'react';
import { ChatSession } from '@/stores/chatStore';
import { PDFClient, PDFExportOptions } from '@/lib/pdf-client';

interface PDFExportModalProps {
  session: ChatSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PDFExportModal({ session, isOpen, onClose }: PDFExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<PDFExportOptions>({
    includeRecommendations: true,
    includeTimestamps: true,
    format: 'A4',
    orientation: 'portrait'
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsExporting(false);
      setExportProgress(0);
      setShowPreview(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, previewUrl]);

  if (!isOpen || !session) return null;

  const validation = PDFClient.validateSession(session);
  const sizeEstimate = PDFClient.estimatePDFSize(session);

  const handleExport = async () => {
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      await PDFClient.exportToPDF(session, exportOptions, (progress) => {
        setExportProgress(progress);
      });
      
      // 성공 메시지
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      }, 1000);

    } catch (error) {
      console.error('PDF 내보내기 실패:', error);
      alert(`PDF 내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handlePreview = async () => {
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      setIsExporting(true);
      const url = await PDFClient.generatePreviewURL(session, exportOptions);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('PDF 미리보기 생성 실패:', error);
      alert(`미리보기 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isExporting) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">PDF 내보내기</h2>
            <p className="text-gray-600 mt-1">{session.title}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-6">
          {/* 세션 정보 */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">대화 정보</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>📅 생성일: {new Date(session.createdAt).toLocaleDateString('ko-KR')}</div>
              <div>🔄 수정일: {new Date(session.updatedAt).toLocaleDateString('ko-KR')}</div>
              <div>💬 메시지: {session.messages.length}개</div>
              <div>💡 추천사항: {session.recommendations.length}개</div>
            </div>
          </div>

          {/* 내보내기 옵션 */}
          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-gray-800">내보내기 옵션</h3>
            
            {/* 포함 옵션 */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeRecommendations}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeRecommendations: e.target.checked
                  }))}
                  disabled={isExporting}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">추천사항 포함</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeTimestamps}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    includeTimestamps: e.target.checked
                  }))}
                  disabled={isExporting}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-gray-700">시간 정보 포함</span>
              </label>
            </div>

            {/* 페이지 설정 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  용지 크기
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    format: e.target.value as 'A4' | 'Letter'
                  }))}
                  disabled={isExporting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  방향
                </label>
                <select
                  value={exportOptions.orientation}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    orientation: e.target.value as 'portrait' | 'landscape'
                  }))}
                  disabled={isExporting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="portrait">세로</option>
                  <option value="landscape">가로</option>
                </select>
              </div>
            </div>
          </div>

          {/* 예상 크기 정보 */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">예상 PDF 정보</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>📄 예상 페이지 수: 약 {sizeEstimate.pageCount}페이지</div>
              <div>💾 예상 파일 크기: 약 {sizeEstimate.estimatedSizeKB}KB</div>
            </div>
          </div>

          {/* 진행률 표시 */}
          {isExporting && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {showPreview ? 'PDF 미리보기 생성 중...' : 'PDF 생성 중...'}
                </span>
                <span className="text-sm text-gray-500">{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 유효성 검사 오류 */}
          {!validation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-red-700 text-sm">{validation.error}</span>
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handlePreview}
            disabled={isExporting || !validation.isValid}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            미리보기
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !validation.isValid}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                생성 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                PDF 다운로드
              </>
            )}
          </button>
        </div>

        {/* PDF 미리보기 모달 */}
        {showPreview && previewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-lg max-w-4xl w-full h-full max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">PDF 미리보기</h3>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 p-4">
                <iframe
                  src={previewUrl}
                  className="w-full h-full border border-gray-300 rounded"
                  title="PDF 미리보기"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}