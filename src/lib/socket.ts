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
    // Em produção, verificar se o site está em HTTPS
    const isHttps = window.location.protocol === 'https:';
    if (isHttps) {
      // Se o site está em HTTPS, usar WSS
      apiUrl = 'wss://62.171.141.220:3444';
      useSecure = true;
    } else {
      // Se estiver em HTTP, usar WS
      apiUrl = 'ws://62.171.141.220:3444';
    }
  } else {
    // Desenvolvimento local
    apiUrl = 'ws://localhost:3444';
  }
  
  const wsUrl = `${apiUrl}/notifications`;
  console.log(`[WebSocket] Conectando ao WebSocket em: ${wsUrl} (${useSecure ? 'WSS' : 'WS'})`);

  socket = io(wsUrl, {
    auth: {
      token: accessToken,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity, // Tentar reconectar indefinidamente
    timeout: 20000,
    forceNew: false,
    upgrade: true,
    rememberUpgrade: true,
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

