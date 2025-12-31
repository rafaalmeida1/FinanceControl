// Wallet transactions removed - using Transaction model now
type WalletTransaction = any;
import { formatCurrency, formatDate } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight, Calendar, User, Mail, CreditCard, FileText } from 'lucide-react';

interface StatementDetailModalProps {
  transaction: WalletTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatementDetailModal({ transaction, open, onOpenChange }: StatementDetailModalProps) {
  // Wallet transactions removed - using transaction data directly
  const data = transaction;
  const isLoading = false;

  const getTransactionIcon = (type: string) => {
    if (type === 'INCOME') {
      return <ArrowDownRight className="h-5 w-5 text-green-600" />;
    }
    return <ArrowUpRight className="h-5 w-5 text-red-600" />;
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      CHARGE_PAID: 'Cobrança Paga',
      CHARGE_CREATED: 'Cobrança Criada',
      DEBT_CREATED: 'Dívida Criada',
      MANUAL_ADJUSTMENT: 'Ajuste Manual',
      RECURRING_CHARGE: 'Cobrança Recorrente',
    };
    return labels[source] || source;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTransactionIcon(data.type)}
            Detalhes da Transação
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre esta transação
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
            <div className="space-y-6">
              {/* Valor e Tipo */}
              <div className="flex items-center justify-between p-4 bg-accent rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Valor da Transação</p>
                  <p
                    className={`text-3xl font-bold ${
                      data.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {data.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(data.amount)}
                  </p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {getSourceLabel(data.source)}
                </Badge>
              </div>

              {/* Saldos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Saldo Anterior</p>
                  <p className="text-xl font-semibold">{formatCurrency(data.previousBalance)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
                  <p className="text-xl font-semibold">{formatCurrency(data.newBalance)}</p>
                </div>
              </div>

              <Separator />

              {/* Informações Básicas */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Data e Hora</p>
                    <p className="font-medium">{formatDate(data.createdAt)}</p>
                  </div>
                  {data.wallet && (
                    <div>
                      <p className="text-muted-foreground">Carteira</p>
                      <p className="font-medium flex items-center gap-1">
                        {data.wallet.icon && <span>{data.wallet.icon}</span>}
                        {data.wallet.name}
                      </p>
                    </div>
                  )}
                  {data.description && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Descrição</p>
                      <p className="font-medium">{data.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações da Dívida */}
              {data.debt && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Informações da Dívida
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">ID da Dívida</p>
                        <p className="font-medium font-mono text-xs">{data.debt.id}</p>
                      </div>
                      {data.debt.description && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Descrição</p>
                          <p className="font-medium">{data.debt.description}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Valor Total</p>
                        <p className="font-medium">{formatCurrency(data.debt.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="outline">{data.debt.status}</Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Informações da Cobrança */}
              {data.charge && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Informações da Cobrança
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">ID da Cobrança</p>
                        <p className="font-medium font-mono text-xs">{data.charge.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-medium">{formatCurrency(data.charge.amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Vencimento</p>
                        <p className="font-medium">{formatDate(data.charge.dueDate)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="outline">{data.charge.status}</Badge>
                      </div>
                      {data.charge.description && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Descrição</p>
                          <p className="font-medium">{data.charge.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Informações do Pagamento */}
              {data.payment && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Informações do Pagamento
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Método</p>
                        <p className="font-medium">{data.payment.method}</p>
                      </div>
                      {data.payment.gateway && (
                        <div>
                          <p className="text-muted-foreground">Gateway</p>
                          <p className="font-medium">{data.payment.gateway}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge variant="outline">{data.payment.status}</Badge>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Informações do Devedor/Credor */}
              {(data.debtorEmail || data.creditorEmail || data.debtorName || data.creditorName) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Informações das Partes
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {data.debtorName && (
                        <div>
                          <p className="text-muted-foreground">Devedor</p>
                          <p className="font-medium">{data.debtorName}</p>
                        </div>
                      )}
                      {data.debtorEmail && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email do Devedor
                          </p>
                          <p className="font-medium">{data.debtorEmail}</p>
                        </div>
                      )}
                      {data.creditorName && (
                        <div>
                          <p className="text-muted-foreground">Credor</p>
                          <p className="font-medium">{data.creditorName}</p>
                        </div>
                      )}
                      {data.creditorEmail && (
                        <div>
                          <p className="text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            Email do Credor
                          </p>
                          <p className="font-medium">{data.creditorEmail}</p>
                        </div>
                      )}
                      {data.isPersonalDebt !== undefined && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Tipo de Dívida</p>
                          <Badge variant="outline">
                            {data.isPersonalDebt ? 'Dívida Pessoal' : 'Dívida de Terceiro'}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Informações da Chave PIX */}
              {data.pixKey && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Chave PIX
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tipo</p>
                        <p className="font-medium">{data.pixKey.keyType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Valor</p>
                        <p className="font-medium">{data.pixKey.keyValue}</p>
                      </div>
                      {data.pixKey.label && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Label</p>
                          <p className="font-medium">{data.pixKey.label}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

