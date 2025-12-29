import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Loader2 } from 'lucide-react';
import { authStore } from '@/stores/authStore';
import { usersService, NotificationPreferences } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { paymentsService } from '@/services/payments.service';
import { PixKeysTab } from '@/components/settings/PixKeysTab';

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Settings() {
  const { user, setUser } = authStore();
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    paymentReminders: true,
    overdueNotifications: true,
    monthlySummary: false,
    debtCreated: true,
    disputeNotifications: true,
    paymentConfirmationRequest: true,
  });

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Carregar preferências de notificação ao montar componente
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const prefs = await usersService.getNotificationPreferences();
        setNotificationPrefs(prefs);
      } catch (error) {
        console.error('Erro ao carregar preferências:', error);
      }
    };
    loadNotificationPreferences();
  }, []);

  // Carregar status de conexão de pagamento
  useEffect(() => {
    const loadPaymentStatus = async () => {
      try {
        // Mercado Pago
        const mpStatus = await paymentsService.getMercadoPagoConnectionStatus();
        setMercadoPagoConnected(mpStatus.connected);
      } catch (error) {
        console.error('Erro ao carregar status de pagamento:', error);
      }
    };
    
    loadPaymentStatus();
  }, []);

  const onSubmitProfile = async (data: ProfileFormData) => {
    setLoadingProfile(true);
    try {
      const updatedUser = await usersService.updateProfile({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });
      setUser(updatedUser);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setLoadingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setLoadingPassword(true);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Senha atualizada com sucesso!');
      resetPassword();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar senha');
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleSaveNotificationPreferences = async () => {
    setLoadingNotifications(true);
    try {
      const updated = await usersService.updateNotificationPreferences(notificationPrefs);
      setNotificationPrefs(updated);
      toast.success('Preferências salvas com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao salvar preferências');
    } finally {
      setLoadingNotifications(false);
    }
  };

  const connectMercadoPago = async () => {
    try {
      const { authUrl } = await paymentsService.getMercadoPagoAuthUrl();
      window.open(authUrl, '_blank', 'noopener,noreferrer');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao conectar Mercado Pago. Verifique se MERCADOPAGO_CLIENT_ID está configurado.');
    }
  };

  const disconnectMercadoPago = async () => {
    try {
      await paymentsService.disconnectMercadoPago();
      setMercadoPagoConnected(false);
      toast.success('Mercado Pago desconectado');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao desconectar Mercado Pago');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-4 overflow-x-hidden">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">Gerencie suas preferências e conta</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-4">
        {/* Mobile: Horizontal Scrollable Tabs */}
        <div className="md:hidden overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="perfil" className="whitespace-nowrap flex-shrink-0">Perfil</TabsTrigger>
            <TabsTrigger value="seguranca" className="whitespace-nowrap flex-shrink-0">Segurança</TabsTrigger>
            <TabsTrigger value="pagamentos" className="whitespace-nowrap flex-shrink-0">Pagamentos</TabsTrigger>
            <TabsTrigger value="pix" className="whitespace-nowrap flex-shrink-0">Chaves PIX</TabsTrigger>
            <TabsTrigger value="notificacoes" className="whitespace-nowrap flex-shrink-0">Notificações</TabsTrigger>
          </TabsList>
        </div>
        
        {/* Desktop: Grid Tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="pix">Chaves PIX</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
          </TabsList>
        </div>

        {/* Aba: Perfil */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize suas informações de perfil</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitProfile(onSubmitProfile)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" {...registerProfile('name')} />
                  {profileErrors.name && (
                    <p className="text-sm text-destructive">{profileErrors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...registerProfile('email')} />
                  {profileErrors.email && (
                    <p className="text-sm text-destructive">{profileErrors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (opcional)</Label>
                  <Input id="phone" placeholder="(11) 98765-4321" {...registerProfile('phone')} />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loadingProfile}>
                  {loadingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Aba: Segurança */}
        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Mantenha sua conta segura</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmitPassword(onSubmitPassword)}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...registerPassword('currentPassword')}
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.currentPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input id="newPassword" type="password" {...registerPassword('newPassword')} />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...registerPassword('confirmPassword')}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loadingPassword}>
                  {loadingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Senha'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Aba: Pagamentos */}
        <TabsContent value="pagamentos">
          <div className="space-y-4">
            {/* Mercado Pago */}
            <Card>
              <CardHeader>
                <CardTitle>Mercado Pago</CardTitle>
                <CardDescription>Receba pagamentos via PIX, cartão e boleto</CardDescription>
              </CardHeader>
              <CardContent>
                {!mercadoPagoConnected ? (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Conecte sua conta</AlertTitle>
                      <AlertDescription>
                        Autorize o Finance Control a processar pagamentos em sua conta do Mercado
                        Pago
                      </AlertDescription>
                    </Alert>
                    <div className="flex flex-col gap-3">
                      <Button size="lg" onClick={connectMercadoPago} className="w-full">
                        Conectar Mercado Pago
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href="https://www.mercadopago.com.br/hub/registration/landing"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Não tem conta? Criar agora →
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="success">Conectado</Badge>
                      <span className="text-sm text-muted-foreground">Conta ativa</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={disconnectMercadoPago}
                    >
                      Desconectar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Aba: Chaves PIX */}
        <TabsContent value="pix">
          <PixKeysTab />
        </TabsContent>

        {/* Aba: Notificações */}
        <TabsContent value="notificacoes">
          <div className="space-y-4">
            {/* Preferências de Notificação */}
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>Configure quando receber emails</CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Lembretes de Pagamento</Label>
                  <p className="text-sm text-muted-foreground">D-5, D-2 e no dia do vencimento</p>
                </div>
                <Switch
                  checked={notificationPrefs.paymentReminders}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, paymentReminders: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificações de Atraso</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando houver pagamentos atrasados
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.overdueNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, overdueNotifications: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Resumo Mensal</Label>
                  <p className="text-sm text-muted-foreground">Relatório de atividades do mês</p>
                </div>
                <Switch
                  checked={notificationPrefs.monthlySummary}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, monthlySummary: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nova Dívida Criada</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando uma nova dívida for registrada
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.debtCreated}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, debtCreated: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Contestações</Label>
                  <p className="text-sm text-muted-foreground">
                    Quando houver contestações de dívidas
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.disputeNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, disputeNotifications: checked })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Confirmação de Pagamento</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber email quando pagamento for confirmado pelo credor
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.paymentConfirmationRequest}
                  onCheckedChange={(checked) =>
                    setNotificationPrefs({ ...notificationPrefs, paymentConfirmationRequest: checked })
                  }
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotificationPreferences} disabled={loadingNotifications}>
                {loadingNotifications ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Preferências'
                )}
              </Button>
            </CardFooter>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

