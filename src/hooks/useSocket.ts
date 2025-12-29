import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { notificationsStore } from '@/stores/notificationsStore';
import { authStore } from '@/stores/authStore';

let initialized = false;

export function useSocket() {
  const queryClient = useQueryClient();
  const { user } = authStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      initializedRef.current = false;
      initialized = false;
      return;
    }

    // Conectar socket
    const socket = connectSocket();

    if (!socket) {
      console.warn('[useSocket] Socket não está disponível');
      return;
    }

    // Inicializar store de notificações quando o socket conectar
    const handleConnect = () => {
      console.log('[useSocket] Socket conectado, inicializando notificações');
      if (!initialized && !initializedRef.current) {
        notificationsStore.getState().initialize();
        initialized = true;
        initializedRef.current = true;
      }
    };

    // Se já estiver conectado, inicializar imediatamente
    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }

    // Escutar eventos de atualização de dados
    const handleDataUpdated = (data: { type: string; timestamp: string }) => {
      console.log('[useSocket] Evento data.updated recebido:', data);
      // Invalidar queries baseado no tipo de atualização
      switch (data.type) {
        case 'debts':
          queryClient.invalidateQueries({ queryKey: ['debts'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          break;
        case 'charges':
          queryClient.invalidateQueries({ queryKey: ['charges'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          break;
        case 'stats':
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          break;
        case 'all':
        default:
          // Invalidar todas as queries relevantes
          queryClient.invalidateQueries({ queryKey: ['debts'] });
          queryClient.invalidateQueries({ queryKey: ['charges'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          queryClient.invalidateQueries({ queryKey: ['compiled-debts'] });
          break;
      }
    };

    // Escutar evento de dívida criada
    const handleDebtCreated = (data: {
      debtId: string;
      debtorEmail: string;
      debtorName?: string;
      totalAmount: number;
      description?: string;
      timestamp: string;
      message: string;
    }) => {
      console.log('[useSocket] Evento debt.created recebido:', data);
      // Invalidar todas as queries relacionadas a dívidas
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['debt', data.debtId] });
    };

    // Escutar evento de pagamento recebido
    const handlePaymentReceived = (data: {
      debtId: string;
      chargeIds: string[];
      totalAmount: number;
      chargesCount: number;
      debtorEmail: string;
      debtorName?: string;
      timestamp: string;
      message: string;
    }) => {
      console.log('[useSocket] Evento payment.received recebido:', data);
      // Invalidar todas as queries relacionadas a pagamentos e dívidas
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['debt', data.debtId] });
      // Invalidar queries específicas das charges
      data.chargeIds.forEach((chargeId) => {
        queryClient.invalidateQueries({ queryKey: ['charge', chargeId] });
      });
    };

    socket.on('data.updated', handleDataUpdated);
    socket.on('debt.created', handleDebtCreated);
    socket.on('payment.received', handlePaymentReceived);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('data.updated', handleDataUpdated);
      socket.off('debt.created', handleDebtCreated);
      socket.off('payment.received', handlePaymentReceived);
    };
  }, [user, queryClient]);
}

