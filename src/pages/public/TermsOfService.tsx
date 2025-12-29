import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Termos de Uso</h1>
            <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p>
                Ao acessar e usar o Finance Control, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso.
                Se você não concorda com alguma parte destes termos, não deve usar nosso serviço.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Descrição do Serviço</h2>
              <p>
                O Finance Control é uma plataforma de controle financeiro que permite aos usuários gerenciar dívidas,
                cobranças e pagamentos. O serviço inclui integração com o Mercado Pago para processamento de pagamentos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Integração com Mercado Pago</h2>
              <p>
                Ao usar os recursos de pagamento do Mercado Pago através do Finance Control, você também concorda com os
                <a href="https://www.mercadopago.com.br/developers/pt/docs/checkout-api/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  Termos e Condições do Mercado Pago
                </a>.
                O Finance Control atua como intermediário e não é responsável pelas transações processadas pelo Mercado Pago.
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Você é responsável por manter suas credenciais do Mercado Pago seguras</li>
                <li>O Finance Control não armazena informações de cartão de crédito</li>
                <li>Disputas relacionadas a pagamentos devem ser resolvidas diretamente com o Mercado Pago</li>
                <li>Taxas e comissões do Mercado Pago são de responsabilidade do usuário</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Conta de Usuário</h2>
              <p>
                Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Fornecer informações precisas e atualizadas</li>
                <li>Manter a segurança de sua conta</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
                <li>Ser responsável por todas as atividades que ocorrem em sua conta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Uso Aceitável</h2>
              <p>Você concorda em não usar o serviço para:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Atividades ilegais ou fraudulentas</li>
                <li>Enviar spam ou conteúdo malicioso</li>
                <li>Violar direitos de propriedade intelectual</li>
                <li>Interferir no funcionamento do serviço</li>
                <li>Acessar contas de outros usuários sem autorização</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Privacidade</h2>
              <p>
                Seu uso do serviço também é regido por nossa{' '}
                <Link to="/privacy-policy" className="text-primary hover:underline">
                  Política de Privacidade
                </Link>.
                Ao usar o serviço, você concorda com a coleta e uso de informações conforme descrito na política.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Limitação de Responsabilidade</h2>
              <p>
                O Finance Control é fornecido "como está" sem garantias de qualquer tipo. Não nos responsabilizamos por:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Perdas financeiras resultantes do uso do serviço</li>
                <li>Interrupções ou indisponibilidade do serviço</li>
                <li>Problemas com transações do Mercado Pago</li>
                <li>Dados perdidos ou corrompidos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Modificações dos Termos</h2>
              <p>
                Reservamos o direito de modificar estes termos a qualquer momento. Alterações significativas serão
                comunicadas aos usuários. O uso continuado do serviço após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Rescisão</h2>
              <p>
                Podemos encerrar ou suspender sua conta imediatamente, sem aviso prévio, por violação destes termos.
                Você também pode encerrar sua conta a qualquer momento.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contato</h2>
              <p>
                Se você tiver dúvidas sobre estes termos, entre em contato conosco através do email de suporte.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t">
            <Link to="/login" className="text-primary hover:underline">
              ← Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

