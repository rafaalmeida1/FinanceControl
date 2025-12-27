import { io, Socket } from 'socket.io-client';
import { authStore } from '@/stores/authStore';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket?.connected) {
    return socket;
  }

  const { accessToken } = authStore.getState();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  socket = io(`${apiUrl}/notifications`, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('Socket conectado');
  });

  socket.on('disconnect', () => {
    console.log('Socket desconectado');
  });

  socket.on('connected', (data) => {
    console.log('Autenticado no socket:', data);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => {
  return socket;
};

