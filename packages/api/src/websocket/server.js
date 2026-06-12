const { Server } = require('socket.io');
const { verifyToken } = require('../middleware/auth');

let io = null;

function initWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? [process.env.PUBLIC_URL]
        : ['http://localhost:4000','http://localhost:4001','http://localhost:5173','http://localhost:5174'],
      credentials: true,
    },
    transports: ['websocket','polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      socket.operator = verifyToken(token);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { id, event_id, role, zone_id } = socket.operator;
    socket.join(`event:${event_id}`);
    if (zone_id) socket.join(`zone:${event_id}:${zone_id}`);
    socket.join(`role:${event_id}:${role}`);
    console.log(`[WS] ${role} connected to event:${event_id.substring(0,8)}`);
    socket.on('disconnect', () =>
      console.log(`[WS] ${role} disconnected from event:${event_id.substring(0,8)}`));
  });

  return io;
}

function emitToEvent(eventId, event, data) {
  if (io) io.to(`event:${eventId}`).emit(event, data);
}
function emitToZone(eventId, zoneId, event, data) {
  if (io) io.to(`zone:${eventId}:${zoneId}`).emit(event, data);
}
function emitToRole(eventId, role, event, data) {
  if (io) io.to(`role:${eventId}:${role}`).emit(event, data);
}
function getIO() { return io; }

module.exports = { initWebSocket, emitToEvent, emitToZone, emitToRole, getIO };
