import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
// Wallet transactions removed - using Transaction model now
type WalletTransaction = any;
const TransactionType = { INCOME: 'INCOME', EXPENSE: 'EXPENSE' };
const TransactionSource = { 
  SALARY: 'SALARY', 
  DEBT_PAYMENT: 'DEBT_PAYMENT', 
  DEBT_RECEIVED: 'DEBT_RECEIVED',
  CHARGE_PAID: 'CHARGE_PAID',
  CHARGE_CREATED: 'CHARGE_CREATED',
  DEBT_CREATED: 'DEBT_CREATED',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
  RECURRING_CHARGE: 'RECURRING_CHARGE',
};
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Eye, Filter, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { StatementDetailModal } from '@/components/statement/StatementDetailModal';

export default function Statement() {
  const [selectedWalletId, setSelectedWalletId] = useState<string | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedTransaction, setSelectedTransaction] = useState<WalletTransaction | null>(null);
  const [page, setPage] = useState(0);
  const limit = 50;

  // Buscar carteiras
  // Wallet system removed
  const wallets: any[] = [];

  // Buscar extrato
  const { data: statement, isLoading: isLoadingStatement } = useQuery({
    queryKey: ['wallet-transactions', selectedWalletId, selectedType, startDate, endDate, page],
    queryFn: () =>
      walletTransactionsService.getStatement({
        walletId: selectedWalletId,
        type: selectedType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        limit,
        offset: page * limit,
      }),
    enabled: true,
  });

  const getTransactionIcon = (type: string) => {
    if (type === TransactionType.INCOME) {
      return <ArrowDownRight className="h-5 w-5 text-green-600" />;
    }
    return <ArrowUpRight className="h-5 w-5 text-red-600" />;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      [TransactionSource.CHARGE_PAID]: 'Cobrança Paga',
      [TransactionSource.CHARGE_CREATED]: 'Cobrança Criada',
      [TransactionSource.DEBT_CREATED]: 'Dívida Criada',
      [TransactionSource.MANUAL_ADJUSTMENT]: 'Ajuste Manual',
      [TransactionSource.RECURRING_CHARGE]: 'Cobrança Recorrente',
    };
    return labels[source] || source;
  };

  const totalIncome = statement?.transactions
    .filter((t: any) => t.type === TransactionType.INCOME)
    .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

  const totalExpense = statement?.transactions
    .filter((t: any) => t.type === TransactionType.EXPENSE)
    .reduce((sum: number, t: any) => sum + t.amount, 0) || 0;

  const balance = totalIncome - totalExpense;

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Extrato Bancário</h1>
          <p className="text-muted-foreground mt-1">
            Histórico completo de todas as transações da sua carteira
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="wallet">Carteira</Label>
              <Select
                value={selectedWalletId || 'all'}
                onValueChange={(value) => setSelectedWalletId(value === 'all' ? undefined : value)}
              >
                <SelectTrigger id="wallet">
                  <SelectValue placeholder="Todas as carteiras" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as carteiras</SelectItem>
                  {wallets?.map((wallet: any) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <div className="flex items-center gap-2">
                        {wallet.icon && <span>{wallet.icon}</span>}
                        <span>{wallet.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={selectedType || 'all'}
                onValueChange={(value) => setSelectedType(value === 'all' ? undefined : (value as TransactionType))}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value={TransactionType.INCOME}>Entradas</SelectItem>
                  <SelectItem value={TransactionType.EXPENSE}>Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Entradas</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Saídas</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>
            {statement?.total || 0} transação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingStatement ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : statement?.transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma transação encontrada</p>
            </div>
          ) : (
            <div className="space-y-2">
              {statement?.transactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedTransaction(transaction)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">{getTransactionIcon(transaction.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">
                          {transaction.description || getSourceLabel(transaction.source)}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {getSourceLabel(transaction.source)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatDateShort(transaction.createdAt)}</span>
                        {transaction.wallet && (
                          <span className="flex items-center gap-1">
                            {transaction.wallet.icon && <span>{transaction.wallet.icon}</span>}
                            {transaction.wallet.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          transaction.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === TransactionType.INCOME ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: {formatCurrency(transaction.newBalance)}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTransaction(transaction);
                    }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginação */}
          {statement && statement.total > limit && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {page * limit + 1} a {Math.min((page + 1) * limit, statement.total)} de {statement.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * limit >= statement.total}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedTransaction && (
        <StatementDetailModal
          transaction={selectedTransaction}
          open={!!selectedTransaction}
          onOpenChange={(open) => !open && setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}

