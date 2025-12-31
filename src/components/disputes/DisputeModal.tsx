import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { disputesService } from '@/services/disputes.service';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Info,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DisputeModalProps {
  dispute: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DisputeModal({ dispute, open, onOpenChange }: DisputeModalProps) {
  const queryClient = useQueryClient();
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [creditorResponse, setCreditorResponse] = useState('');
  const [selectedChargeIds, setSelectedChargeIds] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const items = (dispute.items as any[]) || [];
  const charges = dispute.debt?.charges || [];

  // Inicializar com todas as cobranças selecionadas
  useEffect(() => {
    if (charges.length > 0 && selectedChargeIds.size === 0) {
      setSelectedChargeIds(new Set(charges.map((c: any) => c.id)));
    }
  }, [charges, selectedChargeIds.size]);

  const approveMutation = useMutation({
    mutationFn: () =>
      disputesService.approve(
        dispute.debtId,
        dispute.id,
        creditorResponse || undefined,
        Array.from(selectedChargeIds),
      ),
    onSuccess: () => {
      toast.success('Contestação aprovada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['charges'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onOpenChange(false);
      setAction(null);
      setCreditorResponse('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao aprovar contestação');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      disputesService.reject(dispute.debtId, dispute.id, creditorResponse),
    onSuccess: () => {
      toast.success('Contestação rejeitada');
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      onOpenChange(false);
      setAction(null);
      setCreditorResponse('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao rejeitar contestação');
    },
  });

  const handleToggleCharge = (chargeId: string) => {
    const newSelected = new Set(selectedChargeIds);
    if (newSelected.has(chargeId)) {
      newSelected.delete(chargeId);
    } else {
      newSelected.add(chargeId);
    }
    setSelectedChargeIds(newSelected);
  };

  const handleApprove = () => {
    if (selectedChargeIds.size === 0) {
      toast.error('Selecione pelo menos uma cobrança para atualizar');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleReject = () => {
    if (!creditorResponse.trim()) {
      toast.error('Por favor, informe o motivo da rejeição');
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmAction = () => {
    setShowConfirmDialog(false);
    if (action === 'approve') {
      approveMutation.mutate();
    } else if (action === 'reject') {
      rejectMutation.mutate();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Contestação de Dívida
            </DialogTitle>
            <DialogDescription>
              Revise os detalhes da contestação e decida se deseja aprovar ou rejeitar
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {/* Informações da Dívida */}
              <div>
                <h3 className="font-semibold mb-3">Dívida Contestada</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Descrição:</span>
                    <span className="font-medium">
                      {dispute.debt?.description || 'Sem descrição'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor Atual:</span>
                    <span className="font-medium">
                      {formatCurrency(dispute.debt?.totalAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Devedor:</span>
                    <span className="font-medium">
                      {dispute.debt?.debtorName || dispute.debtorEmail}
                    </span>
                  </div>
                </div>
              </div>

              {/* Motivo da Contestação */}
              <div>
                <h3 className="font-semibold mb-3">Motivo da Contestação</h3>
                <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-lg">
                  <p className="text-sm">{dispute.reason}</p>
                </div>
              </div>

              {/* Alterações Propostas */}
              {items.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Alterações Propostas</h3>
                  <div className="space-y-2">
                    {items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {item.field === 'amount'
                              ? 'Valor'
                              : item.field === 'description'
                                ? 'Descrição'
                                : item.field === 'dueDate'
                                  ? 'Data de Vencimento'
                                  : item.field}
                          </span>
                          <Badge variant="outline">Novo Valor</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.field === 'amount'
                            ? formatCurrency(item.correctValue)
                            : item.field === 'dueDate'
                              ? formatDateShort(item.correctValue)
                              : item.correctValue}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seleção de Cobranças (apenas se houver alteração de valor) */}
              {items.some((item: any) => item.field === 'amount') && charges.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Cobranças a Atualizar</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedChargeIds.size === charges.length) {
                          setSelectedChargeIds(new Set());
                        } else {
                          setSelectedChargeIds(new Set(charges.map((c: any) => c.id)));
                        }
                      }}
                    >
                      {selectedChargeIds.size === charges.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                    </Button>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Selecione as cobranças</AlertTitle>
                    <AlertDescription className="text-xs">
                      Selecione quais cobranças devem ter seus valores atualizados proporcionalmente.
                      Se nenhuma for selecionada, apenas a dívida será atualizada.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2 mt-3 max-h-60 overflow-y-auto">
                    {charges.map((charge: any) => (
                      <div
                        key={charge.id}
                        className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50"
                      >
                        <Checkbox
                          id={`charge-${charge.id}`}
                          checked={selectedChargeIds.has(charge.id)}
                          onCheckedChange={() => handleToggleCharge(charge.id)}
                        />
                        <label
                          htmlFor={`charge-${charge.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {charge.description || `Parcela ${charge.installmentNumber || ''}`}
                              </p>
                              {charge.installmentNumber && (
                                <p className="text-xs text-muted-foreground">
                                  Parcela {charge.installmentNumber}/{charge.totalInstallments}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(charge.amount)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateShort(charge.dueDate)}
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Resposta do Credor */}
              <div>
                <Label htmlFor="creditor-response">Sua Resposta (Opcional)</Label>
                <Textarea
                  id="creditor-response"
                  placeholder="Adicione uma mensagem explicando sua decisão..."
                  value={creditorResponse}
                  onChange={(e) => setCreditorResponse(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Esta mensagem será enviada por email ao devedor
                </p>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              Cancelar
            </Button>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  setAction('reject');
                  handleReject();
                }}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejeitando...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Rejeitar
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setAction('approve');
                  handleApprove();
                }}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aprovando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aprovar
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === 'approve' ? (
                <>
                  Você está prestes a aprovar esta contestação. A dívida e{' '}
                  {selectedChargeIds.size} cobrança(s) selecionada(s) serão atualizadas.
                  <br />
                  <br />
                  Um email será enviado ao devedor informando sobre a aprovação.
                </>
              ) : (
                <>
                  Você está prestes a rejeitar esta contestação. A dívida não será alterada.
                  <br />
                  <br />
                  Um email será enviado ao devedor informando sobre a rejeição.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>
              {action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

