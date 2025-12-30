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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface DuplicateDebt {
  id: string;
  description: string;
  totalAmount: number;
  debtorEmail: string;
  creditorEmail: string | null;
  isRecurring: boolean;
  similarityScore: number;
  reason: string;
}

interface DuplicateDebtWarningProps {
  open: boolean;
  duplicates: DuplicateDebt[];
  onResponse: (action: 'create' | 'edit' | 'cancel') => void;
  onOpenChange?: (open: boolean) => void;
}

export function DuplicateDebtWarning({
  open,
  duplicates,
  onResponse,
  onOpenChange,
}: DuplicateDebtWarningProps) {
  if (duplicates.length === 0) return null;

  // const highestScore = duplicates[0]; // Não usado por enquanto

  return (
    <AlertDialog 
      open={open} 
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onResponse('cancel');
        }
        onOpenChange?.(isOpen);
      }}
    >
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Possível Dívida Duplicada
          </AlertDialogTitle>
          <AlertDialogDescription className="pt-4">
            Encontramos {duplicates.length} dívida{duplicates.length > 1 ? 's' : ''} similar{duplicates.length > 1 ? 'es' : ''} à que você está tentando criar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700">
            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              Atenção
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              Verifique se você não está criando uma dívida duplicada. Você pode editar a dívida existente ou continuar criando uma nova.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Dívidas Similares Encontradas:</h4>
            {duplicates.map((duplicate) => (
              <div
                key={duplicate.id}
                className="border rounded-lg p-4 bg-muted/50 hover:bg-muted/70 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{duplicate.description || 'Sem descrição'}</span>
                      {duplicate.isRecurring && (
                        <Badge variant="outline" className="text-xs">
                          Recorrente
                        </Badge>
                      )}
                      <Badge 
                        variant={duplicate.similarityScore >= 80 ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {duplicate.similarityScore.toFixed(0)}% similar
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><span className="font-medium">Devedor:</span> {duplicate.debtorEmail}</p>
                      {duplicate.creditorEmail && (
                        <p><span className="font-medium">Credor:</span> {duplicate.creditorEmail}</p>
                      )}
                      <p><span className="font-medium">Valor:</span> {formatCurrency(duplicate.totalAmount)}</p>
                      <p className="text-xs bg-muted p-2 rounded mt-2">
                        <span className="font-medium">Motivo:</span> {duplicate.reason}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResponse('edit')}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ver/Editar Dívida
                </Button>
              </div>
            ))}
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => onResponse('cancel')}>
            Cancelar
          </AlertDialogCancel>
          {duplicates.length > 0 && (
            <AlertDialogAction
              onClick={() => onResponse('edit')}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
            >
              Editar Dívida Existente
            </AlertDialogAction>
          )}
          <AlertDialogAction
            onClick={() => onResponse('create')}
            className="bg-primary text-primary-foreground"
          >
            Criar Mesmo Assim
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

