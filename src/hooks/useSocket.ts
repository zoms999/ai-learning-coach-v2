'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ChatMessage } from '@/types';
import { RoomUser, ChatRoom, ServerToClientEvents, ClientToServerEvents } from '@/lib/socket-server';

type SocketType = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface UseSocketReturn {
  socket: SocketType | null;
  isConnected: boolean;
  currentRoom: ChatRoom | null;
  users: RoomUser[];
  messages: ChatMessage[];
  typingUsers: string[];
  rooms: ChatRoom[];
  joinRoom: (roomId: string, user: RoomUser) => void;
  leaveRoom: (roomId: string, userId: string) => void;
  sendMessage: (roomId: string, content: string, type: 'user' | 'ai') => void;
  startTyping: (roomId: string, userId: string, userName: string) => void;
  stopTyping: (roomId: string, userId: string) => void;
  createRoom: (name: string, description: string) => void;
  getRooms: () => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<SocketType | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);

  useEffect(() => {
    // Socket.IO 클라이언트 초기화
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? process.env.NEXT_PUBLIC_APP_URL || ''
      : 'http://localhost:3002';

    socketRef.current = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    const socket = socketRef.current;

    // 연결 이벤트
    socket.on('connect', () => {
      console.log('Socket 연결됨:', socket.id);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Socket 연결 해제됨');
      setIsConnected(false);
      setCurrentRoom(null);
      setUsers([]);
      setMessages([]);
      setTypingUsers([]);
    });

    // 방 관련 이벤트
    socket.on('room-updated', (room) => {
      setCurrentRoom(room);
      setMessages(room.messages);
    });

    socket.on('room-list-updated', (roomList) => {
      setRooms(roomList);
    });

    // 사용자 관련 이벤트
    socket.on('user-joined', (user) => {
      console.log(`사용자 참여: ${user.name}`);
    });

    socket.on('user-left', (userId) => {
      console.log(`사용자 나감: ${userId}`);
      setTypingUsers(prev => prev.filter(id => id !== userId));
    });

    socket.on('user-list-updated', (userList) => {
      setUsers(userList);
    });

    // 메시지 관련 이벤트
    socket.on('message-received', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // 타이핑 관련 이벤트
    socket.on('typing-start', (userId) => {
      setTypingUsers(prev => {
        if (!prev.includes(userId)) {
          return [...prev, userId];
        }
        return prev;
      });
    });

    socket.on('typing-stop', (userId) => {
      setTypingUsers(prev => prev.filter(id => id !== userId));
    });

    // 초기 방 목록 요청
    socket.emit('get-rooms');

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string, user: RoomUser) => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId, user);
    }
  };

  const leaveRoom = (roomId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId, userId);
      setCurrentRoom(null);
      setMessages([]);
      setUsers([]);
      setTypingUsers([]);
    }
  };

  const sendMessage = (roomId: string, content: string, type: 'user' | 'ai' = 'user') => {
    if (socketRef.current && content.trim()) {
      socketRef.current.emit('send-message', roomId, {
        type,
        content: content.trim()
      });
    }
  };

  const startTyping = (roomId: string, userId: string, userName: string) => {
    if (socketRef.current) {
      socketRef.current.emit('start-typing', roomId, userId, userName);
    }
  };

  const stopTyping = (roomId: string, userId: string) => {
    if (socketRef.current) {
      socketRef.current.emit('stop-typing', roomId, userId);
    }
  };

  const createRoom = (name: string, description: string) => {
    if (socketRef.current) {
      socketRef.current.emit('create-room', { name, description });
    }
  };

  const getRooms = () => {
    if (socketRef.current) {
      socketRef.current.emit('get-rooms');
    }
  };

  return {
    socket: socketRef.current,
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
  };
}