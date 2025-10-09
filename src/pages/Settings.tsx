import { useState } from "react";
import { ArrowLeft, Key, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface AIProvider {
  id: string;
  name: string;
  description: string;
  secretName: string;
  enabled: boolean;
  configured: boolean;
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [providers, setProviders] = useState<AIProvider[]>([
    {
      id: "lovable",
      name: "Lovable AI (Gemini/GPT-5)",
      description: "Análise de conteúdo e transcrição integrada",
      secretName: "LOVABLE_API_KEY",
      enabled: true,
      configured: true,
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "GPT-4, GPT-4o, Whisper e DALL-E",
      secretName: "OPENAI_API_KEY",
      enabled: false,
      configured: false,
    },
    {
      id: "groq",
      name: "Groq",
      description: "LLaMA 3, Mixtral - Inferência ultra-rápida",
      secretName: "GROQ_API_KEY",
      enabled: false,
      configured: false,
    },
    {
      id: "anthropic",
      name: "Anthropic Claude",
      description: "Claude 4 Opus, Sonnet e Haiku",
      secretName: "ANTHROPIC_API_KEY",
      enabled: false,
      configured: false,
    },
    {
      id: "google",
      name: "Google AI (Gemini)",
      description: "Gemini Pro e Flash - Direto da Google",
      secretName: "GOOGLE_AI_API_KEY",
      enabled: false,
      configured: false,
    },
  ]);

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  const handleToggleProvider = (providerId: string) => {
    setProviders(providers.map(p => 
      p.id === providerId ? { ...p, enabled: !p.enabled } : p
    ));
  };

  const handleSaveApiKey = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um provedor e insira uma API key válida.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      const provider = providers.find(p => p.id === selectedProvider);
      if (!provider) return;

      // Aqui você salvaria a API key no Supabase Secrets
      // Por enquanto, vamos simular o salvamento
      toast({
        title: "Configuração salva",
        description: `API key para ${provider.name} configurada com sucesso! Adicione o secret "${provider.secretName}" no backend.`,
      });

      // Atualizar status do provedor
      setProviders(providers.map(p => 
        p.id === selectedProvider ? { ...p, configured: true } : p
      ));

      setApiKey("");
      setSelectedProvider(null);
    } catch (error) {
      console.error("Erro ao salvar API key:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManageSecrets = () => {
    toast({
      title: "Gerenciar Secrets",
      description: "Acesse o painel do backend para gerenciar seus secrets com segurança.",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Configurações de IA</h1>
            <p className="text-muted-foreground">Configure os provedores de IA que deseja utilizar</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              Provedores de IA Disponíveis
            </CardTitle>
            <CardDescription>
              Ative e configure as API keys dos provedores que deseja usar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {providers.map((provider) => (
              <div key={provider.id} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <Label className="text-base font-semibold">{provider.name}</Label>
                      {provider.configured ? (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                          <Check className="w-3 h-3" />
                          Configurada
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                          <X className="w-3 h-3" />
                          Não configurada
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Secret: <code className="px-1.5 py-0.5 rounded bg-muted">{provider.secretName}</code>
                    </p>
                  </div>
                </div>

                {selectedProvider === provider.id ? (
                  <div className="space-y-3 pt-3">
                    <Label htmlFor={`api-key-${provider.id}`}>API Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id={`api-key-${provider.id}`}
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="font-mono"
                      />
                      <Button onClick={handleSaveApiKey} disabled={saving}>
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedProvider(null);
                          setApiKey("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProvider(provider.id)}
                    className="mt-2"
                  >
                    {provider.configured ? "Atualizar API Key" : "Adicionar API Key"}
                  </Button>
                )}
              </div>
            ))}

            <div className="pt-4 space-y-4">
              <Button onClick={handleManageSecrets} variant="secondary" className="w-full" size="lg">
                <Key className="w-4 h-4 mr-2" />
                Gerenciar Secrets no Backend
              </Button>
              
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">💡 Como funcionam os Secrets?</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Adicione a API key aqui para referência</li>
                  <li>Acesse o backend e adicione um Secret com o nome exato mostrado acima</li>
                  <li>Cole sua API key de forma segura no backend</li>
                  <li>As Edge Functions terão acesso automático ao secret</li>
                  <li>Nunca exponha API keys no código frontend</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>Detalhes técnicos da aplicação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Versão</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Backend</span>
              <span className="font-mono">Lovable Cloud</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Edge Functions</span>
              <span className="font-mono">analyze-video</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Provedores Ativos</span>
              <span className="font-mono">{providers.filter(p => p.configured).length}/{providers.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
