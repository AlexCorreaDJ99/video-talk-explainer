// Sistema de configuração de múltiplas IAs - Desenvolvido por Alex Correa Gomes
export type AIProvider = "lovable" | "openai" | "groq" | "anthropic" | "google";

export type ContentType = "texto" | "imagem" | "audio" | "video" | "misto";

export interface ProviderConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  enabled: boolean;
  capabilities: ContentType[];
}

export interface MultiAIConfig {
  providers: ProviderConfig[];
  routing: {
    texto: AIProvider;
    imagem: AIProvider;
    audio: AIProvider;
    video: AIProvider;
    misto: AIProvider;
  };
}

const MULTI_AI_CONFIG_KEY = "multi-ai-config";

// Capabilities padrão de cada provedor
export const providerCapabilities: Record<AIProvider, ContentType[]> = {
  lovable: ["texto", "imagem", "audio", "video", "misto"],
  openai: ["texto", "imagem", "audio", "misto"],
  groq: ["texto", "audio"],
  anthropic: ["texto", "imagem", "misto"],
  google: ["texto", "imagem", "video", "audio", "misto"],
};

// Modelos disponíveis por provedor
export const providerModels: Record<AIProvider, Array<{ id: string; name: string }>> = {
  openai: [
    { id: "gpt-4o", name: "GPT-4o (Multimodal, mais capaz)" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini (Rápido e econômico)" },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo (Balanceado)" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (Mais rápido)" },
  ],
  groq: [
    { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Recomendado)" },
    { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B" },
    { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Ultra rápido)" },
    { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
  ],
  anthropic: [
    { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Recomendado)" },
    { id: "claude-3-opus-20240229", name: "Claude 3 Opus (Mais capaz)" },
    { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku (Rápido)" },
  ],
  google: [
    { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash (Recomendado)" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Mais capaz)" },
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Rápido)" },
    { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro" },
  ],
  lovable: [
    { id: "google/gemini-2.5-flash", name: "Gemini 2.5 Flash (Padrão)" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro (Mais capaz)" },
    { id: "openai/gpt-5-mini", name: "GPT-5 Mini (Balanceado)" },
  ],
};

// Obter configuração completa
export const getMultiAIConfig = (): MultiAIConfig => {
  const config = localStorage.getItem(MULTI_AI_CONFIG_KEY);
  if (!config) {
    // Configuração padrão: apenas Lovable AI
    return {
      providers: [
        {
          provider: "lovable",
          enabled: true,
          capabilities: providerCapabilities.lovable,
        },
      ],
      routing: {
        texto: "lovable",
        imagem: "lovable",
        audio: "lovable",
        video: "lovable",
        misto: "lovable",
      },
    };
  }
  return JSON.parse(config);
};

// Salvar configuração completa
export const setMultiAIConfig = (config: MultiAIConfig) => {
  localStorage.setItem(MULTI_AI_CONFIG_KEY, JSON.stringify(config));
};

// Obter provedor configurado para um tipo de conteúdo
export const getProviderForContent = (contentType: ContentType): ProviderConfig | null => {
  const config = getMultiAIConfig();
  const providerId = config.routing[contentType];
  
  const provider = config.providers.find(
    (p) => p.provider === providerId && p.enabled
  );
  
  if (!provider) {
    console.warn(`[AI Router] Provedor ${providerId} não encontrado/habilitado para ${contentType}`);
    // Fallback: tentar encontrar qualquer provedor habilitado que suporte este tipo
    return config.providers.find(
      (p) => p.enabled && p.capabilities.includes(contentType)
    ) || null;
  }
  
  return provider;
};

// Atualizar roteamento automático baseado nos provedores habilitados
export const updateAutoRouting = (providers: ProviderConfig[]): MultiAIConfig["routing"] => {
  const routing: MultiAIConfig["routing"] = {
    texto: "lovable",
    imagem: "lovable",
    audio: "lovable",
    video: "lovable",
    misto: "lovable",
  };
  
  const enabledProviders = providers.filter((p) => p.enabled);
  
  // Prioridades para cada tipo de conteúdo
  const priorities: Record<ContentType, AIProvider[]> = {
    texto: ["groq", "anthropic", "openai", "google", "lovable"],
    imagem: ["openai", "google", "anthropic", "lovable"],
    audio: ["groq", "openai", "google", "lovable"],
    video: ["google", "openai", "lovable"],
    misto: ["google", "openai", "anthropic", "lovable"],
  };
  
  // Para cada tipo de conteúdo, escolher o primeiro provedor disponível na lista de prioridades
  (Object.keys(priorities) as ContentType[]).forEach((contentType) => {
    const priorityList = priorities[contentType];
    
    for (const provider of priorityList) {
      const found = enabledProviders.find(
        (p) => p.provider === provider && p.capabilities.includes(contentType)
      );
      
      if (found) {
        routing[contentType] = found.provider;
        break;
      }
    }
  });
  
  return routing;
};

// Adicionar ou atualizar um provedor
export const updateProvider = (providerConfig: ProviderConfig) => {
  const config = getMultiAIConfig();
  
  const existingIndex = config.providers.findIndex(
    (p) => p.provider === providerConfig.provider
  );
  
  if (existingIndex >= 0) {
    config.providers[existingIndex] = providerConfig;
  } else {
    config.providers.push(providerConfig);
  }
  
  // Atualizar roteamento automático
  config.routing = updateAutoRouting(config.providers);
  
  setMultiAIConfig(config);
};

// Remover um provedor
export const removeProvider = (provider: AIProvider) => {
  const config = getMultiAIConfig();
  config.providers = config.providers.filter((p) => p.provider !== provider);
  config.routing = updateAutoRouting(config.providers);
  setMultiAIConfig(config);
};

// Listar provedores habilitados
export const getEnabledProviders = (): ProviderConfig[] => {
  const config = getMultiAIConfig();
  return config.providers.filter((p) => p.enabled);
};
