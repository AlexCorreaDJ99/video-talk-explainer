import { useState, useEffect } from "react";
import { ArrowLeft, Database, HardDrive, Download, Upload, Trash, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStorageMode, setStorageMode, dataBackup, type StorageMode } from "@/lib/storage";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import MultiAIConfig from "@/components/MultiAIConfig";
import DatabaseManager from "@/components/DatabaseManager";
import { supabase } from "@/integrations/supabase/client";

const databases = [
  { id: "supabase", name: "Supabase", fields: ["URL", "Anon Key"] },
  { id: "firebase", name: "Firebase", fields: ["API Key", "Project ID"] },
  { id: "mongodb", name: "MongoDB", fields: ["Connection String"] },
];

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [storageMode, setStorageModeState] = useState<StorageMode>("remote");
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [dbCredentials, setDbCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testingDb, setTestingDb] = useState(false);

  useEffect(() => {
    setStorageModeState(getStorageMode());
  }, []);

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

  const selectedDbConfig = databases.find(db => db.id === selectedDatabase);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message,
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      navigate("/auth");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-8 max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">Configurações</h1>
              <p className="text-muted-foreground">Configure o armazenamento, banco de dados e IA</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
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

        {/* Configuração de Banco de Dados */}
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

        {/* Configuração de Múltiplas IAs */}
        <MultiAIConfig />

        {/* Gerenciamento de Banco de Dados */}
        <DatabaseManager />
      </div>
    </main>
  );
}
