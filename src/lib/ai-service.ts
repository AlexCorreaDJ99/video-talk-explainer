// Serviço de IA - Desenvolvido por Alex Correa Gomes
import { supabase } from "@/integrations/supabase/client";
import { getStorageMode } from "./storage";

interface AIConfig {
  provider: "lovable" | "openai" | "groq" | "anthropic" | "google";
  apiKey?: string;
  model?: string; // Modelo específico do provedor
}

const AI_CONFIG_KEY = "ai-config";

export const getAIConfig = (): AIConfig => {
  const config = localStorage.getItem(AI_CONFIG_KEY);
  if (!config) {
    return { provider: "lovable" };
  }
  return JSON.parse(config);
};

export const setAIConfig = (config: AIConfig) => {
  localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(config));
};

// Analisar vídeo/áudio
export const analyzeVideo = async (data: {
  transcricao: string;
  tipo: string;
}) => {
  const storageMode = getStorageMode();
  const aiConfig = getAIConfig();

  // Se estiver em modo remoto e usar Lovable AI, retornar erro para usar edge function
  if (storageMode === "remote" && aiConfig.provider === "lovable") {
    return {
      data: null,
      error: { message: "Use a edge function diretamente para Lovable AI em modo remoto" },
    };
  }

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
    config: aiConfig,
  });
};

// Analisar evidências
export const analyzeEvidence = async (data: {
  conversation_id: string;
  evidencias: Array<{ tipo: string; conteudo: string; nome_arquivo?: string }>;
}) => {
  const storageMode = getStorageMode();
  const aiConfig = getAIConfig();

  if (storageMode === "remote" && aiConfig.provider === "lovable") {
    const { data: result, error } = await supabase.functions.invoke("analyze-evidence", {
      body: data,
    });
    return { data: result, error };
  }

  return await callExternalAI({
    prompt: `Analise as seguintes evidências e forneça uma análise detalhada em português:

${data.evidencias.map((e) => `Tipo: ${e.tipo}\nConteúdo: ${e.conteudo}\n`).join("\n---\n")}

Retorne uma análise detalhada identificando:
- Problemas encontrados
- Possíveis causas
- Recomendações de solução
- Nível de gravidade`,
    config: aiConfig,
  });
};

// Gerar relatório IT
export const generateITReport = async (data: any) => {
  const storageMode = getStorageMode();
  const aiConfig = getAIConfig();

  if (storageMode === "remote" && aiConfig.provider === "lovable") {
    const { data: result, error } = await supabase.functions.invoke("generate-it-report", {
      body: data,
    });
    return { data: result, error };
  }

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
    config: aiConfig,
  });
};

// Chamada genérica para APIs externas
async function callExternalAI(params: { prompt: string; config: AIConfig }) {
  const { prompt, config } = params;

  if (!config.apiKey && config.provider !== "lovable") {
    const erro = `❌ API Key não configurada para ${config.provider}. Configure em Configurações.`;
    console.error(erro);
    throw new Error(erro);
  }

  // Verificar se a chave está mascarada (inválida)
  if (config.apiKey && config.apiKey.startsWith("••••")) {
    const erro = `❌ API Key mascarada detectada para ${config.provider}. Clique em "Alterar" e insira a chave completa novamente.`;
    console.error(erro);
    throw new Error(erro);
  }

  // Validar formato básico da API Key
  if (config.apiKey && config.apiKey.trim().length < 10) {
    const erro = `❌ API Key inválida para ${config.provider} (muito curta). Verifique a chave em Configurações.`;
    console.error(erro);
    throw new Error(erro);
  }

  console.log(`🔄 Conectando com ${config.provider}...`);

  try {
    let url = "";
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let body: any = {};

    switch (config.provider) {
      case "openai":
        url = "https://api.openai.com/v1/chat/completions";
        headers["Authorization"] = `Bearer ${config.apiKey}`;
        const openaiModel = config.model || "gpt-4o-mini";
        body = {
          model: openaiModel,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        };
        console.log("🔧 Usando OpenAI com modelo:", openaiModel);
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
        console.log("🔧 Usando Groq com modelo:", groqModel);
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
        console.log("🔧 Usando Anthropic com modelo:", anthropicModel);
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
        console.log("🔧 Usando Google Gemini com modelo:", googleModel);
        break;

      default:
        return {
          data: null,
          error: { message: "Provedor de IA não suportado em modo local" },
        };
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro ${response.status} da API ${config.provider}:`, errorText);
      
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
      
      console.error("Mensagem de erro:", errorMessage);
      console.error("Detalhes:", detalhes);
      
      return {
        data: null,
        error: { message: `${errorMessage}\n${detalhes}` },
      };
    }

    const result = await response.json();
    console.log("✅ Resposta recebida de", config.provider);

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
      
      console.log(`✅ Análise concluída com sucesso via ${config.provider}`);
      return { data: { resultado: content }, error: null };
      
    } catch (parseError) {
      console.error("Erro ao processar resposta:", parseError);
      console.error("Resposta recebida:", JSON.stringify(result, null, 2));
      return {
        data: null,
        error: { 
          message: `Erro ao processar resposta de ${config.provider}: ${parseError instanceof Error ? parseError.message : "Formato inválido"}` 
        },
      };
    }
  } catch (error) {
    console.error("❌ Erro ao chamar API externa:", error);
    
    let errorMsg = "Erro desconhecido ao conectar com a API";
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("NetworkError")) {
        errorMsg = `❌ Erro de conexão ao tentar acessar ${config.provider}. Verifique sua internet ou se a API está disponível.`;
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
