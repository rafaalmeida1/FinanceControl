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

  // Obter URL base da API para WebSocket
  // WebSockets não funcionam bem com proxy do Vercel, então em produção usa o IP direto
  let apiUrl: string;
  
  if (import.meta.env.VITE_API_URL) {
    // Se VITE_API_URL estiver definido, usar ele (removendo /api/v1 se presente)
    apiUrl = import.meta.env.VITE_API_URL.replace(/\/api\/v1$/, '').replace(/\/api\/v1\//, '/');
  } else if (import.meta.env.PROD) {
    // Em produção na Vercel, usar o IP direto do servidor para WebSocket
    apiUrl = 'http://62.171.141.220:3444';
  } else {
    // Desenvolvimento local
    apiUrl = 'http://localhost:3000';
  }
  
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

