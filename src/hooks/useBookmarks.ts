'use client';

import { useState, useEffect } from 'react';

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // 로컬 스토리지에서 북마크 데이터 로드
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ai-coach-bookmarks');
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
    } catch (error) {
      console.error('북마크 데이터 로드 실패:', error);
    }
  }, []);

  // 북마크 데이터를 로컬 스토리지에 저장
  const saveBookmarks = (ids: string[]) => {
    try {
      localStorage.setItem('ai-coach-bookmarks', JSON.stringify(ids));
      setBookmarkedIds(ids);
    } catch (error) {
      console.error('북마크 데이터 저장 실패:', error);
    }
  };

  // 북마크 추가/제거 토글
  const toggleBookmark = (recommendationId: string) => {
    const newBookmarks = bookmarkedIds.includes(recommendationId)
      ? bookmarkedIds.filter(id => id !== recommendationId)
      : [...bookmarkedIds, recommendationId];
    
    saveBookmarks(newBookmarks);
  };

  // 북마크 추가
  const addBookmark = (recommendationId: string) => {
    if (!bookmarkedIds.includes(recommendationId)) {
      saveBookmarks([...bookmarkedIds, recommendationId]);
    }
  };

  // 북마크 제거
  const removeBookmark = (recommendationId: string) => {
    saveBookmarks(bookmarkedIds.filter(id => id !== recommendationId));
  };

  // 모든 북마크 제거
  const clearBookmarks = () => {
    saveBookmarks([]);
  };

  // 북마크 여부 확인
  const isBookmarked = (recommendationId: string) => {
    return bookmarkedIds.includes(recommendationId);
  };

  return {
    bookmarkedIds,
    toggleBookmark,
    addBookmark,
    removeBookmark,
    clearBookmarks,
    isBookmarked,
    bookmarkCount: bookmarkedIds.length
  };
}