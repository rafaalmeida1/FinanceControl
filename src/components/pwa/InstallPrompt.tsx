import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Zap, Shield, Bell } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export function InstallPrompt() {
  const { canInstall, isIOS, install, dismiss } = usePwaInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Mostrar prompt após 3 segundos se puder instalar
    if (canInstall) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [canInstall]);

  if (!canInstall || !showPrompt) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      const success = await install();
      if (success) {
        setShowPrompt(false);
      }
    }
  };

  const handleDismiss = () => {
    dismiss();
    setShowPrompt(false);
  };

  const benefits = [
    {
      icon: Zap,
      title: 'Acesso Rápido',
      description: 'Abra direto do seu celular, sem precisar entrar no navegador',
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Receba alertas importantes sobre suas finanças',
    },
    {
      icon: Shield,
      title: 'Mais Seguro',
      description: 'Funciona offline e com dados protegidos',
    },
    {
      icon: Smartphone,
      title: 'Como App Nativo',
      description: 'Experiência completa, como se fosse um app instalado',
    },
  ];

  return (
    <>
      {/* Banner de Instalação */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
        <Card className="max-w-md mx-auto shadow-2xl border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 pointer-events-auto animate-in slide-in-from-bottom-4">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Instalar Finance Control
                </CardTitle>
                <CardDescription className="mt-1">
                  Tenha acesso rápido e fácil no seu celular
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Benefícios */}
            <div className="grid grid-cols-2 gap-2">
              {benefits.slice(0, 2).map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                    <Icon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                className="flex-1"
                size="lg"
              >
                <Download className="mr-2 h-4 w-4" />
                {isIOS ? 'Ver Instruções' : 'Instalar Agora'}
              </Button>
              <Button
                variant="outline"
                onClick={handleDismiss}
                size="lg"
              >
                Agora Não
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instruções para iOS */}
      <Sheet open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle>Como Instalar no iPhone</SheetTitle>
            <SheetDescription>
              Siga estes passos simples para instalar o Finance Control
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Toque no botão Compartilhar</h3>
                  <p className="text-sm text-muted-foreground">
                    Na parte inferior da tela, toque no ícone de compartilhar
                    <span className="inline-block ml-1">📤</span>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Selecione "Adicionar à Tela de Início"</h3>
                  <p className="text-sm text-muted-foreground">
                    Role para baixo e encontre a opção "Adicionar à Tela de Início"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Confirme a Instalação</h3>
                  <p className="text-sm text-muted-foreground">
                    Toque em "Adicionar" no canto superior direito
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Pronto!</h3>
                  <p className="text-sm text-muted-foreground">
                    O app aparecerá na sua tela inicial. Toque para abrir!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>💡 Dica:</strong> Depois de instalar, você pode acessar o Finance Control
                direto da tela inicial, sem precisar abrir o navegador!
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-900 dark:text-green-100">
                <strong>✨ Benefícios:</strong> Após instalar, você terá acesso rápido direto da tela inicial,
                notificações push, e funcionamento offline!
              </p>
            </div>

            <Button
              onClick={() => {
                setShowIOSInstructions(false);
                handleDismiss();
              }}
              className="w-full"
              size="lg"
            >
              Entendi, Obrigado!
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

