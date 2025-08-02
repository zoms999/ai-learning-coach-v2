'use client';

import { useEffect } from 'react';
import { Recommendation } from '@/types';

interface RecommendationModalProps {
  recommendation: Recommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onBookmark?: (recommendationId: string) => void;
  isBookmarked?: boolean;
}

export default function RecommendationModal({
  recommendation,
  isOpen,
  onClose,
  onBookmark,
  isBookmarked = false
}: RecommendationModalProps) {
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

  if (!isOpen || !recommendation) return null;

  const getCategoryColor = (category: string) => {
    const colors = {
      '학습': 'bg-blue-100 text-blue-800 border-blue-200',
      '기술': 'bg-green-100 text-green-800 border-green-200',
      '커리어': 'bg-purple-100 text-purple-800 border-purple-200',
      '도구': 'bg-orange-100 text-orange-800 border-orange-200',
      '리소스': 'bg-pink-100 text-pink-800 border-pink-200',
      '프로젝트': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityText = (priority: number) => {
    if (priority <= 2) return { text: '높음', color: 'text-red-600' };
    if (priority <= 4) return { text: '보통', color: 'text-yellow-600' };
    return { text: '낮음', color: 'text-green-600' };
  };

  const priorityInfo = getPriorityText(recommendation.priority);

  const handleBookmarkClick = () => {
    onBookmark?.(recommendation.id);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-200">
        {/* 모달 헤더 */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(recommendation.category)}`}>
                {recommendation.category}
              </span>
              <span className={`text-sm font-medium ${priorityInfo.color}`}>
                우선순위: {priorityInfo.text}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 leading-tight">
              {recommendation.title}
            </h2>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={handleBookmarkClick}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked
                  ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50'
                  : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
              }`}
              aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
            >
              <svg className="w-6 h-6" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="모달 닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 모달 내용 */}
        <div className="p-6">
          <div className="space-y-6">
            {/* 설명 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">상세 설명</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {recommendation.description}
              </p>
            </div>

            {/* 우선순위 시각화 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">우선순위</h3>
              <div className="flex items-center space-x-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-full mr-2 ${
                        i < (6 - recommendation.priority) ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className={`font-medium ${priorityInfo.color}`}>
                  {priorityInfo.text} ({recommendation.priority}/5)
                </span>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">추천 이유</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• 현재 학습 목표와 높은 연관성</p>
                <p>• 실무에서 자주 사용되는 기술/지식</p>
                <p>• 학습 난이도가 적절함</p>
                <p>• 커리어 발전에 도움이 됨</p>
              </div>
            </div>

            {/* 외부 링크 */}
            {recommendation.url && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">관련 링크</h3>
                <a
                  href={recommendation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  자세히 보기
                </a>
              </div>
            )}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={handleBookmarkClick}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isBookmarked
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isBookmarked ? '북마크 해제' : '북마크 추가'}
          </button>
        </div>
      </div>
    </div>
  );
}