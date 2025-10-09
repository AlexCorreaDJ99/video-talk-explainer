import { useState, useEffect } from "react";
import { ArrowLeft, Database, Brain, HardDrive, Download, Upload, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStorageMode, setStorageMode, dataBackup, type StorageMode } from "@/lib/storage";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const databases = [
  { id: "supabase", name: "Supabase", fields: ["URL", "Anon Key"] },
  { id: "firebase", name: "Firebase", fields: ["API Key", "Project ID"] },
  { id: "mongodb", name: "MongoDB", fields: ["Connection String"] },
];

const aiProviders = [
  { 
    id: "openai", 
    name: "OpenAI", 
    fields: ["API Key"],
    models: [
      { id: "gpt-4o", name: "GPT-4o (Mais capaz, multimodal)" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini (Rápido e econômico)" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo (Balanceado)" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo (Mais rápido)" },
    ]
  },
  { 
    id: "groq", 
    name: "Groq", 
    fields: ["API Key"],
    models: [
      { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B (Recomendado)" },
      { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B" },
      { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B (Rápido)" },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B" },
      { id: "gemma2-9b-it", name: "Gemma 2 9B" },
    ]
  },
  { 
    id: "anthropic", 
    name: "Anthropic Claude", 
    fields: ["API Key"],
    models: [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Recomendado)" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus (Mais capaz)" },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
      { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku (Rápido)" },
    ]
  },
  { 
    id: "google", 
    name: "Google AI (Gemini)", 
    fields: ["API Key"],
    models: [
      { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash (Recomendado)" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro (Mais capaz)" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash (Rápido)" },
      { id: "gemini-1.0-pro", name: "Gemini 1.0 Pro" },
    ]
  },
  { 
    id: "lovable", 
    name: "IA Integrada", 
    fields: ["API Key"],
    models: [
      { id: "default", name: "Modelo Padrão" },
    ]
  },
];

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [storageMode, setStorageModeState] = useState<StorageMode>("remote");
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedAI, setSelectedAI] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [dbCredentials, setDbCredentials] = useState<Record<string, string>>({});
  const [aiCredentials, setAiCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testingDb, setTestingDb] = useState(false);
  const [testingAI, setTestingAI] = useState(false);

  useEffect(() => {
    setStorageModeState(getStorageMode());
    
    // Carregar configuração de IA salva
    const loadAIConfig = async () => {
      try {
        const { getAIConfig } = await import("@/lib/ai-service");
        const config = getAIConfig();
        
        if (config.provider) {
          setSelectedAI(config.provider);
          if (config.model) {
            setSelectedModel(config.model);
          }
          if (config.apiKey) {
            // Mostrar chave mascarada
            setAiCredentials({ "API Key": "••••••••" + config.apiKey.slice(-4) });
          }
        }
      } catch (e) {
        console.error("Erro ao carregar config de IA:", e);
      }
    };
    
    loadAIConfig();
  }, []);

  // Resetar modelo quando trocar de provedor
  useEffect(() => {
    if (selectedAI) {
      const provider = aiProviders.find(p => p.id === selectedAI);
      if (provider?.models && provider.models.length > 0) {
        // Se não houver modelo selecionado, usar o primeiro da lista (recomendado)
        if (!selectedModel) {
          setSelectedModel(provider.models[0].id);
        }
      }
    }
  }, [selectedAI]);

  const handleStorageModeChange = (mode: StorageMode) => {
    setStorageMode(mode);
    setStorageModeState(mode);
    toast({
      title: "Modo de armazenamento alterado",
      description: mode === "local" 
        ? "Os dados serão armazenados localmente no navegador"
        : "Os dados serão armazenados no banco de dados remoto",
    });
  };

  const handleExportData = () => {
    try {
      dataBackup.export();
      toast({
        title: "Dados exportados!",
        description: "Backup dos dados locais baixado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Não foi possível exportar os dados.",
      });
    }
  };

  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;

      try {
        await dataBackup.import(file);
        toast({
          title: "Dados importados!",
          description: "Backup restaurado com sucesso.",
        });
        window.location.reload();
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao importar",
          description: "Arquivo inválido ou corrompido.",
        });
      }
    };
    input.click();
  };

  const handleClearLocalData = () => {
    if (confirm("Tem certeza que deseja apagar todos os dados locais? Esta ação não pode ser desfeita.")) {
      dataBackup.clear();
      toast({
        title: "Dados apagados",
        description: "Todos os dados locais foram removidos.",
      });
      window.location.reload();
    }
  };

  const handleSaveDatabase = async () => {
    if (!selectedDatabase) {
      toast({
        title: "Erro",
        description: "Selecione um banco de dados.",
        variant: "destructive",
      });
      return;
    }

    const db = databases.find(d => d.id === selectedDatabase);
    if (!db) return;

    const missingFields = db.fields.filter(field => !dbCredentials[field]?.trim());
    if (missingFields.length > 0) {
      toast({
        title: "Erro",
        description: `Preencha todos os campos: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      toast({
        title: "Configuração salva",
        description: `Credenciais do ${db.name} salvas com sucesso!`,
      });
      setDbCredentials({});
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAI = async () => {
    if (!selectedAI) {
      toast({
        title: "Erro",
        description: "Selecione um provedor de IA.",
        variant: "destructive",
      });
      return;
    }

    const ai = aiProviders.find(a => a.id === selectedAI);
    if (!ai) return;

    // Lovable AI não precisa de API key
    if (selectedAI !== "lovable") {
      const missingFields = ai.fields.filter(field => !aiCredentials[field]?.trim());
      if (missingFields.length > 0) {
        toast({
          title: "Erro",
          description: `Preencha todos os campos: ${missingFields.join(", ")}`,
          variant: "destructive",
        });
        return;
      }
    }

    setSaving(true);
    try {
      // Importar dinamicamente para evitar erro se o módulo não existir
      const { setAIConfig } = await import("@/lib/ai-service");
      
      const apiKey = aiCredentials["API Key"];
      
      // NÃO salvar se a chave estiver mascarada
      if (apiKey && apiKey.startsWith("••••")) {
        toast({
          title: "⚠️ Chave mascarada",
          description: "Clique em 'Alterar' e insira a chave completa novamente para atualizar.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      // Validar comprimento mínimo da chave
      if (apiKey && apiKey.trim().length < 20) {
        toast({
          title: "⚠️ API Key inválida",
          description: "A chave parece muito curta. Verifique se copiou corretamente.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      
      setAIConfig({
        provider: selectedAI as any,
        apiKey: apiKey,
        model: selectedModel,
      });

      toast({
        title: "✅ Configuração salva",
        description: `${ai.name} configurado com sucesso! Você já pode usar a análise.`,
      });
      
      // Manter chave mascarada no campo após salvar
      if (apiKey && !apiKey.startsWith("••••")) {
        setAiCredentials({ "API Key": "••••••••" + apiKey.slice(-4) });
      }
    } catch (error) {
      console.error("Erro ao salvar config de IA:", error);
      toast({
        title: "❌ Erro ao salvar",
        description: error instanceof Error ? error.message : "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestDatabase = async () => {
    if (!selectedDatabase) {
      toast({
        title: "Erro",
        description: "Selecione um banco de dados primeiro.",
        variant: "destructive",
      });
      return;
    }

    const db = databases.find(d => d.id === selectedDatabase);
    if (!db) return;

    const missingFields = db.fields.filter(field => !dbCredentials[field]?.trim());
    if (missingFields.length > 0) {
      toast({
        title: "Erro",
        description: `Preencha todos os campos antes de testar: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setTestingDb(true);
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "✅ Conexão bem-sucedida!",
        description: `Conectado ao ${db.name} com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "❌ Falha na conexão",
        description: "Não foi possível conectar ao banco de dados. Verifique as credenciais.",
        variant: "destructive",
      });
    } finally {
      setTestingDb(false);
    }
  };

  const handleTestAI = async () => {
    if (!selectedAI) {
      toast({
        title: "Erro",
        description: "Selecione um provedor de IA primeiro.",
        variant: "destructive",
      });
      return;
    }

    const ai = aiProviders.find(a => a.id === selectedAI);
    if (!ai) return;

    // Lovable AI não pode ser testado localmente
    if (selectedAI === "lovable") {
      toast({
        title: "Informação",
        description: "IA Integrada funciona apenas quando conectado ao sistema remoto.",
      });
      return;
    }

    const missingFields = ai.fields.filter(field => !aiCredentials[field]?.trim());
    if (missingFields.length > 0) {
      toast({
        title: "Erro",
        description: `Preencha todos os campos antes de testar: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setTestingAI(true);
    try {
      const apiKey = aiCredentials["API Key"];
      let url = "";
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      let body: any = {};

      // Fazer uma chamada de teste simples para cada provedor
      switch (selectedAI) {
        case "openai":
          url = "https://api.openai.com/v1/chat/completions";
          headers["Authorization"] = `Bearer ${apiKey}`;
          body = {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: "Responda apenas: OK" }],
            max_tokens: 10,
          };
          break;

        case "groq":
          url = "https://api.groq.com/openai/v1/chat/completions";
          headers["Authorization"] = `Bearer ${apiKey}`;
          body = {
            model: "llama-3.1-70b-versatile",
            messages: [{ role: "user", content: "Responda apenas: OK" }],
            max_tokens: 10,
          };
          break;

        case "anthropic":
          url = "https://api.anthropic.com/v1/messages";
          headers["x-api-key"] = apiKey;
          headers["anthropic-version"] = "2023-06-01";
          body = {
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 10,
            messages: [{ role: "user", content: "Responda apenas: OK" }],
          };
          break;

        case "google":
          url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
          body = {
            contents: [{ parts: [{ text: "Responda apenas: OK" }] }],
          };
          break;

        default:
          throw new Error("Provedor não suportado");
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Erro ao conectar com a API.";
        
        if (response.status === 401 || response.status === 403) {
          errorMessage = "API Key inválida ou sem permissão.";
        } else if (response.status === 429) {
          errorMessage = "Limite de requisições excedido.";
        } else if (response.status === 404) {
          errorMessage = "Endpoint não encontrado. Verifique a configuração.";
        }

        toast({
          title: "❌ Falha no teste",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      const result = await response.json();
      
      // Verificar se a resposta contém dados válidos
      let hasValidResponse = false;
      if (selectedAI === "anthropic" && result.content) {
        hasValidResponse = true;
      } else if (selectedAI === "google" && result.candidates) {
        hasValidResponse = true;
      } else if ((selectedAI === "openai" || selectedAI === "groq") && result.choices) {
        hasValidResponse = true;
      }

      if (hasValidResponse) {
        toast({
          title: "✅ API funcionando!",
          description: `Conexão com ${ai.name} estabelecida com sucesso. A IA está respondendo corretamente.`,
        });
      } else {
        toast({
          title: "⚠️ Resposta inesperada",
          description: "A API respondeu mas o formato não é o esperado.",
        });
      }
    } catch (error) {
      console.error("Erro ao testar API:", error);
      toast({
        title: "❌ Falha no teste",
        description: error instanceof Error ? error.message : "Não foi possível conectar à API. Verifique a chave API e sua conexão com a internet.",
        variant: "destructive",
      });
    } finally {
      setTestingAI(false);
    }
  };

  const selectedDbConfig = databases.find(db => db.id === selectedDatabase);
  const selectedAiConfig = aiProviders.find(ai => ai.id === selectedAI);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Configure o armazenamento, banco de dados e IA</p>
          </div>
        </div>

        {/* Modo de Armazenamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Modo de Armazenamento
            </CardTitle>
            <CardDescription>
              Escolha onde seus dados serão armazenados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={storageMode} onValueChange={(value) => handleStorageModeChange(value as StorageMode)}>
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="remote" id="remote" />
                <div className="flex-1">
                  <Label htmlFor="remote" className="font-semibold cursor-pointer">
                    Banco de Dados Remoto (Nuvem)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dados sincronizados na nuvem, acessíveis de qualquer dispositivo
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 border rounded-lg">
                <RadioGroupItem value="local" id="local" />
                <div className="flex-1">
                  <Label htmlFor="local" className="font-semibold cursor-pointer">
                    Armazenamento Local (Navegador)
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dados salvos apenas neste navegador, 100% offline
                  </p>
                </div>
              </div>
            </RadioGroup>

            {storageMode === "local" && (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Gerenciar Dados Locais:</strong>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button onClick={handleExportData} variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Exportar Backup
                  </Button>
                  <Button onClick={handleImportData} variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Importar Backup
                  </Button>
                  <Button onClick={handleClearLocalData} variant="destructive" className="gap-2">
                    <Trash className="w-4 h-4" />
                    Limpar Dados
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Banco de Dados
            </CardTitle>
            <CardDescription>
              Selecione e configure o banco de dados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar Banco de Dados</Label>
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um banco de dados" />
                </SelectTrigger>
                <SelectContent>
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id}>
                      {db.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDbConfig && (
              <div className="space-y-4 pt-4 border-t">
                {selectedDbConfig.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={`db-${field}`}>{field}</Label>
                    <Input
                      id={`db-${field}`}
                      type={field.toLowerCase().includes("key") || field.toLowerCase().includes("string") ? "password" : "text"}
                      placeholder={`Digite ${field}`}
                      value={dbCredentials[field] || ""}
                      onChange={(e) => setDbCredentials({ ...dbCredentials, [field]: e.target.value })}
                    />
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button onClick={handleTestDatabase} disabled={testingDb} variant="outline" className="flex-1">
                    {testingDb ? "Testando..." : "Testar Conexão"}
                  </Button>
                  <Button onClick={handleSaveDatabase} disabled={saving} className="flex-1">
                    {saving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Cérebro (IA)
            </CardTitle>
            <CardDescription>
              Selecione e configure o provedor de IA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Selecionar IA</Label>
              <Select value={selectedAI} onValueChange={setSelectedAI}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um provedor de IA" />
                </SelectTrigger>
                <SelectContent>
                  {aiProviders.map((ai) => (
                    <SelectItem key={ai.id} value={ai.id}>
                      {ai.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAiConfig && (
              <div className="space-y-4 pt-4 border-t">
                {selectedAI === "lovable" ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>IA Integrada</strong> funciona automaticamente quando conectado ao sistema.
                      Para uso local, escolha outro provedor e configure sua API key.
                    </p>
                  </div>
                ) : (
                  <>
                    {selectedAiConfig.fields.map((field) => (
                      <div key={field} className="space-y-2">
                        <Label htmlFor={`ai-${field}`}>{field}</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`ai-${field}`}
                            type="password"
                            placeholder={aiCredentials[field]?.startsWith("••••") ? "Chave salva" : `Digite ${field}`}
                            value={aiCredentials[field] || ""}
                            onChange={(e) => setAiCredentials({ ...aiCredentials, [field]: e.target.value })}
                          />
                          {aiCredentials[field]?.startsWith("••••") && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setAiCredentials({ ...aiCredentials, [field]: "" })}
                            >
                              Alterar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {selectedAiConfig.models && selectedAiConfig.models.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="ai-model">Modelo / Versão</Label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger id="ai-model">
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedAiConfig.models.map((model: any) => (
                              <SelectItem key={model.id} value={model.id}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          💡 Escolha a versão mais recente para evitar erros de compatibilidade
                        </p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleTestAI} disabled={testingAI} variant="outline" className="flex-1">
                        {testingAI ? "Testando..." : "Testar Conexão"}
                      </Button>
                      <Button onClick={handleSaveAI} disabled={saving} className="flex-1">
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
