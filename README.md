# Finance Control - Frontend

Frontend React do sistema de controle financeiro pessoal.

## 🚀 Tecnologias

- **React 18** - Biblioteca UI
- **TypeScript 5** - Tipagem
- **Vite 5** - Build tool
- **TailwindCSS 3** - Estilização
- **React Router 6** - Roteamento
- **React Query 5** - Gerenciamento de estado servidor
- **Zustand 4** - Gerenciamento de estado cliente
- **React Hook Form** - Formulários
- **Zod** - Validação
- **Axios** - HTTP client
- **Stripe Elements** - Pagamentos Stripe
- **Mercado Pago SDK** - Pagamentos Mercado Pago
- **Recharts** - Gráficos
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

## 📋 Pré-requisitos

- Node.js 20+
- API backend rodando em http://localhost:3000

## ⚙️ Instalação

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env
```

Edite o arquivo `.env` com suas chaves:

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
VITE_MERCADOPAGO_PUBLIC_KEY=your_key
```

## 🏃 Executar

```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

Acesse: http://localhost:5173

## 📁 Estrutura

```
web/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   │   ├── layout/      # Header, Sidebar, Footer
│   │   ├── common/      # Botões, Inputs, Cards
│   │   ├── forms/       # Formulários específicos
│   │   └── payments/    # Componentes de pagamento
│   ├── pages/           # Páginas da aplicação
│   │   ├── public/      # Páginas públicas (Login, etc)
│   │   ├── user/        # Páginas do usuário
│   │   └── admin/       # Páginas do admin
│   ├── hooks/           # Custom hooks
│   ├── services/        # Serviços da API
│   ├── stores/          # Zustand stores
│   ├── lib/             # Utilitários
│   ├── types/           # Tipos TypeScript
│   ├── routes/          # Configuração de rotas
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
└── package.json
```

## 🔐 Autenticação

O sistema implementa:
- Login com email/senha
- Login com Magic Link
- Refresh token automático
- Proteção de rotas por role (USER/ADMIN)
- Persistência de sessão

## 📱 Páginas

### Públicas
- `/login` - Login e registro
- `/auth/magic-link/:token` - Validação de magic link
- `/auth/reset-password/:token` - Reset de senha
- `/debtor/:token` - Visualização de dívida (sem login)

### Usuário
- `/dashboard` - Dashboard com resumo financeiro
- `/debts` - Lista de dívidas
- `/debts/new` - Criar nova dívida
- `/charges` - Lista de cobranças

### Admin
- `/admin` - Dashboard administrativo
- `/admin/metrics` - Métricas do sistema
- `/admin/logs` - Logs de auditoria

## 🎨 Tema

O sistema possui dark mode automático com:
- Paleta de cores customizada
- Componentes estilizados
- Persistência de preferência
- Toggle no header

## 💳 Pagamentos

Integração com:
- **Stripe Elements** - Checkout seguro
- **Mercado Pago Brick** - SDK oficial

Fluxo:
1. Frontend captura dados
2. Envia para backend
3. Backend processa com gateway
4. Retorna client_secret
5. Frontend confirma pagamento

## 🔄 State Management

### Zustand (Cliente)
- `authStore` - Autenticação e usuário
- `uiStore` - Tema e UI

### React Query (Servidor)
- Cache automático
- Retry em falhas
- Invalidação inteligente
- Sincronização

## 📊 Hooks Personalizados

- `useAuth` - Autenticação
- `useDebts` - Gestão de dívidas
- `useCharges` - Gestão de cobranças
- `usePayment` - Processamento de pagamentos
- `useStats` - Estatísticas do usuário

## 🛠️ Scripts

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview do build
npm run lint         # Linter
```

## 🌐 Deploy

### Vercel
```bash
npm run build
# Deploy pasta dist/
```

### Netlify
```bash
npm run build
# Deploy pasta dist/
# Configurar _redirects para SPA
```

### Docker
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📝 Licença

MIT

