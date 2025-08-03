import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { ChatMessage } from '@/types';

export interface RoomUser {
  id: string;
  name: string;
  avatar?: string;
  joinedAt: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  users: RoomUser[];
  messages: ChatMessage[];
  createdAt: Date;
  isActive: boolean;
}

export interface ServerToClientEvents {
  'user-joined': (user: RoomUser) => void;
  'user-left': (userId: string) => void;
  'message-received': (message: ChatMessage) => void;
  'room-updated': (room: ChatRoom) => void;
  'typing-start': (userId: string, userName: string) => void;
  'typing-stop': (userId: string) => void;
  'user-list-updated': (users: RoomUser[]) => void;
  'room-list-updated': (rooms: ChatRoom[]) => void;
}

export interface ClientToServerEvents {
  'join-room': (roomId: string, user: RoomUser) => void;
  'leave-room': (roomId: string, userId: string) => void;
  'send-message': (roomId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  'start-typing': (roomId: string, userId: string, userName: string) => void;
  'stop-typing': (roomId: string, userId: string) => void;
  'create-room': (room: Omit<ChatRoom, 'id' | 'users' | 'messages' | 'createdAt' | 'isActive'>) => void;
  'get-rooms': () => void;
}

class SocketManager {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private rooms: Map<string, ChatRoom> = new Map();
  private userRooms: Map<string, string> = new Map(); // userId -> roomId
  private typingUsers: Map<string, Set<string>> = new Map(); // roomId -> Set<userId>

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        methods: ['GET', 'POST']
      }
    });

    this.initializeDefaultRooms();
    this.setupEventHandlers();
  }

  private initializeDefaultRooms() {
    const defaultRooms = [
      {
        id: 'general',
        name: '일반 채팅',
        description: '자유롭게 대화하는 공간입니다',
        users: [],
        messages: [],
        createdAt: new Date(),
        isActive: true
      },
      {
        id: 'study',
        name: '학습 토론',
        description: '학습 관련 질문과 토론을 나누는 공간입니다',
        users: [],
        messages: [],
        createdAt: new Date(),
        isActive: true
      },
      {
        id: 'help',
        name: '도움 요청',
        description: '학습 중 어려운 점을 도움받는 공간입니다',
        users: [],
        messages: [],
        createdAt: new Date(),
        isActive: true
      }
    ];

    defaultRooms.forEach(room => {
      this.rooms.set(room.id, room);
      this.typingUsers.set(room.id, new Set());
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`사용자 연결됨: ${socket.id}`);

      // 방 목록 요청
      socket.on('get-rooms', () => {
        const roomList = Array.from(this.rooms.values()).map(room => ({
          ...room,
          userCount: room.users.length
        }));
        socket.emit('room-list-updated', roomList);
      });

      // 방 생성
      socket.on('create-room', (roomData) => {
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newRoom: ChatRoom = {
          id: roomId,
          ...roomData,
          users: [],
          messages: [],
          createdAt: new Date(),
          isActive: true
        };

        this.rooms.set(roomId, newRoom);
        this.typingUsers.set(roomId, new Set());
        
        // 모든 클라이언트에게 새 방 알림
        this.io.emit('room-list-updated', Array.from(this.rooms.values()));
      });

      // 방 참여
      socket.on('join-room', (roomId, user) => {
        const room = this.rooms.get(roomId);
        if (!room) return;

        // 이전 방에서 나가기
        const previousRoomId = this.userRooms.get(socket.id);
        if (previousRoomId) {
          this.handleLeaveRoom(socket, previousRoomId, socket.id);
        }

        // 새 방 참여
        socket.join(roomId);
        this.userRooms.set(socket.id, roomId);

        // 사용자를 방에 추가
        const existingUserIndex = room.users.findIndex(u => u.id === user.id);
        if (existingUserIndex === -1) {
          room.users.push(user);
        } else {
          room.users[existingUserIndex] = user;
        }

        // 방의 다른 사용자들에게 알림
        socket.to(roomId).emit('user-joined', user);
        socket.to(roomId).emit('user-list-updated', room.users);
        
        // 참여한 사용자에게 현재 방 정보 전송
        socket.emit('room-updated', room);
        socket.emit('user-list-updated', room.users);

        console.log(`사용자 ${user.name}이 방 ${roomId}에 참여했습니다`);
      });

      // 방 나가기
      socket.on('leave-room', (roomId, userId) => {
        this.handleLeaveRoom(socket, roomId, userId);
      });

      // 메시지 전송
      socket.on('send-message', (roomId, messageData) => {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const message: ChatMessage = {
          ...messageData,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };

        // 방에 메시지 저장
        room.messages.push(message);
        
        // 메시지 개수 제한 (최근 100개만 유지)
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }

        // 방의 모든 사용자에게 메시지 전송
        this.io.to(roomId).emit('message-received', message);

        console.log(`방 ${roomId}에 메시지 전송: ${message.content}`);
      });

      // 타이핑 시작
      socket.on('start-typing', (roomId, userId, userName) => {
        const typingSet = this.typingUsers.get(roomId);
        if (typingSet) {
          typingSet.add(userId);
          socket.to(roomId).emit('typing-start', userId, userName);
        }
      });

      // 타이핑 중지
      socket.on('stop-typing', (roomId, userId) => {
        const typingSet = this.typingUsers.get(roomId);
        if (typingSet) {
          typingSet.delete(userId);
          socket.to(roomId).emit('typing-stop', userId);
        }
      });

      // 연결 해제
      socket.on('disconnect', () => {
        console.log(`사용자 연결 해제됨: ${socket.id}`);
        
        const roomId = this.userRooms.get(socket.id);
        if (roomId) {
          this.handleLeaveRoom(socket, roomId, socket.id);
        }
      });
    });
  }

  private handleLeaveRoom(socket: Socket, roomId: string, userId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    // 방에서 사용자 제거
    room.users = room.users.filter(u => u.id !== userId);
    
    // 타이핑 상태 제거
    const typingSet = this.typingUsers.get(roomId);
    if (typingSet) {
      typingSet.delete(userId);
    }

    // 소켓에서 방 나가기
    socket.leave(roomId);
    this.userRooms.delete(socket.id);

    // 방의 다른 사용자들에게 알림
    socket.to(roomId).emit('user-left', userId);
    socket.to(roomId).emit('user-list-updated', room.users);

    console.log(`사용자 ${userId}이 방 ${roomId}에서 나갔습니다`);
  }

  public getIO() {
    return this.io;
  }

  public getRooms() {
    return Array.from(this.rooms.values());
  }

  public getRoom(roomId: string) {
    return this.rooms.get(roomId);
  }
}

let socketManager: SocketManager | null = null;

export function initializeSocket(server: HTTPServer): SocketManager {
  if (!socketManager) {
    socketManager = new SocketManager(server);
  }
  return socketManager;
}

export function getSocketManager(): SocketManager | null {
  return socketManager;
}