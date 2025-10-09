# 🏠 Executar Aplicação Localmente - 100% Independente

## 📋 Pré-requisitos

- **Node.js** versão 18 ou superior
- **npm** ou **bun** para gerenciar pacotes
- **(Opcional)** API Keys de provedores de IA (OpenAI, Groq, Anthropic, Google)

## 🚀 Instalação e Execução

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd video-talk-explainer
```

### 2. Instalar Dependências

```bash
npm install
# ou
bun install
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
# ou
bun run dev
```

A aplicação estará disponível em: `http://localhost:5173`

### 4. Build para Produção

```bash
npm run build
# ou
bun run build
```

Os arquivos otimizados estarão na pasta `dist/`

## ⚙️ Configuração para Uso Local (Sem Lovable)

### Passo 1: Configurar Armazenamento Local

1. Abra a aplicação em `http://localhost:5173`
2. Vá em **Configurações** (ícone de engrenagem)
3. Na seção **"Modo de Armazenamento"**, selecione:
   - ✅ **Armazenamento Local (Navegador)**

Pronto! Seus dados agora são salvos localmente no navegador.

### Passo 2: Configurar IA (Opcional)

Para usar funcionalidades de IA (análise de vídeo/áudio), configure um provedor:

#### Opção 1: OpenAI (Recomendado)
1. Crie uma conta em https://platform.openai.com/
2. Gere uma API Key em https://platform.openai.com/api-keys
3. Na página de **Configurações** do app:
   - Seção **"Cérebro (IA)"**
   - Selecione **"OpenAI"**
   - Cole sua API Key
   - Clique em **"Testar Conexão"**
   - Clique em **"Salvar"**

#### Opção 2: Groq (Mais Rápido e Gratuito)
1. Crie uma conta em https://console.groq.com/
2. Gere uma API Key
3. Configure conforme acima, selecionando **"Groq"**

#### Opção 3: Anthropic Claude
1. Crie uma conta em https://console.anthropic.com/
2. Gere uma API Key
3. Configure conforme acima, selecionando **"Anthropic Claude"**

#### Opção 4: Google AI (Gemini)
1. Acesse https://ai.google.dev/
2. Gere uma API Key
3. Configure conforme acima, selecionando **"Google AI (Gemini)"**

### Passo 3: Usar a Aplicação

Agora você pode:
- ✅ Criar conversas
- ✅ Adicionar análises
- ✅ Fazer upload de evidências
- ✅ Usar IA para análise (se configurou API)
- ✅ Gerar relatórios
- ✅ Tudo funciona 100% offline (exceto chamadas de IA)

## 💾 Gerenciamento de Dados

### Exportar Backup
1. Configurações → Modo de Armazenamento
2. Clique em **"Exportar Backup"**
3. Arquivo JSON será baixado

### Importar Backup
1. Configurações → Modo de Armazenamento
2. Clique em **"Importar Backup"**
3. Selecione o arquivo JSON

### Limpar Dados
1. Configurações → Modo de Armazenamento
2. Clique em **"Limpar Dados"**
3. Confirme a ação

## 🌐 Executar em Rede Local

Para acessar de outros dispositivos na mesma rede:

```bash
npm run dev -- --host
```

Acesse usando o IP da sua máquina: `http://192.168.x.x:5173`

## 📱 Versão PWA (Progressive Web App)

A aplicação pode ser instalada como um app:

1. Acesse a aplicação no navegador
2. Clique no ícone de instalação (barra de endereços)
3. Confirme a instalação

## 🐳 Docker

Crie um `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
```

Execute:

```bash
docker build -t video-talk-explainer .
docker run -p 5173:5173 video-talk-explainer
```

Ou use Docker Compose (`docker-compose.yml`):

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5173:5173"
    volumes:
      - ./dist:/app/dist
```

```bash
docker-compose up
```

## 🔒 Segurança

- ✅ API Keys são armazenadas localmente no navegador
- ✅ Dados nunca saem do seu dispositivo (modo local)
- ✅ Sem rastreamento ou telemetria
- ⚠️ Faça backups regularmente!

## 💰 Custos

### Modo Local (Gratuito)
- Armazenamento: **Grátis**
- Funcionalidades básicas: **Grátis**

### IA (Pago)
- **OpenAI**: ~$0.002 por análise (GPT-4o-mini)
- **Groq**: Grátis (até 14k requisições/dia)
- **Anthropic**: ~$0.003 por análise (Claude Sonnet)
- **Google AI**: Grátis (até 60 req/min)

## ❓ Solução de Problemas

### Porta já em uso
```bash
npm run dev -- --port 3000
```

### Erro de permissões
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Cache do navegador
Limpe o cache ou use modo anônimo

### API Key não funciona
- Verifique se copiou corretamente
- Confirme se tem créditos (OpenAI/Anthropic)
- Teste a conexão antes de salvar

## 📂 Estrutura de Pastas

```
video-talk-explainer/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── lib/            # Utilitários
│   │   ├── storage.ts  # Sistema de armazenamento
│   │   └── ai-service.ts # Serviço de IA
│   └── main.tsx        # Entrada principal
├── public/             # Arquivos estáticos
├── dist/               # Build de produção
└── package.json        # Dependências
```

## 🎯 Funcionalidades

- ✅ Gerenciamento de conversas
- ✅ Análise de vídeo/áudio com IA
- ✅ Upload de evidências
- ✅ Classificação automática
- ✅ Geração de relatórios
- ✅ Dashboard com métricas
- ✅ Modo escuro/claro
- ✅ 100% offline (exceto IA)

## 📞 Suporte

Para problemas ou dúvidas:
- Abra uma issue no repositório
- Consulte a documentação em `/docs`

---

**Desenvolvido com ❤️ usando React + Vite + TypeScript**

**Licença:** MIT
