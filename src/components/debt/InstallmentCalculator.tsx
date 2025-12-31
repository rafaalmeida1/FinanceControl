import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Calculator } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface InstallmentCalculatorProps {
  // Modo de entrada: 'total' ou 'installment'
  inputMode: 'total' | 'installment';
  onInputModeChange: (mode: 'total' | 'installment') => void;
  
  // Valores
  totalAmount: number | string;
  installmentAmount: number | string;
  installments: number;
  
  // Callbacks
  onTotalAmountChange: (value: number | string) => void;
  onInstallmentAmountChange: (value: number | string) => void;
  onInstallmentsChange: (value: number) => void;
  
  // Dívida em andamento
  isInProgress: boolean;
  onInProgressChange: (value: boolean) => void;
  paidInstallments: number;
  onPaidInstallmentsChange: (value: number) => void;
  
  // Tipo de dívida (opcional, para desabilitar parcelas quando for único)
  debtType?: 'single' | 'installment' | 'recurring' | null;
}

export function InstallmentCalculator({
  inputMode,
  onInputModeChange,
  totalAmount,
  installmentAmount,
  installments,
  onTotalAmountChange,
  onInstallmentAmountChange,
  onInstallmentsChange,
  isInProgress,
  onInProgressChange,
  paidInstallments,
  onPaidInstallmentsChange,
  debtType,
}: InstallmentCalculatorProps) {
  // Calcular valores automaticamente baseado no modo de entrada
  useEffect(() => {
    if (inputMode === 'total' && totalAmount && installments > 0) {
      const total = parseFloat(String(totalAmount));
      const perInstallment = total / installments;
      onInstallmentAmountChange(perInstallment.toFixed(2));
    } else if (inputMode === 'installment' && installmentAmount && installments > 0) {
      const perInstallment = parseFloat(String(installmentAmount));
      const total = perInstallment * installments;
      onTotalAmountChange(total.toFixed(2));
    }
  }, [inputMode, totalAmount, installmentAmount, installments, onTotalAmountChange, onInstallmentAmountChange]);

  // Calcular valores restantes
  const totalAmountNum = parseFloat(String(totalAmount)) || 0;
  const installmentAmountNum = parseFloat(String(installmentAmount)) || 0;
  const installmentsNum = installments || 1;
  const paidInstallmentsNum = paidInstallments || 0;

  const remainingInstallments = Math.max(0, installmentsNum - paidInstallmentsNum);
  const remainingAmount = Math.max(0, totalAmountNum - (installmentAmountNum * paidInstallmentsNum));
  const paidAmount = installmentAmountNum * paidInstallmentsNum;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Valores e Parcelas
        </CardTitle>
        <CardDescription>
          Informe o valor total ou o valor por parcela. O sistema calculará automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modo de entrada - Ocultar se for único */}
        {debtType !== 'single' && debtType !== 'recurring' && (
          <div className="space-y-2">
            <Label>Como deseja informar o valor?</Label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={inputMode === 'total'}
                  onChange={() => onInputModeChange('total')}
                  className="w-4 h-4"
                />
                <span>Valor Total</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  checked={inputMode === 'installment'}
                  onChange={() => onInputModeChange('installment')}
                  className="w-4 h-4"
                />
                <span>Valor por Parcela</span>
              </label>
            </div>
          </div>
        )}

        {/* Valor Total - Mostrar apenas se modo for 'total' ou se for único/recorrente */}
        {(inputMode === 'total' || debtType === 'single' || debtType === 'recurring') && (
          <div>
            <Label htmlFor="totalAmount">Valor Total <span className="text-destructive">*</span></Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                min="0.01"
                className="pl-8"
                placeholder="1000.00"
                value={totalAmount}
                onChange={(e) => onTotalAmountChange(e.target.value)}
              />
            </div>
            {totalAmountNum > 0 && installmentsNum > 1 && (
              <p className="text-sm text-muted-foreground mt-1">
                Valor por parcela: {formatCurrency(installmentAmountNum)}
              </p>
            )}
          </div>
        )}

        {/* Valor da Parcela - Mostrar apenas se modo for 'installment' */}
        {inputMode === 'installment' && debtType !== 'single' && debtType !== 'recurring' && (
          <div>
            <Label htmlFor="installmentAmount">Valor da Parcela <span className="text-destructive">*</span></Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="installmentAmount"
                type="number"
                step="0.01"
                min="0.01"
                className="pl-8"
                placeholder="100.00"
                value={installmentAmount}
                onChange={(e) => onInstallmentAmountChange(e.target.value)}
              />
            </div>
            {installmentAmountNum > 0 && installmentsNum > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Valor total: {formatCurrency(totalAmountNum)}
              </p>
            )}
          </div>
        )}

        {/* Número de Parcelas - Ocultar se for único ou recorrente */}
        {debtType !== 'single' && debtType !== 'recurring' && (
          <div>
            <Label htmlFor="installments">Número de Parcelas <span className="text-destructive">*</span></Label>
            <Input
              id="installments"
              type="number"
              min="1"
              className="mt-2"
              placeholder="1"
              value={installments}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                onInstallmentsChange(value);
              }}
            />
          </div>
        )}

        {/* Dívida em Andamento - Ocultar se for único ou recorrente */}
        {debtType !== 'single' && debtType !== 'recurring' && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex-1 min-w-0 pr-4">
                <Label>Movimentação já está em andamento?</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Marque se algumas parcelas já foram pagas
                </p>
              </div>
              <Switch
                checked={isInProgress}
                onCheckedChange={onInProgressChange}
              />
            </div>

          {isInProgress && (
            <div className="space-y-4 p-4 bg-muted/30 border rounded-lg">
              <div>
                <Label htmlFor="paidInstallments">Parcelas já pagas <span className="text-destructive">*</span></Label>
                <Input
                  id="paidInstallments"
                  type="number"
                  min="0"
                  max={installmentsNum}
                  className="mt-2"
                  placeholder="0"
                  value={paidInstallments}
                  onChange={(e) => onPaidInstallmentsChange(Math.min(parseInt(e.target.value) || 0, installmentsNum))}
                />
                {paidInstallmentsNum > installmentsNum && (
                  <p className="text-sm text-destructive mt-1">
                    O número de parcelas pagas não pode ser maior que o total de parcelas
                  </p>
                )}
              </div>

              {/* Resumo do cálculo */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total da movimentação:</span>
                      <p className="font-semibold">{formatCurrency(totalAmountNum)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor já pago:</span>
                      <p className="font-semibold text-green-600">{formatCurrency(paidAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor restante:</span>
                      <p className="font-semibold text-primary">{formatCurrency(remainingAmount)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Parcelas restantes:</span>
                      <p className="font-semibold">{remainingInstallments}</p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

