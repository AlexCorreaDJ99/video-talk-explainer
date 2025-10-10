# Deploy no Vercel

## Passo a passo para hospedar este projeto no Vercel

### 1. Preparar o Repositório
- Certifique-se de que seu código está em um repositório Git (GitHub, GitLab ou Bitbucket)
- Faça commit de todas as alterações

### 2. Criar Projeto no Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "Add New Project"
3. Importe seu repositório Git
4. O Vercel detectará automaticamente que é um projeto Vite

### 3. Configurar Variáveis de Ambiente
No painel de configurações do projeto no Vercel, adicione as seguintes variáveis de ambiente:

```
VITE_SUPABASE_URL=https://esnlohxzxebqpregyaan.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzbmxvaHh6eGVicXByZWd5YWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNzE3ODksImV4cCI6MjA3NDk0Nzc4OX0.R0nvVKFYf3L9WpXDGhIw9wfg65lpW-zddjZtbGxbdaI
VITE_SUPABASE_PROJECT_ID=esnlohxzxebqpregyaan
```

**Importante**: Estas variáveis já estão configuradas no arquivo `.env` do projeto, mas você precisa adicioná-las manualmente no Vercel.

### 4. Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Seu projeto estará disponível em uma URL do Vercel (ex: seu-projeto.vercel.app)

### 5. Configurar Domínio Customizado (Opcional)
1. No painel do Vercel, vá em "Settings" > "Domains"
2. Adicione seu domínio customizado
3. Configure os registros DNS conforme instruído

## O que funciona automaticamente:
- ✅ Build do projeto React/Vite
- ✅ Roteamento SPA (single-page application)
- ✅ Conexão com Supabase (edge functions, database, storage)
- ✅ Todas as funcionalidades de IA (Groq, OpenAI, Gemini)
- ✅ Upload e análise de arquivos

## Troubleshooting

### Erro de build
Se o build falhar, verifique:
- Se todas as dependências estão no `package.json`
- Se as variáveis de ambiente foram configuradas corretamente

### Páginas em branco ou erro 404
- Verifique se o `vercel.json` está configurado corretamente
- Certifique-se de que a rota de fallback está funcionando

### Edge functions não funcionam
- As edge functions do Supabase são hospedadas no Supabase, não no Vercel
- Certifique-se de que as variáveis de ambiente estão corretas
- Verifique se os secrets do Supabase (LOVABLE_API_KEY, OPENAI_API_KEY) estão configurados

## Suporte
Para mais informações sobre deploy no Vercel, consulte:
- [Documentação oficial do Vercel](https://vercel.com/docs)
- [Deploy Vite no Vercel](https://vercel.com/docs/frameworks/vite)
