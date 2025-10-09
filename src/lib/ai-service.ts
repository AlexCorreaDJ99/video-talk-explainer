// Serviço de IA com Roteamento Inteligente - Desenvolvido por Alex Correa Gomes
import { supabase } from "@/integrations/supabase/client";
import { getStorageMode } from "./storage";
import {
  getProviderForContent,
  getMultiAIConfig,
  type ContentType,
  type ProviderConfig,
  type AIProvider,
} from "./ai-config";

// COMPATIBILIDADE: Manter interface antiga para não quebrar código existente
interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
}

const AI_CONFIG_KEY = "ai-config";

// DEPRECATED: Usar getMultiAIConfig() da ai-config.ts
export const getAIConfig = (): AIConfig => {
  const config = localStorage.getItem(AI_CONFIG_KEY);
  if (!config) {
    return { provider: "lovable" };
  }
  return JSON.parse(config);
};

// DEPRECATED: Usar updateProvider() da ai-config.ts
export const setAIConfig = (config: AIConfig) => {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
};

// NOVO: Escolher automaticamente qual IA usar baseado no tipo de conteúdo
const selectAIForContent = (contentType: ContentType): ProviderConfig | null => {
  console.log(`[AI Router] Selecionando IA para tipo: ${contentType}`);
  
  const provider = getProviderForContent(contentType);
  
  if (provider) {
    console.log(`[AI Router] ✓ Selecionado: ${provider.provider} (modelo: ${provider.model || "padrão"})`);
  } else {
    console.warn(`[AI Router] ⚠️ Nenhum provedor disponível para ${contentType}`);
  }
  
  return provider;
};

// Analisar vídeo/áudio - COM ROTEAMENTO INTELIGENTE
export const analyzeVideo = async (data: {
  transcricao: string;
  tipo: string;
}) => {
  const storageMode = getStorageMode();
  
  // Determinar tipo de conteúdo
  let contentType: ContentType = "texto";
  if (data.tipo.includes("vídeo")) contentType = "video";
  else if (data.tipo.includes("áudio")) contentType = "audio";
  else if (data.tipo.includes("imagem")) contentType = "imagem";
  
  console.log(`[analyzeVideo] Tipo de conteúdo: ${contentType}, Modo: ${storageMode}`);
  
  // Selecionar IA apropriada
  const provider = selectAIForContent(contentType);
  
  if (!provider) {
    return {
      data: null,
      error: { message: "❌ Nenhuma IA configurada para este tipo de conteúdo. Configure em Configurações." },
    };
  }
  
  // Se estiver em modo remoto e usar Lovable AI, retornar erro para usar edge function
  if (storageMode === "remote" && provider.provider === "lovable") {
    return {
      data: null,
      error: { message: "Use a edge function diretamente para Lovable AI em modo remoto" },
    };
  }

  console.log(`[analyzeVideo] Usando ${provider.provider} para análise`);

  // Modo local ou API externa configurada
  return await callExternalAI({
    prompt: `Você é um assistente especializado em análise de conteúdo.
Analise a seguinte transcrição de ${data.tipo} e retorne APENAS um JSON válido (sem markdown, sem explicações) com esta estrutura exata:

{
  "urgencia": "baixa|media|alta|critica",
  "categoria": "tecnico|financeiro|atendimento|operacional|outro",
  "sentimento": "positivo|neutro|negativo|frustrado",
  "resumo_curto": "resumo em até 150 caracteres",
  "contexto": "descrição detalhada do contexto",
  "problemas": ["problema 1", "problema 2"],
  "topicos": ["tópico 1", "tópico 2"],
  "insights": ["insight 1", "insight 2"]
}

Transcrição a analisar:
${data.transcricao}`,
    config: {
      provider: provider.provider,
      apiKey: provider.apiKey,
      model: provider.model,
    },
  });
};

