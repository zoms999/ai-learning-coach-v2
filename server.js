const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3002;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Socket.IO 초기화
  const io = new Server(server, {
    cors: {
      origin: dev ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'] : process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST']
    }
  });

  // 간단한 Socket.IO 이벤트 처리
  const rooms = new Map();
  const userRooms = new Map();

  // 기본 방 생성
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
    rooms.set(room.id, room);
  });

  io.on('connection', (socket) => {
    console.log(`사용자 연결됨: ${socket.id}`);

    // 방 목록 요청
    socket.on('get-rooms', () => {
      const roomList = Array.from(rooms.values());
      socket.emit('room-list-updated', roomList);
    });

    // 방 참여
    socket.on('join-room', (roomId, user) => {
      const room = rooms.get(roomId);
      if (!room) return;

      // 이전 방에서 나가기
      const previousRoomId = userRooms.get(socket.id);
      if (previousRoomId) {
        const prevRoom = rooms.get(previousRoomId);
        if (prevRoom) {
          prevRoom.users = prevRoom.users.filter(u => u.id !== user.id);
          socket.to(previousRoomId).emit('user-left', user.id);
          socket.to(previousRoomId).emit('user-list-updated', prevRoom.users);
        }
        socket.leave(previousRoomId);
      }

      // 새 방 참여
      socket.join(roomId);
      userRooms.set(socket.id, roomId);

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

    // 메시지 전송
    socket.on('send-message', (roomId, messageData) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const message = {
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
      io.to(roomId).emit('message-received', message);

      console.log(`방 ${roomId}에 메시지 전송: ${message.content}`);
    });

    // 타이핑 시작
    socket.on('start-typing', (roomId, userId, userName) => {
      socket.to(roomId).emit('typing-start', userId, userName);
    });

    // 타이핑 중지
    socket.on('stop-typing', (roomId, userId) => {
      socket.to(roomId).emit('typing-stop', userId);
    });

    // 연결 해제
    socket.on('disconnect', () => {
      console.log(`사용자 연결 해제됨: ${socket.id}`);
      
      const roomId = userRooms.get(socket.id);
      if (roomId) {
        const room = rooms.get(roomId);
        if (room) {
          room.users = room.users.filter(u => u.id !== socket.id);
          socket.to(roomId).emit('user-left', socket.id);
          socket.to(roomId).emit('user-list-updated', room.users);
        }
        userRooms.delete(socket.id);
      }
    });
  });

  console.log('Socket.IO 서버가 초기화되었습니다.');

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO 서버가 포트 ${port}에서 실행 중입니다.`);
    });
});