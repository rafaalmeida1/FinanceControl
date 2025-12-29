import { io, Socket } from 'socket.io-client';
import { authStore } from '@/stores/authStore';

let socket: Socket | null = null;

export const connectSocket = () => {
  const { accessToken } = authStore.getState();
  
  if (!accessToken) {
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
  let apiUrl: string;
  let useSecure = false;
  
  if (import.meta.env.VITE_API_URL) {
    // Se VITE_API_URL estiver definido, usar ele (removendo /api/v1 se presente)
    apiUrl = import.meta.env.VITE_API_URL.replace(/\/api\/v1$/, '').replace(/\/api\/v1\//, '/');
    // Se a URL começar com https, usar WSS
    useSecure = apiUrl.startsWith('https://');
    // Converter para WS/WSS
    if (useSecure) {
      apiUrl = apiUrl.replace('https://', 'wss://');
    } else {
      apiUrl = apiUrl.replace('http://', 'ws://');
    }
  } else if (import.meta.env.PROD) {
    // Em produção, usar o domínio do backend com WSS
    apiUrl = 'wss://api-finance-control.bitrafa.com.br';
    useSecure = true;
  } else {
    // Desenvolvimento local
    apiUrl = 'ws://localhost:3444';
  }
  
  const wsUrl = `${apiUrl}/notifications`;

  socket = io(wsUrl, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    forceNew: false,
    upgrade: true,
    rememberUpgrade: true,
    autoConnect: true,
  });

  socket.on('connect', () => {
    // Conexão estabelecida
  });

  socket.on('disconnect', () => {
    // Desconexão detectada
  });

  socket.on('connect_error', () => {
    // Erro de conexão
  });

  socket.on('connected', () => {
    // Autenticado
  });

  socket.onAny(() => {
    // Eventos recebidos
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