// Analisar evidências - COM ROTEAMENTO INTELIGENTE
export const analyzeEvidence = async (data: {
  conversation_id: string;
  evidencias: Array<{ tipo: string; conteudo: string; nome_arquivo?: string }>;
}) => {
  const storageMode = getStorageMode();
  
  // Detectar tipo de evidências (se tem imagens, usar IA com suporte a visão)
  const hasImages = data.evidencias.some(e => e.tipo.includes("imagem") || e.tipo.includes("screenshot"));
  const contentType: ContentType = hasImages ? "imagem" : "texto";
  
  console.log(`[analyzeEvidence] Tipo de conteúdo: ${contentType}, Has images: ${hasImages}`);
  
  const provider = selectAIForContent(contentType);
  
  if (!provider) {
    return {
      data: null,
      error: { message: "❌ Nenhuma IA configurada para analisar evidências. Configure em Configurações." },
    };
  }

  if (storageMode === "remote" && provider.provider === "lovable") {
    const { data: result, error } = await supabase.functions.invoke("analyze-evidence", {
      body: data,
    });
    return { data: result, error };
  }

  console.log(`[analyzeEvidence] Usando ${provider.provider} para análise`);

  return await callExternalAI({
    prompt: `Analise as seguintes evidências e forneça uma análise detalhada em português:

${data.evidencias.map((e) => `Tipo: ${e.tipo}\nConteúdo: ${e.conteudo}\n`).join("\n---\n")}

Retorne uma análise detalhada identificando:
- Problemas encontrados
- Possíveis causas
- Recomendações de solução
- Nível de gravidade`,
    config: {
      provider: provider.provider,
      apiKey: provider.apiKey,
      model: provider.model,
    },
  });
};

