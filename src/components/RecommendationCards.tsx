'use client';

import { useState } from 'react';
import { Recommendation } from '@/types';

interface RecommendationCardsProps {
  recommendations: Recommendation[];
  onBookmark?: (recommendationId: string) => void;
  onCardClick?: (recommendation: Recommendation) => void;
  bookmarkedIds?: string[];
}

export default function RecommendationCards({ 
  recommendations, 
  onBookmark, 
  onCardClick,
  bookmarkedIds = []
}: RecommendationCardsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'category' | 'title'>('priority');

  // 카테고리 목록 추출
  const categories = ['all', ...Array.from(new Set(recommendations.map(rec => rec.category)))];

  // 필터링 및 정렬
  const filteredAndSortedRecommendations = recommendations
    .filter(rec => selectedCategory === 'all' || rec.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return a.priority - b.priority;
        case 'category':
          return a.category.localeCompare(b.category);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const getCategoryColor = (category: string) => {
    const colors = {
      '학습': 'bg-blue-100 text-blue-800',
      '기술': 'bg-green-100 text-green-800',
      '커리어': 'bg-purple-100 text-purple-800',
      '도구': 'bg-orange-100 text-orange-800',
      '리소스': 'bg-pink-100 text-pink-800',
      '프로젝트': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityIcon = (priority: number) => {
    if (priority <= 2) return '🔥'; // 높은 우선순위
    if (priority <= 4) return '⭐'; // 중간 우선순위
    return '💡'; // 낮은 우선순위
  };

  return (
    <div className="w-full">
      {/* 필터 및 정렬 컨트롤 */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700">카테고리:</span>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? '전체' : category}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">정렬:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'priority' | 'category' | 'title')}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="priority">우선순위</option>
            <option value="category">카테고리</option>
            <option value="title">제목</option>
          </select>
        </div>
      </div>

      {/* 추천사항 카드 그리드 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedRecommendations.map((recommendation, index) => (
          <div
            key={recommendation.id}
            className="animate-in fade-in-0 zoom-in-95"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <RecommendationCard
              recommendation={recommendation}
              isBookmarked={bookmarkedIds.includes(recommendation.id)}
              onBookmark={onBookmark}
              onClick={onCardClick}
              categoryColor={getCategoryColor(recommendation.category)}
              priorityIcon={getPriorityIcon(recommendation.priority)}
            />
          </div>
        ))}
      </div>

      {filteredAndSortedRecommendations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-lg font-medium mb-2">추천사항이 없습니다</p>
          <p className="text-sm">선택한 카테고리에 해당하는 추천사항이 없습니다.</p>
        </div>
      )}
    </div>
  );
}

// 개별 추천사항 카드 컴포넌트
interface RecommendationCardProps {
  recommendation: Recommendation;
  isBookmarked: boolean;
  onBookmark?: (recommendationId: string) => void;
  onClick?: (recommendation: Recommendation) => void;
  categoryColor: string;
  priorityIcon: string;
}

function RecommendationCard({
  recommendation,
  isBookmarked,
  onBookmark,
  onClick,
  categoryColor,
  priorityIcon
}: RecommendationCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.(recommendation.id);
  };

  const handleCardClick = () => {
    onClick?.(recommendation);
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 cursor-pointer card-hover ${
        isHovered ? 'shadow-lg scale-105' : 'shadow-sm'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* 카드 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{priorityIcon}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColor}`}>
            {recommendation.category}
          </span>
        </div>
        <button
          onClick={handleBookmarkClick}
          className={`p-1 rounded-full bookmark-btn ${
            isBookmarked
              ? 'text-yellow-500 hover:text-yellow-600'
              : 'text-gray-400 hover:text-yellow-500'
          }`}
          aria-label={isBookmarked ? '북마크 해제' : '북마크 추가'}
        >
          <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* 카드 내용 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 text-lg leading-tight">
          {recommendation.title}
        </h3>
        
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {recommendation.description}
        </p>

        {/* 링크가 있는 경우 */}
        {recommendation.url && (
          <div className="flex items-center text-blue-600 text-sm font-medium">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            자세히 보기
          </div>
        )}
      </div>

      {/* 우선순위 표시 */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>우선순위: {recommendation.priority}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full mr-1 ${
                  i < (6 - recommendation.priority) ? 'bg-blue-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}