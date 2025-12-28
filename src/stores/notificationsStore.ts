import { create } from 'zustand';
import { connectSocket, getSocket } from '@/lib/socket';

export interface Notification {
  id: string;
  type: string;
  subject: string;
  message: string;
  link?: string;
  buttonText?: string;
  timestamp: string;
  read: boolean;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  deleteNotification: (id: string) => void;
  initialize: () => void;
}

export const notificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      read: false,
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  clearAll: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  deleteNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: notification && !notification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };
    });
  },

  initialize: () => {
    console.log('[NotificationsStore] Inicializando store de notificações');
    const socket = getSocket();

    if (!socket) {
      console.warn('[NotificationsStore] Socket não está disponível, tentando conectar...');
      const newSocket = connectSocket();
      if (!newSocket) {
        console.error('[NotificationsStore] Não foi possível conectar ao socket');
        return;
      }
      // Se o socket ainda não está conectado, aguardar conexão
      if (!newSocket.connected) {
        newSocket.once('connect', () => {
          console.log('[NotificationsStore] Socket conectado, registrando listeners');
          registerListeners(newSocket);
        });
        return;
      }
      registerListeners(newSocket);
      return;
    }

    // Se já está conectado, registrar listeners imediatamente
    if (socket.connected) {
      registerListeners(socket);
    } else {
      socket.once('connect', () => {
        console.log('[NotificationsStore] Socket conectado, registrando listeners');
        registerListeners(socket);
      });
    }
  },
}));

// Função auxiliar para registrar listeners
function registerListeners(socket: any) {
  // Remover listeners anteriores para evitar duplicação
  socket.off('notification');
  socket.off('debt.created');
  socket.off('debt.updated');
  socket.off('payment.received');
  socket.off('dispute.created');

  console.log('[NotificationsStore] Listeners de eventos registrados');

  socket.on('notification', (data: any) => {
    console.log('[NotificationsStore] Evento notification recebido:', data);
    notificationsStore.getState().addNotification({
      type: data.type,
      subject: data.subject,
      message: data.message,
      timestamp: data.timestamp || new Date().toISOString(),
    });
  });

  socket.on('debt.created', (data: any) => {
    console.log('[NotificationsStore] Evento debt.created recebido:', data);
    notificationsStore.getState().addNotification({
      type: 'debt.created',
      subject: 'Nova Dívida Criada',
      message: data.message || `Nova dívida de ${data.debtorName || data.debtorEmail}`,
      link: `/debts/${data.debtId}`,
      buttonText: 'Ver Dívida',
      timestamp: data.timestamp || new Date().toISOString(),
    });
  });

  socket.on('debt.updated', (data: any) => {
    console.log('[NotificationsStore] Evento debt.updated recebido:', data);
    notificationsStore.getState().addNotification({
      type: 'debt.updated',
      subject: 'Dívida Atualizada',
      message: data.message || 'Uma dívida foi atualizada',
      link: `/debts/${data.debtId}`,
      timestamp: data.timestamp || new Date().toISOString(),
    });
  });

  socket.on('payment.received', (data: any) => {
    console.log('[NotificationsStore] Evento payment.received recebido:', data);
    notificationsStore.getState().addNotification({
      type: 'payment.received',
      subject: 'Pagamento Recebido',
      message: data.message || `Pagamento recebido de ${data.debtorName || data.debtorEmail}`,
      link: `/debts/${data.debtId}`,
      buttonText: 'Ver Dívida',
      timestamp: data.timestamp || new Date().toISOString(),
    });
  });

  socket.on('dispute.created', (data: any) => {
    console.log('[NotificationsStore] Evento dispute.created recebido:', data);
    notificationsStore.getState().addNotification({
      type: 'dispute.created',
      subject: 'Nova Contestação',
      message: data.message || 'Uma dívida foi contestada',
      link: `/debts/${data.debtId}/dispute/${data.disputeId}`,
      buttonText: 'Revisar',
      timestamp: data.timestamp || new Date().toISOString(),
    });
  });
}

