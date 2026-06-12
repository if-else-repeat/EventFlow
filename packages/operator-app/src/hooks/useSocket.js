import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

export function useSocket(token, onEvent) {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket','polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    socketRef.current = socket;
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    // Forward all events to handler
    const events = [
      'incident:created','incident:updated','broadcast:sent',
      'zone:status_changed','health:updated','timeline:entry',
    ];
    events.forEach(ev => socket.on(ev, (data) => onEvent?.(ev, data)));
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [token]);

  return { connected, socket: socketRef.current };
}
