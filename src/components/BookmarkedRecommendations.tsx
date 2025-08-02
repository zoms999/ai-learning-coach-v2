'use client';

import { useState } from 'react';
import { Recommendation } from '@/types';
import RecommendationCards from './RecommendationCards';
import RecommendationModal from './RecommendationModal';
import { useBookmarks } from '@/hooks/useBookmarks';

interface BookmarkedRecommendationsProps {
  allRecommendations: Recommendation[];
}

export default function BookmarkedRecommendations({ allRecommendations }: BookmarkedRecommendationsProps) {
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { bookmarkedIds, toggleBookmark, isBookmarked, clearBookmarks } = useBookmarks();

  // 북마크된 추천사항만 필터링
  const bookmarkedRecommendations = allRecommendations.filter(rec => 
    bookmarkedIds.includes(rec.id)
  );

  const handleRecommendationClick = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecommendation(null);
  };

  const handleClearAll = () => {
    if (window.confirm('모든 북마크를 삭제하시겠습니까?')) {
      clearBookmarks();
    }
  };

  return (
    <div className="w-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-bold text-gray-800">북마크한 추천사항</h2>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {bookmarkedRecommendations.length}개
          </span>
        </div>
        
        {bookmarkedRecommendations.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            전체 삭제
          </button>
        )}
      </div>

      {/* 북마크된 추천사항 표시 */}
      {bookmarkedRecommendations.length > 0 ? (
        <RecommendationCards
          recommendations={bookmarkedRecommendations}
          onBookmark={toggleBookmark}
          onCardClick={handleRecommendationClick}
          bookmarkedIds={bookmarkedIds}
        />
      ) : (
        <div className="text-center py-12 text-gray-500">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">북마크한 추천사항이 없습니다</h3>
          <p className="text-sm mb-4">관심 있는 추천사항을 북마크하여 나중에 다시 확인해보세요.</p>
          <div className="text-xs text-gray-400 space-y-1">
            <p>💡 추천사항 카드의 북마크 아이콘을 클릭하세요</p>
            <p>💡 북마크한 내용은 브라우저에 저장됩니다</p>
          </div>
        </div>
      )}

      {/* 추천사항 상세 모달 */}
      <RecommendationModal
        recommendation={selectedRecommendation}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onBookmark={toggleBookmark}
        isBookmarked={selectedRecommendation ? isBookmarked(selectedRecommendation.id) : false}
      />
    </div>
  );
}