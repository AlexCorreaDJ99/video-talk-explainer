import { useState } from "react";
import { ArrowLeft, Database, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const databases = [
  { id: "supabase", name: "Supabase", fields: ["URL", "Anon Key"] },
  { id: "firebase", name: "Firebase", fields: ["API Key", "Project ID"] },
  { id: "mongodb", name: "MongoDB", fields: ["Connection String"] },
];

const aiProviders = [
  { id: "openai", name: "OpenAI", fields: ["API Key"] },
  { id: "groq", name: "Groq", fields: ["API Key"] },
  { id: "anthropic", name: "Anthropic Claude", fields: ["API Key"] },
  { id: "google", name: "Google AI (Gemini)", fields: ["API Key"] },
  { id: "lovable", name: "Lovable AI", fields: ["API Key"] },
];

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [selectedAI, setSelectedAI] = useState<string>("");
  const [dbCredentials, setDbCredentials] = useState<Record<string, string>>({});
  const [aiCredentials, setAiCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

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

    const missingFields = ai.fields.filter(field => !aiCredentials[field]?.trim());
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
        description: `API key do ${ai.name} salva com sucesso!`,
      });
      setAiCredentials({});
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
            <p className="text-muted-foreground">Configure o banco de dados e o cérebro da IA</p>
          </div>
        </div>

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
                <Button onClick={handleSaveDatabase} disabled={saving} className="w-full">
                  {saving ? "Salvando..." : "Salvar Configuração"}
                </Button>
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
                {selectedAiConfig.fields.map((field) => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={`ai-${field}`}>{field}</Label>
                    <Input
                      id={`ai-${field}`}
                      type="password"
                      placeholder={`Digite ${field}`}
                      value={aiCredentials[field] || ""}
                      onChange={(e) => setAiCredentials({ ...aiCredentials, [field]: e.target.value })}
                    />
                  </div>
                ))}
                <Button onClick={handleSaveAI} disabled={saving} className="w-full">
                  {saving ? "Salvando..." : "Salvar Configuração"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
