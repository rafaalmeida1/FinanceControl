import { io, Socket } from 'socket.io-client';
import { authStore } from '@/stores/authStore';

let socket: Socket | null = null;

export const connectSocket = () => {
  const { accessToken } = authStore.getState();
  
  if (!accessToken) {
    console.warn('Tentando conectar socket sem token de acesso');
    return socket || null;
  }

  // Se já existe socket conectado, retornar
  if (socket?.connected) {
    return socket;
  }

  // Se existe socket mas desconectado, desconectar e criar novo
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Obter URL base da API, removendo /api/v1 se presente (WebSocket não usa esse prefixo)
  let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Remover /api/v1 se presente na URL
  apiUrl = apiUrl.replace(/\/api\/v1$/, '').replace(/\/api\/v1\//, '/');
  
  const wsUrl = `${apiUrl}/notifications`;
  console.log(`[WebSocket] Conectando ao WebSocket em: ${wsUrl}`);

  socket = io(wsUrl, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[WebSocket] Socket conectado com sucesso');
  });

  socket.on('disconnect', (reason) => {
    console.log(`[WebSocket] Socket desconectado. Razão: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    console.error('[WebSocket] Erro ao conectar socket:', error.message);
    console.error('[WebSocket] Detalhes do erro:', error);
  });

  socket.on('connected', (data) => {
    console.log('[WebSocket] Autenticado no socket:', data);
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

