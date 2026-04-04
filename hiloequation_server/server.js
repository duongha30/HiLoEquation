'use strict';

const app = require('./src/app');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 4056;

const server = app.listen(PORT, () => {
  console.log(`WSV hiloequation starts with ${PORT}`);
});

const io = new Server(server, {
  cors: { origin: '*' },
});

// roomId → Set of socket ids
const rooms = new Map();

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  // Client emits { roomId } to create or join a room
  socket.on('join_room', ({ roomId }) => {
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);
    socket.join(roomId);

    const members = rooms.get(roomId).size;
    console.log(`[socket] ${socket.id} joined room ${roomId} (${members} members)`);

    // Notify everyone in the room
    io.to(roomId).emit('room_updated', { roomId, members });
  });

  // Client emits { roomId } to leave a room
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
    rooms.get(roomId)?.delete(socket.id);

    const members = rooms.get(roomId)?.size ?? 0;
    io.to(roomId).emit('room_updated', { roomId, members });
  });

  socket.on('disconnect', () => {
    console.log(`[socket] disconnected: ${socket.id}`);
    // Remove from all rooms on disconnect
    rooms.forEach((members, roomId) => {
      if (members.delete(socket.id)) {
        io.to(roomId).emit('room_updated', { roomId, members: members.size });
      }
    });
  });
});

process.on('SIGINT', () => {
  server.close(() => console.log('...Exit Server Express'));
});