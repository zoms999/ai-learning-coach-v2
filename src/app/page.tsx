'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import BookmarkedRecommendations from '@/components/BookmarkedRecommendations';
import ChatHistory from '@/components/ChatHistory';
import RealTimeChatInterface from '@/components/RealTimeChatInterface';
import UserProfileModal from '@/components/UserProfileModal';
import { ToastProvider, useToast } from '@/contexts/ToastContext';
import { ChatMessage, Recommendation } from '@/types';
import { RoomUser } from '@/lib/socket-server';
import { useBookmarks } from '@/hooks/useBookmarks';

function HomeContent() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [allRecommendations, setAllRecommendations] = useState<Recommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'bookmarks' | 'history' | 'realtime'>('chat');
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [currentUser, setCurrentUser] = useState<RoomUser | null>(null);
  const { showToast } = useToast();
  const { bookmarkCount } = useBookmarks();

  const handleNewMessage = (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
    
    // AI 메시지일 때 토스트 표시
    if (message.type === 'ai' && !message.isLoading) {
      showToast('AI 응답이 도착했습니다!', 'success');
    }
  };

  const handleNewRecommendations = (recommendations: Recommendation[]) => {
    setAllRecommendations(prev => [...prev, ...recommendations]);
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setActiveTab('chat');
    setShowChatHistory(false);
  };

  const handleUserProfileSave = (user: RoomUser) => {
    setCurrentUser(user);
    // 로컬 스토리지에 사용자 정보 저장
    localStorage.setItem('realtime-chat-user', JSON.stringify(user));
  };

  const handleRealtimeTabClick = () => {
    // 사용자 프로필이 없으면 프로필 설정 모달 표시
    if (!currentUser) {
      // 로컬 스토리지에서 사용자 정보 확인
      const savedUser = localStorage.getItem('realtime-chat-user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          setActiveTab('realtime');
        } catch {
          setShowUserProfile(true);
        }
      } else {
        setShowUserProfile(true);
      }
    } else {
      setActiveTab('realtime');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            AI 학습 코치
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            개인화된 학습 조언과 맞춤형 가이드를 실시간 채팅으로 받아보세요
          </p>
        </header>

        {/* 탭 네비게이션 */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              💬 AI 채팅
            </button>
            <button
              onClick={handleRealtimeTabClick}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'realtime'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🌐 실시간 채팅
            </button>
            <button
              onClick={() => setShowChatHistory(true)}
              className="px-6 py-2 rounded-md font-medium transition-colors text-gray-600 hover:text-gray-800"
            >
              📚 대화 기록
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`px-6 py-2 rounded-md font-medium transition-colors relative ${
                activeTab === 'bookmarks'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🔖 북마크
              {bookmarkCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bookmarkCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <main className="h-[calc(100vh-280px)] relative">
          {activeTab === 'chat' ? (
            <ChatInterface 
              onNewMessage={handleNewMessage}
              onNewRecommendations={handleNewRecommendations}
              sessionId={selectedSessionId}
            />
          ) : activeTab === 'realtime' && currentUser ? (
            <RealTimeChatInterface currentUser={currentUser} />
          ) : (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <BookmarkedRecommendations allRecommendations={allRecommendations} />
            </div>
          )}

          {/* 대화 기록 모달 */}
          {showChatHistory && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <ChatHistory
                onSessionSelect={handleSessionSelect}
                onClose={() => setShowChatHistory(false)}
              />
            </div>
          )}

          {/* 사용자 프로필 모달 */}
          <UserProfileModal
            isOpen={showUserProfile}
            onClose={() => setShowUserProfile(false)}
            onSave={(user) => {
              handleUserProfileSave(user);
              setActiveTab('realtime');
              setShowUserProfile(false);
            }}
            initialUser={currentUser || undefined}
          />
          
          {/* 디버그 정보 (개발 모드에서만 표시) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">🔧 개발 모드 정보</h4>
              <p className="text-sm text-yellow-700">
                API 상태: <span className="font-mono">http://localhost:3000/api/chat</span>
              </p>
              <p className="text-sm text-yellow-700">
                채팅 메시지 수: {chatHistory.length}개
              </p>
              <p className="text-sm text-yellow-700">
                마지막 메시지: {chatHistory.length > 0 ? chatHistory[chatHistory.length - 1].type : '없음'}
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ToastProvider>
      <HomeContent />
    </ToastProvider>
  );
}
