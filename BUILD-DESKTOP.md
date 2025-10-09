# Guia para Gerar o Executável Desktop

Desenvolvido por **Alex Correa Gomes**

## Requisitos
- Node.js instalado (versão 18 ou superior)
- Git instalado

## Passos para Gerar o Executável

### 1. Baixar o Projeto
```bash
git clone [URL_DO_SEU_REPOSITORIO]
cd [NOME_DA_PASTA]
```

### 2. Configurar o package.json

Abra o arquivo `package.json` e adicione/modifique as seguintes linhas:

**No início do arquivo, adicione:**
```json
"main": "electron.js",
"author": "Alex Correa Gomes",
"description": "Análise Inteligente de Vídeos com IA",
```

**Na seção "scripts", adicione:**
```json
"electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && NODE_ENV=development electron .\"",
"electron:build": "npm run build && electron-builder",
"electron:build:win": "npm run build && electron-builder --win",
"electron:build:mac": "npm run build && electron-builder --mac",
"electron:build:linux": "npm run build && electron-builder --linux"
```

O arquivo deve ficar assim:
```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "main": "electron.js",
  "author": "Alex Correa Gomes",
  "description": "Análise Inteligente de Vídeos com IA",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:8080 && NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder",
    "electron:build:win": "npm run build && electron-builder --win",
    "electron:build:mac": "npm run build && electron-builder --mac",
    "electron:build:linux": "npm run build && electron-builder --linux"
  },
  "dependencies": {
    ...resto das dependências...
  }
}
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Gerar o Executável

#### Para Windows (.exe):
```bash
npm run electron:build:win
```
O arquivo `.exe` será criado na pasta `release/`

#### Para Mac (.dmg):
```bash
npm run electron:build:mac
```
O arquivo `.dmg` será criado na pasta `release/`

#### Para Linux (.AppImage):
```bash
npm run electron:build:linux
```
O arquivo `.AppImage` será criado na pasta `release/`

### 5. Testar em Modo Desenvolvimento (Opcional)
Se quiser testar antes de gerar o executável:
```bash
npm run electron:dev
```

## Localização dos Arquivos

Após o build, os executáveis estarão em:
- **Windows**: `release/Video Analyzer Setup 1.0.0.exe`
- **Mac**: `release/Video Analyzer-1.0.0.dmg`
- **Linux**: `release/Video Analyzer-1.0.0.AppImage`

## Instalação do Executável

### Windows:
1. Execute o arquivo `Video Analyzer Setup 1.0.0.exe`
2. Siga o assistente de instalação
3. Um ícone será criado na área de trabalho
4. Pronto! Não precisa de mais nada instalado

### Mac:
1. Abra o arquivo `.dmg`
2. Arraste o app para a pasta Aplicativos
3. Execute normalmente

### Linux:
1. Dê permissão de execução: `chmod +x Video\ Analyzer-1.0.0.AppImage`
2. Execute: `./Video\ Analyzer-1.0.0.AppImage`

## Observações Importantes

- ✅ O primeiro build pode demorar 5-10 minutos
- ✅ O executável incluirá tudo necessário para rodar
- ✅ Não precisa instalar Node.js no computador que vai usar o app
- ✅ O app NÃO funcionará 100% offline (precisa de internet para as funções de IA)
- ✅ Você pode distribuir o executável para outras pessoas

## Tamanho do Executável

- Windows: ~150-200 MB
- Mac: ~200-250 MB  
- Linux: ~150-200 MB

## Problemas Comuns

### Erro ao compilar no Windows:
- Instale o Visual Studio Build Tools
- Ou use: `npm install --global windows-build-tools`

### Erro ao compilar no Mac:
- Certifique-se que o Xcode está instalado
- Execute: `xcode-select --install`

## Suporte

Desenvolvedor: **Alex Correa Gomes**

---

## Alternativa: Usar Diretamente do GitHub

Se não quiser gerar o executável, você pode:
1. Fazer "Publish" no Lovable
2. Acessar pelo navegador
3. Criar um atalho na área de trabalho para o link
