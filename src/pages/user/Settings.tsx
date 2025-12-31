import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Loader2 } from 'lucide-react';
import { authStore } from '@/stores/authStore';
import { usersService } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { paymentsService } from '@/services/payments.service';
import { PixKeysTab } from '@/components/settings/PixKeysTab';

const profileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;


export default function Settings() {
  const { user, setUser } = authStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mercadoPagoConnected, setMercadoPagoConnected] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  
  // Estados para senha OTP
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

  // Verificar parâmetros de query após redirect do OAuth
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');

    if (connected === 'true') {
      // Recarregar status de conexão
      const reloadStatus = async () => {
        try {
          const mpStatus = await paymentsService.getMercadoPagoConnectionStatus();
          setMercadoPagoConnected(mpStatus.connected);
        } catch (error) {
          console.error('Erro ao recarregar status:', error);
        }
      };
      reloadStatus();
      
      // Limpar parâmetros da URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('connected');
      setSearchParams(newParams, { replace: true });
    } else if (error) {
      // Limpar parâmetros da URL após mostrar erro
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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

  const onSubmitPassword = async () => {
    // Validações
    if (currentPassword.length !== 6) {
      toast.error('Senha atual deve ter 6 dígitos');
      return;
    }
    if (newPassword.length !== 6) {
      toast.error('Nova senha deve ter 6 dígitos');
      return;
    }
    if (confirmPassword.length !== 6) {
      toast.error('Confirmação deve ter 6 dígitos');
      return;
    }
    if (!/^\d+$/.test(currentPassword) || !/^\d+$/.test(newPassword) || !/^\d+$/.test(confirmPassword)) {
      toast.error('As senhas devem conter apenas números');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoadingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword, confirmPassword);
      toast.success('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar senha');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setLoadingPassword(false);
    }
  };


  const connectMercadoPago = async () => {
    try {
      const { authUrl } = await paymentsService.getMercadoPagoAuthUrl();
      // Usar window.location.href para redirecionar na mesma aba
      // O Mercado Pago redirecionará de volta para /settings/callback/mercadopago
      window.location.href = authUrl;
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
          </TabsList>
        </div>
        
        {/* Desktop: Grid Tabs */}
        <div className="hidden md:block">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="seguranca">Segurança</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
            <TabsTrigger value="pix">Chaves PIX</TabsTrigger>
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
            <form onSubmit={(e) => { e.preventDefault(); onSubmitPassword(); }}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-center block">Senha Atual (OTP)</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      disabled={loadingPassword}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-center block">Nova Senha (OTP)</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={newPassword}
                      onChange={setNewPassword}
                      disabled={loadingPassword}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-center block">Confirmar Nova Senha (OTP)</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      disabled={loadingPassword}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loadingPassword || currentPassword.length !== 6 || newPassword.length !== 6 || confirmPassword.length !== 6}>
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

      </Tabs>
    </div>
  );
}

