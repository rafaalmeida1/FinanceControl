import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingDown, TrendingUp, Target, BarChart3, Lightbulb } from 'lucide-react';

export default function Savings() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-primary" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">Economias com IA</h1>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Em Breve
          </Badge>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Uma ferramenta inteligente para ajudá-lo a economizar e gerenciar melhor suas finanças
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Como Funciona */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Nossa IA analisa seus dados financeiros para fornecer insights personalizados e estratégias de economia.
              </p>
              <ul className="space-y-3 list-disc list-inside text-sm text-muted-foreground">
                <li>Análise automática das suas dívidas e receitas</li>
                <li>Identificação de oportunidades de economia</li>
                <li>Sugestões personalizadas baseadas no seu perfil</li>
                <li>Acompanhamento de metas de economia</li>
              </ul>
            </CardContent>
          </Card>

          {/* Funcionalidades */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Funcionalidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Análise de Dívidas</p>
                    <p className="text-sm text-muted-foreground">
                      Identifica padrões nas suas dívidas e sugere estratégias para quitação mais eficiente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Otimização de Receitas</p>
                    <p className="text-sm text-muted-foreground">
                      Analisa seus valores recebidos por mês e sugere formas de maximizar sua economia
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Metas Personalizadas</p>
                    <p className="text-sm text-muted-foreground">
                      Define e acompanha metas de economia baseadas na sua realidade financeira
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dados Analisados */}
        <Card>
          <CardHeader>
            <CardTitle>Dados que Serão Analisados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="font-semibold mb-2">Dívidas</p>
                <p className="text-sm text-muted-foreground">
                  Todas as suas dívidas, valores pendentes e parcelas
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="font-semibold mb-2">Valores Recebidos</p>
                <p className="text-sm text-muted-foreground">
                  Histórico de valores recebidos por mês
                </p>
              </div>
              <div className="p-4 border rounded-lg bg-muted/50">
                <p className="font-semibold mb-2">Valores Pagos</p>
                <p className="text-sm text-muted-foreground">
                  Histórico de valores pagos por mês
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold">Fique Atento!</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Estamos trabalhando para trazer essa funcionalidade em breve. 
                Continue gerenciando suas dívidas e quando estiver disponível, 
                você terá acesso a insights poderosos para melhorar suas finanças.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

