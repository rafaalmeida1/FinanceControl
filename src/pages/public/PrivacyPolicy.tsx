import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="card">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>
            <p className="text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Informações que Coletamos</h2>
              <p>Coletamos as seguintes informações quando você usa o Finance Control:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Informações de Conta:</strong> nome, email, senha (criptografada)</li>
                <li><strong>Dados Financeiros:</strong> dívidas, cobranças, pagamentos e transações</li>
                <li><strong>Informações de Uso:</strong> logs de acesso, preferências e configurações</li>
                <li><strong>Dados de Integração:</strong> tokens de acesso do Mercado Pago (quando você conecta sua conta)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Como Usamos suas Informações</h2>
              <p>Usamos suas informações para:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Fornecer e melhorar nossos serviços</li>
                <li>Processar transações e pagamentos</li>
                <li>Enviar notificações e lembretes</li>
                <li>Manter a segurança da plataforma</li>
                <li>Cumprir obrigações legais</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Compartilhamento de Informações</h2>
              <p>Não vendemos suas informações pessoais. Compartilhamos dados apenas com:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li><strong>Mercado Pago:</strong> para processar pagamentos (conforme seus termos de privacidade)</li>
                <li><strong>Provedores de Serviços:</strong> para hospedagem, email e análise (sob contratos de confidencialidade)</li>
                <li><strong>Autoridades Legais:</strong> quando exigido por lei ou ordem judicial</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Segurança dos Dados</h2>
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Criptografia de dados em trânsito (HTTPS/TLS)</li>
                <li>Senhas armazenadas com hash bcrypt</li>
                <li>Tokens de acesso seguros</li>
                <li>Acesso restrito a dados sensíveis</li>
                <li>Backups regulares e seguros</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Seus Direitos</h2>
              <p>Você tem o direito de:</p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir informações incorretas</li>
                <li>Solicitar exclusão de dados</li>
                <li>Exportar seus dados</li>
                <li>Revogar consentimento</li>
                <li>Optar por não receber comunicações de marketing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Cookies e Tecnologias Similares</h2>
              <p>
                Usamos cookies e tecnologias similares para melhorar sua experiência, analisar o uso do serviço
                e personalizar conteúdo. Você pode gerenciar preferências de cookies nas configurações do navegador.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Retenção de Dados</h2>
              <p>
                Mantemos suas informações enquanto sua conta estiver ativa ou conforme necessário para fornecer serviços.
                Após encerrar sua conta, podemos reter dados por períodos necessários para cumprir obrigações legais.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Privacidade de Menores</h2>
              <p>
                O Finance Control não é destinado a menores de 18 anos. Não coletamos intencionalmente informações
                de menores. Se descobrirmos que coletamos dados de um menor, tomaremos medidas para excluir essas informações.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Alterações nesta Política</h2>
              <p>
                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por email
                ou através do serviço. O uso continuado após as alterações constitui aceitação da nova política.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Contato</h2>
              <p>
                Para questões sobre privacidade ou exercer seus direitos, entre em contato conosco através do email de suporte.
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

