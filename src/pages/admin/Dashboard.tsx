import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { getSocket } from '@/lib/socket';
import { Users, FileText, CreditCard, DollarSign, Activity, Eye, EyeOff, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  level?: string;
  resourceType?: string;
  resourceId?: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  responseStatus?: number;
  responseTime?: number;
  timestamp: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [showValues, setShowValues] = useState(false);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminService.getStats,
  });

  const { data: initialLogs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs({ limit: 100 }),
  });

  // Inicializar logs
  useEffect(() => {
    if (initialLogs) {
      setAuditLogs(initialLogs);
    }
  }, [initialLogs]);

  // WebSocket para logs em tempo real
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewLog = (log: AuditLog) => {
      setAuditLogs((prev) => [log, ...prev].slice(0, 500)); // Manter últimos 500
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    };

    socket.on('admin.audit-log', handleNewLog);

    return () => {
      socket.off('admin.audit-log', handleNewLog);
    };
  }, [queryClient]);

  // Filtrar logs
  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        log.action?.toLowerCase().includes(search) ||
        log.description?.toLowerCase().includes(search) ||
        log.userEmail?.toLowerCase().includes(search) ||
        log.userName?.toLowerCase().includes(search) ||
        log.resourceType?.toLowerCase().includes(search) ||
        log.requestPath?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'ERROR':
      case 'CRITICAL':
        return 'destructive';
      case 'WARNING':
        return 'default';
      case 'INFO':
      default:
        return 'secondary';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN') || action.includes('REGISTER')) return '🔐';
    if (action.includes('CREATE')) return '➕';
    if (action.includes('UPDATE')) return '✏️';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('PAYMENT')) return '💳';
    if (action.includes('CHARGE')) return '📋';
    return '📝';
  };

  if (isLoadingStats || isLoadingLogs) {
    return <div className="text-center py-12">Carregando...</div>;
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema em tempo real</p>
      </div>

      {/* Estatísticas */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.users.active || 0} ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dívidas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.debts.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobranças</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.charges.total || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.charges.pending || 0} pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.financialVolume || 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Logs de Auditoria em Tempo Real */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Logs de Auditoria em Tempo Real
              </CardTitle>
              <CardDescription>
                Acompanhe todas as ações dos usuários em tempo real
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowValues(!showValues)}
              >
                {showValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-4">
            <Input
              placeholder="Buscar por ação, usuário, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="REGISTER">Registro</SelectItem>
                <SelectItem value="DEBT_CREATED">Dívida Criada</SelectItem>
                <SelectItem value="CHARGE_CREATED">Cobrança Criada</SelectItem>
                <SelectItem value="PAYMENT_PROCESSED">Pagamento Processado</SelectItem>
                <SelectItem value="PIX_KEY_CREATED">Chave PIX Criada</SelectItem>
                <SelectItem value="WALLET_CREATED">Carteira Criada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Aviso</SelectItem>
                <SelectItem value="ERROR">Erro</SelectItem>
                <SelectItem value="CRITICAL">Crítico</SelectItem>
              </SelectContent>
            </Select>
            {(filterAction !== 'all' || filterLevel !== 'all' || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterAction('all');
                  setFilterLevel('all');
                  setSearchTerm('');
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>

          {/* Lista de Logs */}
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum log encontrado
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'p-4 rounded-lg border transition-all',
                      'hover:bg-accent/50',
                      log.level === 'ERROR' || log.level === 'CRITICAL'
                        ? 'border-destructive/50 bg-destructive/5'
                        : log.level === 'WARNING'
                        ? 'border-yellow-500/50 bg-yellow-500/5'
                        : 'border-border'
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{getActionIcon(log.action)}</span>
                          <Badge variant={getLevelColor(log.level)} className="text-xs">
                            {log.level || 'INFO'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {log.action}
                          </Badge>
                          {log.resourceType && (
                            <Badge variant="secondary" className="text-xs">
                              {log.resourceType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">{log.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {log.user && (
                            <span>
                              👤 {log.user.name || log.user.email}
                            </span>
                          )}
                          {log.requestMethod && log.requestPath && (
                            <span>
                              🌐 {log.requestMethod} {log.requestPath}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span>📍 {log.ipAddress}</span>
                          )}
                          {log.responseTime && (
                            <span>⏱️ {log.responseTime}ms</span>
                          )}
                          <span>🕐 {formatDateShort(new Date(log.timestamp || log.createdAt))}</span>
                        </div>
                        {showValues && log.metadata && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs font-mono overflow-x-auto">
                            <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                      {log.responseStatus && (
                        <Badge
                          variant={
                            log.responseStatus >= 500
                              ? 'destructive'
                              : log.responseStatus >= 400
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {log.responseStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
