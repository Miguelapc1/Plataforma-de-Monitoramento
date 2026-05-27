'use client';
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function useWebSocket(onMonitorUpdate?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('sentinel_token');
    if (!token) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => console.log('WS connected'));
    socket.on('disconnect', () => console.log('WS disconnected'));
    socket.on('monitor:update', (data) => onMonitorUpdate?.(data));

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.off('monitor:update');
      if (onMonitorUpdate) socketRef.current.on('monitor:update', onMonitorUpdate);
    }
  }, [onMonitorUpdate]);

  return socketRef.current;
}
