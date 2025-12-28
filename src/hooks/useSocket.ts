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
          queryClient.invalidateQueries({ queryKey: ['stats'] }); // Dashboard usa ['stats']
          break;
        case 'charges':
          queryClient.invalidateQueries({ queryKey: ['charges'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] }); // Dashboard usa ['stats']
          break;
        case 'stats':
          queryClient.invalidateQueries({ queryKey: ['stats'] });
          break;
        case 'all':
        default:
          // Invalidar todas as queries relevantes (dashboard usa ['stats'])
          queryClient.invalidateQueries({ queryKey: ['debts'] });
          queryClient.invalidateQueries({ queryKey: ['charges'] });
          queryClient.invalidateQueries({ queryKey: ['stats'] }); // Dashboard será atualizado aqui
          queryClient.invalidateQueries({ queryKey: ['compiled-debts'] });
          break;
      }
    };

    socket.on('data.updated', handleDataUpdated);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('data.updated', handleDataUpdated);
    };
  }, [user, queryClient]);
}

