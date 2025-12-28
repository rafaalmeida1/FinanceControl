import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Send } from 'lucide-react';
import { debtsService } from '@/services/debts.service';
import { formatCurrency, formatDateShort } from '@/lib/utils';

export default function CompiledDebts() {
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const { data: compiledDebts, isLoading } = useQuery({
    queryKey: ['compiled-debts'],
    queryFn: () => debtsService.getCompiledByPix(),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async ({ debtorEmail, pixKeyId }: { debtorEmail: string; pixKeyId?: string }) => {
      return debtsService.sendCompiledEmail(debtorEmail, pixKeyId);
    },
    onSuccess: () => {
      toast.success('Email compilado enviado com sucesso!');
      setSendingEmail(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao enviar email');
      setSendingEmail(null);
    },
  });

  const handleSendEmail = (debtorEmail: string, pixKeyId?: string) => {
    setSendingEmail(debtorEmail);
    sendEmailMutation.mutate({ debtorEmail, pixKeyId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dívidas Compiladas por PIX</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e envie emails compilados agrupados por chave PIX
        </p>
      </div>

      {compiledDebts && compiledDebts.length > 0 ? (
        <div className="space-y-4">
          {compiledDebts.map((group: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{group.debtorName || group.debtorEmail}</CardTitle>
                    <CardDescription>
                      {group.debtorEmail}
                      {group.pixKey && (
                        <span className="ml-2">
                          • PIX: {group.pixKey.keyType} - {group.pixKey.keyValue}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-lg font-bold">
                    {formatCurrency(group.totalAmount)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  {group.debts.map((debt: any) => (
                    <div
                      key={debt.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{debt.description || 'Sem descrição'}</p>
                        <p className="text-sm text-muted-foreground">
                          {debt.dueDate ? formatDateShort(debt.dueDate) : 'Sem vencimento'}
                        </p>
                      </div>
                      <p className="font-bold">{formatCurrency(debt.totalAmount)}</p>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => handleSendEmail(group.debtorEmail, group.pixKeyId)}
                  disabled={sendingEmail === group.debtorEmail}
                  className="w-full"
                >
                  {sendingEmail === group.debtorEmail ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Email Compilado
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma dívida para compilar</h3>
            <p className="text-muted-foreground">
              Não há dívidas pendentes agrupadas por chave PIX
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

