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
  console.log(`[WebSocket] 🔌 Conectando ao WebSocket em: ${wsUrl}`);
  console.log(`[WebSocket] 🔐 Protocolo: ${useSecure ? 'WSS (Secure)' : 'WS (Insecure)'}`);
  console.log(`[WebSocket] 🎫 Token disponível: ${accessToken ? 'Sim' : 'Não'}`);

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
    console.log('[WebSocket] ✅ Socket conectado com sucesso');
    if (socket) {
      console.log(`[WebSocket] 🆔 Socket ID: ${socket.id}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[WebSocket] 🔌 Socket desconectado. Razão: ${reason}`);
    if (reason === 'io server disconnect') {
      console.log('[WebSocket] ⚠️ Servidor desconectou o cliente. Tentando reconectar...');
    } else if (reason === 'io client disconnect') {
      console.log('[WebSocket] ℹ️ Cliente desconectou manualmente');
    } else if (reason === 'ping timeout') {
      console.log('[WebSocket] ⚠️ Timeout de ping. Tentando reconectar...');
    } else if (reason === 'transport close') {
      console.log('[WebSocket] ⚠️ Transporte fechado. Tentando reconectar...');
    } else if (reason === 'transport error') {
      console.log('[WebSocket] ❌ Erro no transporte. Tentando reconectar...');
    }
  });

  socket.on('connect_error', (error: any) => {
    console.error('[WebSocket] ❌ Erro ao conectar socket:', error.message);
    if (error.type) {
      console.error('[WebSocket] 📋 Tipo do erro:', error.type);
    }
    if (error.description) {
      console.error('[WebSocket] 📋 Descrição:', error.description);
    }
    
    // Se for erro de SSL/WSS, tentar com WS
    if (
      error.message.includes('SSL') ||
      error.message.includes('certificate') ||
      error.message.includes('TLS')
    ) {
      console.warn('[WebSocket] ⚠️ Erro SSL detectado. O servidor pode não ter SSL configurado.');
      console.warn('[WebSocket] 💡 Considere usar WS em vez de WSS se o servidor não tiver SSL.');
    }
  });

  socket.on('connected', (data) => {
    console.log('[WebSocket] ✅ Autenticado no socket:', data);
    console.log(`[WebSocket] 👤 User ID: ${data.userId}`);
  });

  // Adicionar listener para todos os eventos de notificação
  socket.onAny((event, ...args) => {
    console.log(`[WebSocket] 📨 Evento recebido: ${event}`, args);
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

