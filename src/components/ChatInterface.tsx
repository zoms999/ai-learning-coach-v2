'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { UserInput, ChatMessage, Recommendation } from '@/types';
import { callChatAPI } from '@/lib/api-client';
import { TypingIndicator } from './LoadingIndicator';
import MessageStatus from './MessageStatus';
import RecommendationCards from './RecommendationCards';
import RecommendationModal from './RecommendationModal';
import PDFExportModal from './PDFExportModal';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useChatStore } from '@/stores/chatStore';
import type { ChatStore } from '@/stores/chatStore';
import { useHydratedStore } from '@/hooks/useHydratedStore';

interface ChatInterfaceProps {
  onNewMessage?: (message: ChatMessage) => void;
  onNewRecommendations?: (recommendations: Recommendation[]) => void;
  sessionId?: string; // 특정 세션을 로드할 때 사용
}

export default function ChatInterface({ onNewMessage, onNewRecommendations, sessionId }: ChatInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sending' | 'sent' | 'delivered' | 'error'>>({});
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // 북마크 훅 사용
  const { bookmarkedIds, toggleBookmark, isBookmarked } = useBookmarks();
  
  // 채팅 스토어 사용 (하이드레이션 안전)
  const chatStore = useHydratedStore<ChatStore>(useChatStore);
  
  // 현재 세션의 메시지와 추천사항 (메모이제이션)
  const messages = useMemo(() => chatStore?.currentSession?.messages || [], [chatStore?.currentSession?.messages]);
  const currentRecommendations = useMemo(() => chatStore?.currentSession?.recommendations || [], [chatStore?.currentSession?.recommendations]);
  const currentSessionId = useMemo(() => chatStore?.currentSession?.id, [chatStore?.currentSession?.id]);

  // 스크롤이 하단 근처에 있는지 확인 (useCallback으로 메모이제이션)
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 100;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  // 스크롤 자동 이동 (useCallback으로 메모이제이션)
  const scrollToBottom = useCallback((force = false) => {
    if (force || isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isNearBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  // 컴포넌트 마운트 시 세션 초기화 및 입력창 포커스
  useEffect(() => {
    if (!chatStore) return;
    
    const currentSessionId = chatStore.currentSession?.id;
    
    if (sessionId) {
      // 특정 세션 로드 (현재 세션과 다른 경우에만)
      if (currentSessionId !== sessionId) {
        chatStore.loadSession(sessionId);
      }
    } else if (!currentSessionId) {
      // 새 세션 생성
      chatStore.createNewSession();
    }
    
    inputRef.current?.focus();
  }, [sessionId, chatStore]); // 필요한 의존성만 포함

  // 스크롤 이벤트 처리
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isAtBottom = isNearBottom();
      setShowScrollButton(!isAtBottom);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isNearBottom]);

  // 메시지 추가 함수
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    if (!chatStore || !currentSessionId) return null;
    
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    };
    
    try {
      // 스토어에 메시지 추가
      chatStore.addMessageToSession(currentSessionId, newMessage);
      onNewMessage?.(newMessage);
      return newMessage;
    } catch (error) {
      console.error('메시지 추가 중 오류:', error);
      return null;
    }
  };



  // 메시지 상태 업데이트
  const updateMessageStatus = (messageId: string, status: 'sending' | 'sent' | 'delivered' | 'error') => {
    setMessageStatuses(prev => ({ ...prev, [messageId]: status }));
  };

  // 메시지 전송 처리
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    // 사용자 메시지 추가
    const userMsg = addMessage({
      type: 'user',
      content: userMessage
    });

    if (!userMsg) {
      console.error('Failed to add user message');
      return;
    }

    // 메시지 상태를 전송 중으로 설정
    updateMessageStatus(userMsg.id, 'sending');

    try {
      // 메시지 전송됨으로 상태 변경
      updateMessageStatus(userMsg.id, 'sent');
      
      // 타이핑 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 800));

      // API 호출을 위한 UserInput 형태로 변환
      const userInput: UserInput = {
        learningGoal: userMessage,
        interests: '',
        currentConcerns: ''
      };

      const response = await callChatAPI(userInput);

      // 메시지 읽음으로 상태 변경
      updateMessageStatus(userMsg.id, 'delivered');
      
      // 타이핑 상태 해제
      setIsTyping(false);

      // AI 응답 메시지 추가
      addMessage({
        type: 'ai',
        content: response.feedback || response.error || '응답을 받을 수 없습니다.'
      });

      // 추천사항이 있는 경우 스토어에 저장하고 카드로 표시
      if (response.recommendations && response.recommendations.length > 0 && chatStore && currentSessionId) {
        chatStore.addRecommendationsToSession(currentSessionId, response.recommendations);
        onNewRecommendations?.(response.recommendations);
        
        // 약간의 지연 후 추천사항 안내 메시지 추가
        setTimeout(() => {
          addMessage({
            type: 'ai',
            content: `📋 **맞춤형 추천사항 ${response.recommendations.length}개**를 준비했습니다!\n아래 카드를 클릭하여 자세한 내용을 확인해보세요.`
          });
        }, 1000);
      }

    } catch (error) {
      console.error('메시지 전송 오류:', error);
      setIsTyping(false);
      updateMessageStatus(userMsg.id, 'error');
      
      addMessage({
        type: 'ai',
        content: '죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해주세요.'
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 추천사항 카드 클릭 처리
  const handleRecommendationClick = (recommendation: Recommendation) => {
    setSelectedRecommendation(recommendation);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRecommendation(null);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      {/* 채팅 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-semibold">AI</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">AI 학습 코치</h3>
            <p className="text-sm text-gray-500">
              {isLoading ? '입력 중...' : '온라인'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {chatStore?.currentSession && messages.length > 0 && (
            <button
              onClick={() => setShowPDFModal(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isLoading}
              title="PDF로 내보내기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => chatStore?.createNewSession()}
            className="text-gray-500 hover:text-gray-700 text-sm"
            disabled={isLoading}
          >
            새 대화
          </button>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 relative">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <p className="text-lg font-medium mb-2">AI 학습 코치와 대화를 시작하세요</p>
            <p className="text-sm mb-4">학습 목표, 관심 분야, 현재 고민 등 무엇이든 물어보세요!</p>
            <div className="text-xs text-gray-400 space-y-1">
              <p>💡 예시: &ldquo;웹 개발을 배우고 싶어요&rdquo;</p>
              <p>💡 예시: &ldquo;React를 공부하고 있는데 어려워요&rdquo;</p>
              <p>💡 예시: &ldquo;프로그래밍 취업 준비 방법을 알려주세요&rdquo;</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                status={messageStatuses[message.id]}
              />
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">AI</span>
                  </div>
                  <TypingIndicator />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
        
        {/* 스크롤 다운 버튼 */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-4 right-4 w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            aria-label="최신 메시지로 이동"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}
      </div>

      {/* 추천사항 카드 섹션 */}
      {currentRecommendations.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <RecommendationCards
            recommendations={currentRecommendations}
            onBookmark={toggleBookmark}
            onCardClick={handleRecommendationClick}
            bookmarkedIds={bookmarkedIds}
          />
        </div>
      )}

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              !inputValue.trim() || isLoading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              '전송'
            )}
          </button>
        </div>
      </div>

      {/* 추천사항 상세 모달 */}
      <RecommendationModal
        recommendation={selectedRecommendation}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onBookmark={toggleBookmark}
        isBookmarked={selectedRecommendation ? isBookmarked(selectedRecommendation.id) : false}
      />

      {/* PDF 내보내기 모달 */}
      <PDFExportModal
        session={chatStore?.currentSession || null}
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
      />
    </div>
  );
}

// 메시지 말풍선 컴포넌트
function MessageBubble({ 
  message, 
  status 
}: { 
  message: ChatMessage;
  status?: 'sending' | 'sent' | 'delivered' | 'error';
}) {
  const isUser = message.type === 'user';
  
  // 마크다운 스타일 텍스트 렌더링을 위한 간단한 처리
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/🔗 (https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');
  };
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* 아바타 */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-green-600' : 'bg-blue-600'
        }`}>
          <span className="text-white text-sm font-semibold">
            {isUser ? 'U' : 'AI'}
          </span>
        </div>
        
        {/* 메시지 내용 */}
        <div className={`px-4 py-3 rounded-lg ${
          isUser 
            ? 'bg-green-600 text-white rounded-br-sm' 
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}>
          <div 
            className="text-sm whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
          <div className={`flex items-center justify-between mt-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`text-xs ${isUser ? 'text-green-100' : 'text-gray-500'}`}>
              {new Date(message.timestamp).toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            {isUser && status && (
              <MessageStatus status={status} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}