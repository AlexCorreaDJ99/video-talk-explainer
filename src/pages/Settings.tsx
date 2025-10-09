import { useState } from "react";
import { ArrowLeft, Key, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ApiConfig {
  name: string;
  key: string;
  description: string;
  envVar: string;
  status: "configured" | "not-configured";
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [apis] = useState<ApiConfig[]>([
    {
      name: "Lovable AI",
      key: "LOVABLE_API_KEY",
      description: "Análise de conteúdo e transcrição de vídeos/áudios",
      envVar: "LOVABLE_API_KEY",
      status: "configured",
    },
    {
      name: "OpenAI",
      key: "OPENAI_API_KEY",
      description: "Processamento de linguagem natural (opcional)",
      envVar: "OPENAI_API_KEY",
      status: "configured",
    },
  ]);

  const handleManageSecrets = () => {
    toast({
      title: "Gerenciar Secrets",
      description: "Use o painel do backend para adicionar ou atualizar suas API keys com segurança.",
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
            <h1 className="text-4xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">Gerencie as APIs e configurações do sistema</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              APIs Configuradas
            </CardTitle>
            <CardDescription>
              Configure as chaves de API necessárias para o funcionamento do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {apis.map((api) => (
              <div key={api.key} className="space-y-3 pb-6 border-b last:border-0 last:pb-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">{api.name}</Label>
                    <p className="text-sm text-muted-foreground">{api.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {api.status === "configured" ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 border border-green-500/20">
                        Configurada
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                        Não configurada
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={api.key} className="text-sm text-muted-foreground">
                    Nome do Secret: <code className="px-1.5 py-0.5 rounded bg-muted text-xs">{api.envVar}</code>
                  </Label>
                  <Input
                    id={api.key}
                    type="password"
                    value="••••••••••••••••"
                    disabled
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Por segurança, as API keys são gerenciadas no backend
                  </p>
                </div>
              </div>
            ))}

            <div className="pt-4 space-y-4">
              <Button onClick={handleManageSecrets} className="w-full" size="lg">
                <Key className="w-4 h-4 mr-2" />
                Gerenciar Secrets no Backend
              </Button>
              
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-start gap-2">
                  <ExternalLink className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Como adicionar uma nova API?</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Acesse o painel do backend clicando no botão acima</li>
                      <li>Navegue até a seção "Secrets"</li>
                      <li>Adicione um novo secret com o nome da variável de ambiente</li>
                      <li>Cole sua API key de forma segura</li>
                      <li>Salve e a aplicação terá acesso automaticamente</li>
                    </ol>
                  </div>
                </div>
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
