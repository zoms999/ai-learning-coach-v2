'use client';

import { useState, useRef, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { RoomUser } from '@/lib/socket-server';

interface RealTimeChatInterfaceProps {
  currentUser: RoomUser;
}

export default function RealTimeChatInterface({ currentUser }: RealTimeChatInterfaceProps) {
  const {
    isConnected,
    currentRoom,
    users,
    messages,
    typingUsers,
    rooms,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    createRoom,
    getRooms
  } = useSocket();

  const [inputValue, setInputValue] = useState('');
  const [showRoomList, setShowRoomList] = useState(!currentRoom);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 스크롤 자동 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 타이핑 상태 관리
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping && currentRoom) {
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(currentRoom.id, currentUser.id);
        setIsTyping(false);
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, currentRoom, currentUser.id, stopTyping]);

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId, currentUser);
    setShowRoomList(false);
  };

  const handleLeaveRoom = () => {
    if (currentRoom) {
      leaveRoom(currentRoom.id, currentUser.id);
      setShowRoomList(true);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim() || !currentRoom) return;

    sendMessage(currentRoom.id, inputValue, 'user');
    setInputValue('');
    
    if (isTyping) {
      stopTyping(currentRoom.id, currentUser.id);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (!isTyping && currentRoom && e.target.value.trim()) {
      startTyping(currentRoom.id, currentUser.id, currentUser.name);
      setIsTyping(true);
    } else if (isTyping && !e.target.value.trim() && currentRoom) {
      stopTyping(currentRoom.id, currentUser.id);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateRoom = () => {
    if (newRoomName.trim() && newRoomDescription.trim()) {
      createRoom(newRoomName.trim(), newRoomDescription.trim());
      setNewRoomName('');
      setNewRoomDescription('');
      setShowCreateRoom(false);
      getRooms();
    }
  };

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypingText = () => {
    const typingUserNames = typingUsers
      .map(userId => users.find(u => u.id === userId)?.name)
      .filter(Boolean);
    
    if (typingUserNames.length === 0) return '';
    if (typingUserNames.length === 1) return `${typingUserNames[0]}님이 입력 중...`;
    if (typingUserNames.length === 2) return `${typingUserNames[0]}님과 ${typingUserNames[1]}님이 입력 중...`;
    return `${typingUserNames[0]}님 외 ${typingUserNames.length - 1}명이 입력 중...`;
  };

  // 연결 상태 표시
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">실시간 채팅에 연결 중...</p>
        </div>
      </div>
    );
  }

  // 방 목록 표시
  if (showRoomList) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">실시간 채팅방</h2>
              <p className="text-gray-600 mt-1">다른 학습자들과 실시간으로 소통해보세요</p>
            </div>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              새 방 만들기
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleJoinRoom(room.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-800">{room.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    {room.users.length}명
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{room.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  {room.users.length > 0 ? (
                    <span>{room.users.slice(0, 3).map(u => u.name).join(', ')}{room.users.length > 3 ? ' 외' : ''}</span>
                  ) : (
                    <span>참여자 없음</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 새 방 만들기 모달 */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold mb-4">새 채팅방 만들기</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    방 이름
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="방 이름을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    방 설명
                  </label>
                  <textarea
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="방에 대한 간단한 설명을 입력하세요"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateRoom(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={!newRoomName.trim() || !newRoomDescription.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  만들기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 채팅 인터페이스
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg h-[600px] flex flex-col">
      {/* 채팅방 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <button
            onClick={handleLeaveRoom}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full mr-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h3 className="font-semibold text-gray-800">{currentRoom?.name}</h3>
            <p className="text-sm text-gray-500">{currentRoom?.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{users.length}명 참여</span>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
      </div>

      {/* 사용자 목록 */}
      <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center space-x-2 overflow-x-auto">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full text-xs whitespace-nowrap"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{user.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
              message.type === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}
        
        {/* 타이핑 인디케이터 */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-500">{getTypingText()}</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}