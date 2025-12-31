import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UsePullToRefreshOptions {
  onRefresh?: () => void | Promise<void>;
  threshold?: number; // Distância mínima para ativar o refresh (em pixels)
  enabled?: boolean; // Se o pull-to-refresh está habilitado
}

export function usePullToRefresh(options: UsePullToRefreshOptions = {}) {
  const {
    onRefresh,
    threshold = 80,
    enabled = true,
  } = options;

  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Só ativar se estiver no topo da página
      if (window.scrollY > 10) return;

      const touch = e.touches[0];
      startY.current = touch.clientY;
      currentY.current = touch.clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current === null) return;

      const touch = e.touches[0];
      currentY.current = touch.clientY;

      // Só permitir pull se estiver no topo
      if (window.scrollY > 10) {
        startY.current = null;
        setPullDistance(0);
        return;
      }

      const distance = touch.clientY - startY.current;

      // Só permitir pull para baixo (valores positivos)
      if (distance > 0 && distance < threshold * 2) {
        // Prevenir scroll padrão quando puxando para baixo (apenas se estiver no topo)
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5)); // Limitar a distância máxima
      } else if (distance <= 0) {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = async () => {
      if (startY.current === null || currentY.current === null) return;

      const distance = currentY.current - startY.current;

      if (distance >= threshold && window.scrollY <= 10) {
        setIsRefreshing(true);
        setPullDistance(0);

        try {
          // Invalidar todas as queries principais
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['stats'] }),
            queryClient.invalidateQueries({ queryKey: ['financial'] }),
            queryClient.invalidateQueries({ queryKey: ['wallets'] }),
            queryClient.invalidateQueries({ queryKey: ['debts'] }),
            queryClient.invalidateQueries({ queryKey: ['charges'] }),
            queryClient.invalidateQueries({ queryKey: ['compiled-debts'] }),
          ]);

          // Chamar callback personalizado se fornecido
          if (onRefresh) {
            await onRefresh();
          }
        } catch (error) {
          console.error('Erro ao atualizar dados:', error);
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }

      startY.current = null;
      currentY.current = null;
    };

    // Adicionar listeners apenas em dispositivos touch
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [enabled, threshold, onRefresh, queryClient]);

  return {
    isRefreshing,
    pullDistance,
    pullProgress: Math.min(pullDistance / threshold, 1), // 0 a 1
  };
}

