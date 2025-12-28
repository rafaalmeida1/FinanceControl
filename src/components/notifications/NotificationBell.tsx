import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { notificationsStore, Notification } from '@/stores/notificationsStore';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

export function NotificationBell() {
  // Usar selector para garantir reatividade
  const notifications = notificationsStore((state) => state.notifications);
  const unreadCount = notificationsStore((state) => state.unreadCount);
  const markAsRead = notificationsStore((state) => state.markAsRead);
  const markAllAsRead = notificationsStore((state) => state.markAllAsRead);
  
  const navigate = useNavigate();
  const [newNotificationIds, setNewNotificationIds] = useState<Set<string>>(new Set());
  const prevNotificationIdsRef = useRef<Set<string>>(new Set());

  // Detectar novas notificações para animação
  useEffect(() => {
    const currentIds = new Set(notifications.map((n) => n.id));
    const prevIds = prevNotificationIdsRef.current;
    
    // Encontrar IDs novos (que não estavam antes)
    const newIds = Array.from(currentIds).filter((id) => !prevIds.has(id));
    
    if (newIds.length > 0) {
      newIds.forEach((id) => {
        const notif = notifications.find((n) => n.id === id);
        if (notif && !notif.read) {
          setNewNotificationIds((prev) => new Set([...prev, id]));
          // Remover após animação (1.5s)
          setTimeout(() => {
            setNewNotificationIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, 1500);
        }
      });
    }
    
    // Atualizar referência
    prevNotificationIdsRef.current = currentIds;
  }, [notifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                "animate-in zoom-in-50 duration-300"
              )}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel>Notificações</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          ) : (
            notifications.map((notification) => {
              const isNew = newNotificationIds.has(notification.id);
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 cursor-pointer transition-all duration-300",
                    !notification.read ? 'bg-muted' : '',
                    isNew && "animate-in fade-in duration-500"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                <div className="flex items-start justify-between w-full gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{notification.subject}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-1 flex-shrink-0 animate-pulse" />
                  )}
                </div>
                {notification.buttonText && notification.link && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationClick(notification);
                    }}
                  >
                    {notification.buttonText}
                  </Button>
                )}
              </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

