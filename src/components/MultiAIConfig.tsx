import { useState, useEffect } from "react";
import { Brain, Check, X, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  getMultiAIConfig,
  updateProvider,
  removeProvider,
  providerCapabilities,
  providerModels,
  type AIProvider,
  type ProviderConfig,
  type ContentType,
} from "@/lib/ai-config";

const providerInfo: Record<AIProvider, { name: string; description: string }> = {
  lovable: {
    name: "IA Integrada",
    description: "Funciona automaticamente em modo remoto",
  },
  openai: {
    name: "OpenAI",
    description: "GPT-4o - Excelente para imagens e texto",
  },
  groq: {
    name: "Groq",
    description: "Llama 3.3 - Ultra rápido para texto",
  },
  anthropic: {
    name: "Anthropic Claude",
    description: "Claude 3.5 - Ótimo para análise de texto",
  },
  google: {
    name: "Google AI",
    description: "Gemini - Multimodal completo",
  },
};

const contentTypeLabels: Record<ContentType, string> = {
  texto: "📝 Texto",
  imagem: "🖼️ Imagem",
  audio: "🎤 Áudio",
  video: "🎬 Vídeo",
  misto: "🎨 Misto",
};

export default function MultiAIConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState(getMultiAIConfig());
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const loadedConfig = getMultiAIConfig();
    setConfig(loadedConfig);
  };

  const handleToggleProvider = (provider: AIProvider) => {
    const existing = config.providers.find((p) => p.provider === provider);

    if (existing) {
      // Toggle enabled
      updateProvider({
        ...existing,
        enabled: !existing.enabled,
      });
    } else {
      // Adicionar novo provedor
      setEditingProvider(provider);
      setApiKey("");
      setSelectedModel("");
    }

    loadConfig();
  };

  const handleSaveProvider = () => {
    if (!editingProvider) return;

    if (editingProvider !== "lovable" && (!apiKey || apiKey.startsWith("••••"))) {
      toast({
        title: "⚠️ API Key necessária",
        description: "Digite a API Key completa para salvar",
        variant: "destructive",
      });
      return;
    }

    if (apiKey && apiKey.trim().length < 20 && editingProvider !== "lovable") {
      toast({
        title: "⚠️ API Key inválida",
        description: "A chave parece muito curta. Verifique se copiou corretamente.",
        variant: "destructive",
      });
      return;
    }

    const newProvider: ProviderConfig = {
      provider: editingProvider,
      apiKey: editingProvider === "lovable" ? undefined : apiKey,
      model: selectedModel || undefined,
      enabled: true,
      capabilities: providerCapabilities[editingProvider],
    };

    updateProvider(newProvider);
    loadConfig();

    toast({
      title: "✅ Provedor configurado!",
      description: `${providerInfo[editingProvider].name} está pronto para uso`,
    });

    setEditingProvider(null);
    setApiKey("");
    setSelectedModel("");
  };

  const handleDeleteProvider = (provider: AIProvider) => {
    if (confirm(`Tem certeza que deseja remover ${providerInfo[provider].name}?`)) {
      removeProvider(provider);
      loadConfig();
      toast({
        title: "Provedor removido",
        description: `${providerInfo[provider].name} foi removido`,
      });
    }
  };

  const getProviderStatus = (provider: AIProvider) => {
    const existing = config.providers.find((p) => p.provider === provider);
    return existing?.enabled ? "enabled" : existing ? "disabled" : "not-configured";
  };

  const getProviderForType = (contentType: ContentType): AIProvider => {
    return config.routing[contentType];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Múltiplas IAs (Roteamento Inteligente)
        </CardTitle>
        <CardDescription>
          Configure várias IAs e o sistema escolherá automaticamente a melhor para cada tipo de
          análise
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista de provedores disponíveis */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Provedores Disponíveis</h3>
          <div className="grid gap-3">
            {(Object.keys(providerInfo) as AIProvider[]).map((provider) => {
              const status = getProviderStatus(provider);
              const existing = config.providers.find((p) => p.provider === provider);

              return (
                <div
                  key={provider}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Switch
                      checked={status === "enabled"}
                      onCheckedChange={() => handleToggleProvider(provider)}
                      disabled={status === "not-configured" && provider !== "lovable"}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{providerInfo[provider].name}</span>
                        {status === "enabled" && (
                          <Badge variant="default" className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            Ativo
                          </Badge>
                        )}
                        {status === "not-configured" && provider !== "lovable" && (
                          <Badge variant="outline">Não configurado</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {providerInfo[provider].description}
                      </p>
                      {existing && (
                        <div className="flex gap-1 mt-1">
                          {existing.capabilities.map((cap) => (
                            <Badge key={cap} variant="secondary" className="text-xs">
                              {contentTypeLabels[cap]}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {status === "not-configured" && provider !== "lovable" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingProvider(provider);
                          setApiKey("");
                          setSelectedModel("");
                        }}
                      >
                        Configurar
                      </Button>
                    )}
                    {status !== "not-configured" && provider !== "lovable" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteProvider(provider)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Roteamento Automático */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium">Roteamento Automático</h3>
          </div>
          <div className="grid gap-2">
            {(Object.keys(contentTypeLabels) as ContentType[]).map((contentType) => {
              const assignedProvider = getProviderForType(contentType);
              return (
                <div
                  key={contentType}
                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                >
                  <span className="text-sm">{contentTypeLabels[contentType]}</span>
                  <Badge variant="outline">{providerInfo[assignedProvider].name}</Badge>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            O sistema automaticamente escolhe a melhor IA baseado no tipo de conteúdo
          </p>
        </div>

        {/* Modal de configuração */}
        {editingProvider && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Configurar {providerInfo[editingProvider].name}</CardTitle>
                <CardDescription>
                  Insira suas credenciais para habilitar este provedor
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {editingProvider !== "lovable" && (
                  <>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        placeholder="Digite sua API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>

                    {providerModels[editingProvider] && (
                      <div className="space-y-2">
                        <Label>Modelo</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modelo (opcional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {providerModels[editingProvider].map((model) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingProvider(null)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveProvider} className="flex-1">
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
