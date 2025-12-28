import { create } from 'zustand';
import { connectSocket } from '@/lib/socket';

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

export const notificationsStore = create<NotificationsState>((set, get) => ({
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
    const socket = connectSocket();

    socket.on('notification', (data: any) => {
      get().addNotification({
        type: data.type,
        subject: data.subject,
        message: data.message,
        timestamp: data.timestamp,
      });
    });

    socket.on('debt.created', (data: any) => {
      get().addNotification({
        type: 'debt.created',
        subject: 'Nova Dívida Criada',
        message: data.message,
        link: `/debts/${data.debtId}`,
        buttonText: 'Ver Dívida',
        timestamp: data.timestamp,
      });
    });

    socket.on('debt.updated', (data: any) => {
      get().addNotification({
        type: 'debt.updated',
        subject: 'Dívida Atualizada',
        message: data.message,
        link: `/debts/${data.debtId}`,
        timestamp: data.timestamp,
      });
    });

    socket.on('payment.received', (data: any) => {
      get().addNotification({
        type: 'payment.received',
        subject: 'Pagamento Recebido',
        message: data.message,
        link: `/payments/${data.paymentId}`,
        timestamp: data.timestamp,
      });
    });

    socket.on('dispute.created', (data: any) => {
      get().addNotification({
        type: 'dispute.created',
        subject: 'Nova Contestação',
        message: data.message,
        link: `/debts/${data.debtId}/dispute/${data.disputeId}`,
        buttonText: 'Revisar',
        timestamp: data.timestamp,
      });
    });
  },
}));

