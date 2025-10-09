// Serviço de IA - Funciona com Lovable AI ou APIs externas
import { supabase } from "@/integrations/supabase/client";
import { getStorageMode } from "./storage";

interface AIConfig {
  provider: "lovable" | "openai" | "groq" | "anthropic" | "google";
  apiKey?: string;
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

  // Se estiver em modo remoto e usar Lovable AI, usar edge function
  if (storageMode === "remote" && aiConfig.provider === "lovable") {
    const { data: result, error } = await supabase.functions.invoke("analyze-video", {
      body: data,
    });
    return { data: result, error };
  }

  // Modo local ou API externa
  return await callExternalAI({
    prompt: `Analise a seguinte transcrição de ${data.tipo} e retorne um JSON com:
- urgencia (baixa, media, alta, critica)
- categoria (tecnico, financeiro, atendimento, operacional, outro)
- sentimento (positivo, neutro, negativo, frustrado)
- resumo_curto (máximo 150 caracteres)
- contexto (descrição detalhada)
- problemas (array de strings)
- topicos (array de strings)
- insights (array de strings)

Transcrição:
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
    return {
      data: null,
      error: { message: "API Key não configurada. Configure em Configurações." },
    };
  }

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
        body = {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        };
        break;

      case "groq":
        url = "https://api.groq.com/openai/v1/chat/completions";
        headers["Authorization"] = `Bearer ${config.apiKey}`;
        body = {
          model: "llama-3.1-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        };
        break;

      case "anthropic":
        url = "https://api.anthropic.com/v1/messages";
        headers["x-api-key"] = config.apiKey!;
        headers["anthropic-version"] = "2023-06-01";
        body = {
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 4096,
          messages: [{ role: "user", content: prompt }],
        };
        break;

      case "google":
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${config.apiKey}`;
        body = {
          contents: [{ parts: [{ text: prompt }] }],
        };
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
      return {
        data: null,
        error: { message: `Erro na API: ${response.status} - ${errorText}` },
      };
    }

    const result = await response.json();

    // Extrair texto da resposta dependendo do provedor
    let content = "";
    if (config.provider === "anthropic") {
      content = result.content[0].text;
    } else if (config.provider === "google") {
      content = result.candidates[0].content.parts[0].text;
    } else {
      content = result.choices[0].message.content;
    }

    return { data: { resultado: content }, error: null };
  } catch (error) {
    console.error("Erro ao chamar API externa:", error);
    return {
      data: null,
      error: { message: error instanceof Error ? error.message : "Erro desconhecido" },
    };
  }
}
