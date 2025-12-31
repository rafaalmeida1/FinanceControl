import { useQuery } from '@tanstack/react-query';
import { disputesService } from '@/services/disputes.service';
import { formatCurrency, formatDateShort } from '@/lib/utils';
import { AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DisputeModal } from './DisputeModal';
import { useState } from 'react';

export function DisputesList() {
  const [selectedDispute, setSelectedDispute] = useState<any>(null);

  const { data: disputes, isLoading } = useQuery({
    queryKey: ['disputes', 'pending'],
    queryFn: () => disputesService.findPending(),
  });

  // Abrir modal automaticamente se disputeId estiver na URL
  useEffect(() => {
    const disputeId = searchParams.get('disputeId');
    if (disputeId && disputes && disputes.length > 0) {
      const dispute = disputes.find((d: any) => d.id === disputeId);
      if (dispute) {
        setSelectedDispute(dispute);
        // Remover parâmetro da URL
        searchParams.delete('disputeId');
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [disputes, searchParams, setSearchParams]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Contestações Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!disputes || disputes.length === 0) {
    return null; // Não mostrar se não houver contestações
  }

  return (
    <>
      <Card className="border-orange-500/50 bg-orange-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Contestações Pendentes
            <Badge variant="destructive" className="ml-2">
              {disputes.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Você tem {disputes.length} contestação(ões) aguardando sua resposta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {disputes.slice(0, 3).map((dispute: any) => (
            <div
              key={dispute.id}
              className="flex items-start justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              onClick={() => setSelectedDispute(dispute)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <p className="font-semibold truncate">
                    {dispute.debt?.description || 'Dívida sem descrição'}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {dispute.reason}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  De: {dispute.debtorEmail} • {formatDateShort(dispute.createdAt)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-4 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDispute(dispute);
                }}
              >
                Ver Detalhes
              </Button>
            </div>
          ))}
          {disputes.length > 3 && (
            <Alert>
              <AlertDescription className="text-sm">
                E mais {disputes.length - 3} contestação(ões). Clique em qualquer uma para ver todas.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {selectedDispute && (
        <DisputeModal
          dispute={selectedDispute}
          open={!!selectedDispute}
          onOpenChange={(open) => !open && setSelectedDispute(null)}
        />
      )}
    </>
  );
}