// Transcrever áudio/vídeo - COM ROTEAMENTO INTELIGENTE
export const transcribeAudio = async (audioFile: File): Promise<{ data: { text: string } | null; error: { message: string } | null }> => {
  console.log(`[transcribeAudio] Processando arquivo: ${audioFile.name} (${audioFile.type})`);
  
  // Selecionar provedor que suporta transcrição (áudio)
  const provider = selectAIForContent("audio");
  
  if (!provider) {
    return {
      data: null,
      error: { message: "❌ Nenhuma IA configurada para transcrição de áudio. Configure OpenAI ou Groq em Configurações." },
    };
  }
  
  // Apenas OpenAI e Groq têm Whisper
  if (provider.provider !== "openai" && provider.provider !== "groq") {
    return {
      data: null,
      error: { message: `❌ O provedor ${provider.provider} não suporta transcrição de áudio. Use OpenAI ou Groq.` },
    };
  }
  
  if (!provider.apiKey) {
    return {
      data: null,
      error: { message: `❌ API Key não configurada para ${provider.provider}. Configure em Configurações.` },
    };
  }
  
  console.log(`[transcribeAudio] Usando ${provider.provider} Whisper para transcrição`);
  
  try {
    const formData = new FormData();
    formData.append('file', audioFile);
    
    // Groq usa modelo diferente para Whisper
    const modelName = provider.provider === "groq" ? "whisper-large-v3" : "whisper-1";
    formData.append('model', modelName);
    
    let url = "";
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${provider.apiKey}`,
    };
    
    if (provider.provider === "openai") {
      url = "https://api.openai.com/v1/audio/transcriptions";
    } else if (provider.provider === "groq") {
      url = "https://api.groq.com/openai/v1/audio/transcriptions";
    }
    
    console.log(`[transcribeAudio] Enviando para ${url}...`);
    
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    
    console.log(`[transcribeAudio] Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[transcribeAudio] Erro ${response.status}:`, errorText);
      
      let errorMessage = `Erro ao transcrever com ${provider.provider}`;
      if (response.status === 401 || response.status === 403) {
        errorMessage = `❌ API Key inválida para ${provider.provider}`;
      } else if (response.status === 429) {
        errorMessage = `⚠️ Limite de requisições excedido. Aguarde e tente novamente.`;
      } else if (response.status === 413) {
        errorMessage = `❌ Arquivo muito grande. Tente um arquivo menor (limite: 25MB).`;
      }
      
      return {
        data: null,
        error: { message: `${errorMessage}\nDetalhes: ${errorText.substring(0, 200)}` },
      };
    }
    
    const result = await response.json();
    console.log(`[transcribeAudio] ✅ Transcrição concluída: ${result.text?.length || 0} caracteres`);
    
    return {
      data: { text: result.text || "" },
      error: null,
    };
    
  } catch (error) {
    console.error("[transcribeAudio] Erro crítico:", error);
    return {
      data: null,
      error: { 
        message: `Erro ao transcrever: ${error instanceof Error ? error.message : "Erro desconhecido"}` 
      },
    };
  }
};

// Gerar relatório IT - COM ROTEAMENTO INTELIGENTE
export const generateITReport = async (data: any) => {
  const storageMode = getStorageMode();
  
  // Relatórios são principalmente texto, usar IA otimizada para texto
  const provider = selectAIForContent("texto");
  
  if (!provider) {
    return {
      data: null,
      error: { message: "❌ Nenhuma IA configurada para gerar relatórios. Configure em Configurações." },
    };
  }

  if (storageMode === "remote" && provider.provider === "lovable") {
    const { data: result, error } = await supabase.functions.invoke("generate-it-report", {
      body: data,
    });
    return { data: result, error };
  }

  console.log(`[generateITReport] Usando ${provider.provider} para gerar relatório`);

  return await callExternalAI({
    prompt: `Gere um relatório técnico detalhado em português baseado nas seguintes informações:

Cliente: ${data.cliente}
Problema: ${data.problema}
Categoria: ${data.categoria}
Urgência: ${data.urgencia}
${data.investigacao ? `Investigação: ${data.investigacao}` : ""}
${data.solucao ? `Solução: ${data.solucao}` : ""}

Gere um relatório técnico completo para a equipe de TI com:
1. Resumo Executivo
2. Descrição do Problema
3. Análise Técnica
4. Solução Aplicada (se houver)
5. Recomendações`,
    config: {
      provider: provider.provider,
      apiKey: provider.apiKey,
      model: provider.model,
    },
  });
};

// Chamada genérica para APIs externas
async function callExternalAI(params: { prompt: string; config: AIConfig }) {
  const { prompt, config } = params;

  console.log(`[AI Service] Iniciando chamada para ${config.provider}`);
  console.log(`[AI Service] Modelo selecionado: ${config.model || 'padrão'}`);

  if (!config.apiKey && config.provider !== "lovable") {
    const erro = `❌ API Key não configurada para ${config.provider}. Configure em Configurações.`;
    console.error("[AI Service]", erro);
    throw new Error(erro);
  }

  // Verificar se a chave está mascarada (inválida)
  if (config.apiKey && config.apiKey.startsWith("••••")) {
    const erro = `❌ API Key mascarada detectada para ${config.provider}. Clique em "Alterar" e insira a chave completa novamente.`;
    console.error("[AI Service]", erro);
    throw new Error(erro);
  }

  // Validar formato básico da API Key
  if (config.apiKey && config.apiKey.trim().length < 10) {
    const erro = `❌ API Key inválida para ${config.provider} (muito curta). Verifique a chave em Configurações.`;
    console.error("[AI Service]", erro);
    throw new Error(erro);
  }

  console.log(`[AI Service] ✓ Validação da API Key OK`);

  try {
    let url = "";
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let body: any = {};

    console.log(`[AI Service] Preparando requisição para ${config.provider}...`);

    switch (config.provider) {
      case "openai":
        url = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${config.apiKey}`;
        const openaiModel = config.model || "gpt-4o-mini";
        body = {
          model: openaiModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4096,
        };
        console.log("[AI Service] Usando OpenAI com modelo:", openaiModel);
        break;

      case "groq":
        url = "https://api.groq.com/openai/v1/chat/completions";
        headers["Authorization"] = `Bearer ${config.apiKey}`;
        const groqModel = config.model || "llama-3.3-70b-versatile";
        body = {
          model: groqModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4096,
        };
        console.log("[AI Service] Usando Groq com modelo:", groqModel);
        break;

      case "anthropic":
        url = "https://api.anthropic.com/v1/messages";
        headers["x-api-key"] = config.apiKey!;
        headers["anthropic-version"] = "2023-06-01";
        const anthropicModel = config.model || "claude-3-5-sonnet-20241022";
        body = {
          model: anthropicModel,
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        };
        console.log("[AI Service] Usando Anthropic com modelo:", anthropicModel);
        break;

      case "google":
        const googleModel = config.model || "gemini-2.0-flash-exp";
        url = `https://generativelanguage.googleapis.com/v1beta/models/${googleModel}:generateContent?key=${config.apiKey}`;
        body = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        };
        console.log("[AI Service] Usando Google Gemini com modelo:", googleModel);
        break;

      default:
        const erro = `Provedor de IA não suportado: ${config.provider}`;
        console.error("[AI Service]", erro);
        return {
          data: null,
          error: { message: erro },
        };
    }

    console.log(`[AI Service] Enviando requisição para ${url}`);
    console.log(`[AI Service] Headers:`, Object.keys(headers));
    console.log(`[AI Service] Body keys:`, Object.keys(body));

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    console.log(`[AI Service] Status da resposta: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Service] ❌ Erro ${response.status} da API ${config.provider}:`, errorText);
      
      let errorMessage = `Erro na API (${response.status})`;
      let detalhes = "";
      
      if (response.status === 401 || response.status === 403) {
        errorMessage = `❌ API Key inválida ou sem permissão para ${config.provider}`;
        detalhes = "Verifique se a chave está correta e ativa em Configurações.";
      } else if (response.status === 429) {
        errorMessage = `⚠️ Limite de requisições excedido para ${config.provider}`;
        detalhes = "Aguarde alguns minutos ou verifique seu plano de API.";
      } else if (response.status === 402) {
        errorMessage = `💳 Créditos/Saldo insuficiente para ${config.provider}`;
        detalhes = "Adicione créditos à sua conta da API.";
      } else if (response.status === 404) {
        errorMessage = `❌ Modelo ou endpoint não encontrado para ${config.provider}`;
        detalhes = "O modelo pode ter sido descontinuado. Entre em contato com o suporte.";
      } else if (response.status === 400) {
        // Tentar extrair erro específico do corpo
        try {
          const errorData = JSON.parse(errorText);
          const specificError = errorData.error?.message || errorData.message || errorText;
          errorMessage = `❌ Erro de requisição para ${config.provider}`;
          detalhes = `Detalhes: ${specificError}`;
        } catch {
          errorMessage = `❌ Requisição inválida para ${config.provider}`;
          detalhes = errorText.substring(0, 200);
        }
      } else {
        errorMessage = `❌ Erro ${response.status} na API ${config.provider}`;
        detalhes = errorText.substring(0, 300);
      }
      
      console.error("[AI Service] Mensagem de erro:", errorMessage);
      console.error("[AI Service] Detalhes:", detalhes);
      
      return {
        data: null,
        error: { message: `${errorMessage}\n${detalhes}` },
      };
    }

    const result = await response.json();
    console.log("[AI Service] ✅ Resposta JSON recebida de", config.provider);

    // Extrair texto da resposta dependendo do provedor
    let content = "";
    try {
      if (config.provider === "anthropic") {
        if (!result.content || !result.content[0]) {
          throw new Error("Formato de resposta inesperado da Anthropic");
        }
        content = result.content[0].text;
      } else if (config.provider === "google") {
        if (!result.candidates || !result.candidates[0]) {
          // Google às vezes bloqueia por segurança
          if (result.promptFeedback?.blockReason) {
            throw new Error(`Resposta bloqueada: ${result.promptFeedback.blockReason}`);
          }
          throw new Error("Formato de resposta inesperado do Google");
        }
        content = result.candidates[0].content.parts[0].text;
      } else {
        // OpenAI e Groq
        if (!result.choices || !result.choices[0]) {
          throw new Error(`Formato de resposta inesperado de ${config.provider}`);
        }
        content = result.choices[0].message.content;
      }
      
      if (!content) {
        throw new Error("Resposta vazia da API");
      }
      
      console.log(`[AI Service] ✅ Análise concluída com sucesso via ${config.provider}`);
      console.log(`[AI Service] Conteúdo extraído (${content.length} caracteres)`);
      return { data: { resultado: content }, error: null };
      
    } catch (parseError) {
      console.error("[AI Service] ❌ Erro ao processar resposta:", parseError);
      console.error("[AI Service] Resposta recebida:", JSON.stringify(result, null, 2));
      return {
        data: null,
        error: { 
          message: `Erro ao processar resposta de ${config.provider}: ${parseError instanceof Error ? parseError.message : "Formato inválido"}` 
        },
      };
    }
  } catch (error) {
    console.error("[AI Service] ❌ Erro crítico ao chamar API externa:", error);
    
    let errorMsg = "Erro desconhecido ao conectar com a API";
    if (error instanceof Error) {
      console.error("[AI Service] Tipo do erro:", error.name);
      console.error("[AI Service] Stack trace:", error.stack);
      
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        errorMsg = `❌ Erro de conexão ao tentar acessar ${config.provider}.\n\n` +
                   `Verifique:\n` +
                   `• Conexão com a internet\n` +
                   `• Se a API está disponível\n` +
                   `• Firewall ou antivírus não está bloqueando\n` +
                   `• Se está em modo offline, verifique as configurações de rede`;
      } else if (error.message.includes("CORS")) {
        errorMsg = `❌ Erro de CORS ao acessar ${config.provider}.\n\n` +
                   `Isso pode acontecer no modo desktop. A API está bloqueando a requisição.`;
      } else {
        errorMsg = error.message;
      }
    }
    
    return {
      data: null,
      error: { message: errorMsg },
    };
  }
}
