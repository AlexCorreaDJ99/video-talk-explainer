import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

interface ResolutionFormProps {
  analysisId: string;
  conversationId: string;
  onSave: () => void;
}

export const ResolutionForm = ({ analysisId, conversationId, onSave }: ResolutionFormProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("pendente");
  const [solucao, setSolucao] = useState("");
  const [resposta, setResposta] = useState("");
  const [respostasEnviadas, setRespostasEnviadas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddResposta = () => {
    if (resposta.trim()) {
      setRespostasEnviadas([...respostasEnviadas, resposta.trim()]);
      setResposta("");
    }
  };

  const handleRemoveResposta = (index: number) => {
    setRespostasEnviadas(respostasEnviadas.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!solucao.trim() && status !== "pendente") {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Descreva a solução aplicada antes de salvar.",
      });
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        resolucao_status: status,
        solucao_aplicada: solucao.trim() || null,
        respostas_enviadas: respostasEnviadas,
      };

      if (status === "resolvido") {
        updateData.resolvido_em = new Date().toISOString();
      }

      const { error } = await supabase
        .from("analyses")
        .update(updateData)
        .eq("id", analysisId);

      if (error) throw error;

      toast({
        title: "✅ Resolução registrada!",
        description: "As informações foram salvas com sucesso.",
      });

      onSave();
    } catch (error) {
      console.error("Erro ao salvar resolução:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar a resolução.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          Registrar Resolução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status da Resolução</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_progresso">Em Progresso</SelectItem>
              <SelectItem value="resolvido">Resolvido</SelectItem>
              <SelectItem value="nao_resolvido">Não Resolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="solucao">Como foi resolvido?</Label>
          <Textarea
            id="solucao"
            placeholder="Descreva detalhadamente a solução aplicada para este problema..."
            value={solucao}
            onChange={(e) => setSolucao(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resposta">Respostas enviadas ao cliente</Label>
          <div className="flex gap-2">
            <Textarea
              id="resposta"
              placeholder="Digite a resposta que você enviou ao cliente..."
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddResposta}
              disabled={!resposta.trim()}
            >
              Adicionar
            </Button>
          </div>
        </div>

        {respostasEnviadas.length > 0 && (
          <div className="space-y-2">
            <Label>Respostas registradas:</Label>
            <div className="space-y-2">
              {respostasEnviadas.map((resp, index) => (
                <Card key={index} className="p-3 bg-accent/5">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm flex-1">{resp}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveResposta(index)}
                    >
                      Remover
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Salvando..." : "Salvar Resolução"}
        </Button>
      </CardContent>
    </Card>
  );
};