'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ChatMessage, Recommendation } from '@/types';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  recommendations: Recommendation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatStore {
  // 현재 활성 세션
  currentSession: ChatSession | null;
  
  // 저장된 모든 세션
  sessions: ChatSession[];
  
  // 액션들
  createNewSession: () => string;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  addRecommendationsToSession: (sessionId: string, recommendations: Recommendation[]) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
  loadSession: (sessionId: string) => void;
  clearCurrentSession: () => void;
  
  // 유틸리티
  getSessionById: (sessionId: string) => ChatSession | undefined;
  getRecentSessions: (limit?: number) => ChatSession[];
  searchSessions: (query: string) => ChatSession[];
}

// 새 세션 생성 헬퍼
const createSession = (title?: string): ChatSession => ({
  id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  title: title || `대화 ${new Date().toLocaleDateString('ko-KR')}`,
  messages: [],
  recommendations: [],
  createdAt: new Date(),
  updatedAt: new Date()
});

// 세션 제목 자동 생성 헬퍼
const generateSessionTitle = (messages: ChatMessage[]): string => {
  const firstUserMessage = messages.find(msg => msg.type === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    return content.length > 30 ? content.substring(0, 30) + '...' : content;
  }
  return `대화 ${new Date().toLocaleDateString('ko-KR')}`;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      currentSession: null,
      sessions: [],

      createNewSession: () => {
        const newSession = createSession();
        set(state => ({
          currentSession: newSession,
          sessions: [newSession, ...state.sessions]
        }));
        return newSession.id;
      },

      addMessageToSession: (sessionId: string, message: ChatMessage) => {
        set(state => {
          const updatedSessions = state.sessions.map(session => {
            if (session.id === sessionId) {
              const updatedMessages = [...session.messages, message];
              const updatedSession = {
                ...session,
                messages: updatedMessages,
                title: updatedMessages.length === 1 ? generateSessionTitle(updatedMessages) : session.title,
                updatedAt: new Date()
              };
              return updatedSession;
            }
            return session;
          });

          const updatedCurrentSession = state.currentSession?.id === sessionId
            ? updatedSessions.find(s => s.id === sessionId) || null
            : state.currentSession;

          return {
            sessions: updatedSessions,
            currentSession: updatedCurrentSession
          };
        });
      },

      addRecommendationsToSession: (sessionId: string, recommendations: Recommendation[]) => {
        set(state => {
          const updatedSessions = state.sessions.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                recommendations: [...session.recommendations, ...recommendations],
                updatedAt: new Date()
              };
            }
            return session;
          });

          const updatedCurrentSession = state.currentSession?.id === sessionId
            ? updatedSessions.find(s => s.id === sessionId) || null
            : state.currentSession;

          return {
            sessions: updatedSessions,
            currentSession: updatedCurrentSession
          };
        });
      },

      updateSessionTitle: (sessionId: string, title: string) => {
        set(state => {
          const updatedSessions = state.sessions.map(session => {
            if (session.id === sessionId) {
              return {
                ...session,
                title: title.trim() || session.title,
                updatedAt: new Date()
              };
            }
            return session;
          });

          const updatedCurrentSession = state.currentSession?.id === sessionId
            ? updatedSessions.find(s => s.id === sessionId) || null
            : state.currentSession;

          return {
            sessions: updatedSessions,
            currentSession: updatedCurrentSession
          };
        });
      },

      deleteSession: (sessionId: string) => {
        set(state => ({
          sessions: state.sessions.filter(session => session.id !== sessionId),
          currentSession: state.currentSession?.id === sessionId ? null : state.currentSession
        }));
      },

      loadSession: (sessionId: string) => {
        const state = get();
        // 이미 같은 세션이 로드되어 있으면 무시
        if (state.currentSession?.id === sessionId) {
          return;
        }
        
        const session = state.getSessionById(sessionId);
        if (session) {
          set({ currentSession: session });
        }
      },

      clearCurrentSession: () => {
        set({ currentSession: null });
      },

      // 유틸리티 함수들
      getSessionById: (sessionId: string) => {
        return get().sessions.find(session => session.id === sessionId);
      },

      getRecentSessions: (limit = 10) => {
        return get().sessions
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
      },

      searchSessions: (query: string) => {
        const lowercaseQuery = query.toLowerCase();
        return get().sessions.filter(session => 
          session.title.toLowerCase().includes(lowercaseQuery) ||
          session.messages.some(message => 
            message.content.toLowerCase().includes(lowercaseQuery)
          )
        );
      }
    }),
    {
      name: 'ai-coach-chat-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Date 객체 복원
          state.sessions = state.sessions.map(session => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            messages: session.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          
          if (state.currentSession) {
            state.currentSession = {
              ...state.currentSession,
              createdAt: new Date(state.currentSession.createdAt),
              updatedAt: new Date(state.currentSession.updatedAt),
              messages: state.currentSession.messages.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }))
            };
          }
        }
      }
    }
  )
);