# 🏠 Executar Aplicação Localmente

## 📋 Pré-requisitos

- **Node.js** versão 18 ou superior
- **npm** ou **bun** para gerenciar pacotes

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

### 3. Configurar Variáveis de Ambiente (Opcional)

Se você quiser usar o banco de dados remoto (Supabase), crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

**Nota:** Se você não configurar isso, a aplicação funcionará perfeitamente em **modo local** usando o localStorage do navegador.

### 4. Executar em Desenvolvimento

```bash
npm run dev
# ou
bun run dev
```

A aplicação estará disponível em: `http://localhost:5173`

### 5. Build para Produção

```bash
npm run build
# ou
bun run build
```

Os arquivos otimizados estarão na pasta `dist/`

### 6. Preview da Build

```bash
npm run preview
# ou
bun run preview
```

## 💾 Modos de Armazenamento

### Modo Local (Padrão)
- **Vantagens:**
  - 100% offline
  - Não requer configuração
  - Dados salvos no navegador
  - Zero custo
  
- **Desvantagens:**
  - Dados limitados a um navegador
  - Podem ser apagados ao limpar cache
  - Não sincroniza entre dispositivos

### Modo Remoto (Nuvem)
- **Vantagens:**
  - Sincronização entre dispositivos
  - Backup automático
  - Acesso de qualquer lugar
  
- **Desvantagens:**
  - Requer conexão com internet
  - Necessita configuração do Supabase

## 🔧 Mudando o Modo de Armazenamento

1. Acesse a página de **Configurações** no aplicativo
2. Na seção "Modo de Armazenamento", escolha:
   - **Banco de Dados Remoto (Nuvem)** - Requer Supabase configurado
   - **Armazenamento Local (Navegador)** - Funciona offline

## 📦 Backup dos Dados Locais

Se você está usando o modo local:

1. Vá em **Configurações** → **Modo de Armazenamento**
2. Clique em **"Exportar Backup"** para baixar seus dados
3. Use **"Importar Backup"** para restaurar dados salvos

## 🌐 Executar em Rede Local

Para acessar de outros dispositivos na mesma rede:

```bash
npm run dev -- --host
```

Acesse usando o IP da sua máquina: `http://192.168.x.x:5173`

## 📱 Versão PWA (Progressive Web App)

A aplicação pode ser instalada como um app no seu dispositivo:

1. Acesse a aplicação no navegador
2. Clique no ícone de instalação (geralmente na barra de endereços)
3. Confirme a instalação

Agora você pode usar como um aplicativo nativo!

## 🐳 Docker (Opcional)

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

## ❓ Solução de Problemas

### Porta já em uso
```bash
npm run dev -- --port 3000
```

### Erro de permissões
```bash
sudo npm install -g npm@latest
```

### Cache do navegador
Limpe o cache ou use modo anônimo para testar

## 📞 Suporte

Para problemas ou dúvidas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ usando React + Vite + TypeScript**
