import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { debtorAccessService } from '@/services/debtor-access.service';

export default function DisputeCompiledDebts() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const debtIdsParam = searchParams.get('debtIds');

  const [debts, setDebts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDebtIds, setSelectedDebtIds] = useState<string[]>([]);

  useEffect(() => {
    const loadDebts = async () => {
      if (!token && !debtIdsParam) {
        toast.error('Token ou IDs de dívidas são necessários');
        return;
      }

      try {
        // Se temos debtIds, buscar cada dívida individualmente
        if (debtIdsParam) {
          const ids = debtIdsParam.split(',').filter(id => id.trim());
          const debtsData = [];
          
          for (const debtId of ids) {
            try {
              // Tentar buscar via token se disponível
              if (token) {
                const { debt } = await debtorAccessService.getDebt(token);
                if (debt.id === debtId) {
                  debtsData.push(debt);
                }
              }
            } catch (error) {
              console.error(`Erro ao buscar dívida ${debtId}:`, error);
            }
          }
          
          setDebts(debtsData);
        } else if (token) {
          // Se só temos token, buscar a dívida associada
          const { debt } = await debtorAccessService.getDebt(token);
          setDebts([debt]);
          setSelectedDebtIds([debt.id]);
        }
      } catch (error: any) {
        toast.error('Erro ao carregar dívidas. Verifique se o link está correto.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadDebts();
  }, [token, debtIdsParam]);

  const toggleDebtSelection = (debtId: string) => {
    setSelectedDebtIds(prev => {
      if (prev.includes(debtId)) {
        return prev.filter(id => id !== debtId);
      } else {
        return [...prev, debtId];
      }
    });
  };

  const handleDisputeSelected = () => {
    if (selectedDebtIds.length === 0) {
      toast.error('Selecione pelo menos uma dívida para contestar');
      return;
    }

    if (selectedDebtIds.length === 1) {
      // Se apenas uma dívida selecionada, redirecionar para página de contestação única
      navigate(`/debtor/${selectedDebtIds[0]}/dispute?email=${encodeURIComponent(email || '')}&token=${token || ''}`);
    } else {
      // Se múltiplas dívidas, redirecionar para contestação compilada
      navigate(`/debts/dispute/compiled?debtIds=${selectedDebtIds.join(',')}&email=${encodeURIComponent(email || '')}&token=${token || ''}`);
    }
  };

  const handleDisputeSingle = (debtId: string) => {
    navigate(`/debtor/${debtId}/dispute?email=${encodeURIComponent(email || '')}&token=${token || ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Nenhuma dívida encontrada</CardTitle>
            <CardDescription>
              Não foi possível carregar as dívidas. Verifique se o link está correto.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contestar Dívidas</CardTitle>
            <CardDescription>
              Selecione as dívidas que deseja contestar. Você pode contestar uma ou múltiplas dívidas de uma vez.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription className="mt-2">
                Se alguma informação das dívidas abaixo estiver incorreta, você pode contestá-las.
                Selecione as dívidas que deseja contestar e clique em "Contestar Selecionadas".
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {debts.map((debt) => (
                <Card
                  key={debt.id}
                  className={`cursor-pointer transition-all ${
                    selectedDebtIds.includes(debt.id)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => toggleDebtSelection(debt.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={selectedDebtIds.includes(debt.id)}
                            onChange={() => toggleDebtSelection(debt.id)}
                            className="h-4 w-4"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <h3 className="font-semibold text-lg">
                            {debt.description || 'Dívida sem descrição'}
                          </h3>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground ml-6">
                          <p><strong>Valor:</strong> R$ {typeof debt.totalAmount === 'number' ? debt.totalAmount.toFixed(2) : debt.totalAmount}</p>
                          <p><strong>Vencimento:</strong> {debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('pt-BR') : 'Não informado'}</p>
                          <p><strong>Credor:</strong> {debt.user?.name || debt.creditorName || debt.user?.email || debt.creditorEmail || 'Não informado'}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDisputeSingle(debt.id);
                        }}
                      >
                        Contestar Individual
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedDebtIds.length > 0 && (
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={handleDisputeSelected}
                  className="flex-1"
                >
                  Contestar {selectedDebtIds.length} Dívida{selectedDebtIds.length > 1 ? 's' : ''} Selecionada{selectedDebtIds.length > 1 ? 's' : ''}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedDebtIds([])}
                >
                  Limpar Seleção
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

