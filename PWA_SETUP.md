# Configuração PWA - Finance Control

## ✅ O que já está configurado

1. **Manifest.json** - Configurado com todas as informações necessárias
2. **Service Worker** - Gerado automaticamente pelo vite-plugin-pwa
3. **Componente de Instalação** - Prompt elegante para iOS e Android
4. **Meta Tags** - Configuradas no index.html

## 📱 Próximos Passos

### 1. Criar Ícones PWA

Você precisa criar os seguintes ícones e colocar na pasta `web/public/`:

- `pwa-192x192.png` - Ícone 192x192 pixels
- `pwa-512x512.png` - Ícone 512x512 pixels

**Recomendações:**
- Use um ícone com fundo sólido (preferencialmente verde #10b981)
- O ícone deve ser simples e reconhecível
- Teste em diferentes tamanhos para garantir legibilidade

**Ferramentas para criar ícones:**
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- Design tools: Figma, Canva, Photoshop

### 2. Testar Instalação

#### Android (Chrome):
1. Acesse o site no Chrome
2. O prompt de instalação aparecerá automaticamente
3. Ou use o menu do Chrome → "Adicionar à tela inicial"

#### iOS (Safari):
1. Acesse o site no Safari
2. Toque no botão de compartilhar
3. Selecione "Adicionar à Tela de Início"

### 3. Verificar Funcionamento

Após criar os ícones e fazer o build:

```bash
cd web
npm run build
npm run preview
```

Acesse `http://localhost:4173` e verifique:
- ✅ O prompt de instalação aparece
- ✅ O ícone aparece corretamente
- ✅ O app funciona offline (após primeira visita)
- ✅ As notificações funcionam (se configuradas)

## 🎨 Personalização

### Cores do Tema
Edite `web/vite.config.ts`:
```typescript
theme_color: '#10b981', // Cor da barra de status
background_color: '#ffffff', // Cor de fundo do splash screen
```

### Nome do App
Edite `web/vite.config.ts`:
```typescript
name: 'Finance Control',
short_name: 'Finance Control',
```

## 📝 Notas Importantes

1. **HTTPS Obrigatório**: PWAs só funcionam em HTTPS (ou localhost)
2. **Service Worker**: É gerado automaticamente no build
3. **Atualizações**: O app atualiza automaticamente quando há nova versão
4. **Offline**: Funciona offline após primeira visita (cache)

## 🐛 Troubleshooting

### Prompt não aparece
- Verifique se está em HTTPS (ou localhost)
- Limpe o cache do navegador
- Verifique se já não está instalado

### Ícone não aparece
- Verifique se os arquivos estão em `web/public/`
- Verifique se os nomes estão corretos
- Faça um novo build após adicionar os ícones

### Service Worker não funciona
- Verifique o console do navegador
- Certifique-se de que está em HTTPS
- Limpe o cache e recarregue

