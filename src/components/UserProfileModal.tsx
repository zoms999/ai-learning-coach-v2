'use client';

import { useState, useEffect } from 'react';
import { RoomUser } from '@/lib/socket-server';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: RoomUser) => void;
  initialUser?: RoomUser;
}

export default function UserProfileModal({ isOpen, onClose, onSave, initialUser }: UserProfileModalProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (initialUser) {
      setName(initialUser.name);
      setAvatar(initialUser.avatar || '');
    } else {
      // 기본값 설정
      setName(`사용자${Math.floor(Math.random() * 1000)}`);
      setAvatar('👤');
    }
  }, [initialUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const user: RoomUser = {
      id: initialUser?.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      avatar: avatar || '👤',
      joinedAt: initialUser?.joinedAt || new Date()
    };

    onSave(user);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const avatarOptions = [
    '👤', '😀', '😊', '🤓', '😎', '🤔', '😴', '🤗',
    '👨‍💻', '👩‍💻', '👨‍🎓', '👩‍🎓', '👨‍🏫', '👩‍🏫', '🧑‍💼', '👩‍💼'
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">프로필 설정</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* 아바타 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              아바타 선택
            </label>
            <div className="grid grid-cols-8 gap-2">
              {avatarOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setAvatar(option)}
                  className={`w-10 h-10 text-2xl rounded-lg border-2 transition-colors ${
                    avatar === option
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* 이름 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">
              {name.length}/20자
            </p>
          </div>

          {/* 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">미리보기</p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl border border-gray-200">
                {avatar}
              </div>
              <div>
                <p className="font-medium text-gray-800">{name || '닉네임'}</p>
                <p className="text-xs text-gray-500">온라인</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-8">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}