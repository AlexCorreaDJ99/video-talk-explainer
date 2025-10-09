import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResolutionFormProps {
  analysisId: string;
  conversationId: string;
  categoria: string;
  onResolutionSaved: () => void;
}

export const ResolutionForm = ({ analysisId, conversationId, categoria, onResolutionSaved }: ResolutionFormProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("pendente");
  const [solucao, setSolucao] = useState("");
  const [respostas, setRespostas] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);

  const addResposta = () => {
    setRespostas([...respostas, ""]);
  };

  const removeResposta = (index: number) => {
    setRespostas(respostas.filter((_, i) => i !== index));
  };

  const updateResposta = (index: number, value: string) => {
    const newRespostas = [...respostas];
    newRespostas[index] = value;
    setRespostas(newRespostas);
  };

  const handleSave = async () => {
    if (!solucao.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Descreva a solução aplicada antes de salvar.",
      });
      return;
    }

    setSaving(true);
    try {
      const respostasValidas = respostas.filter(r => r.trim());
      
      const updateData: any = {
        resolucao_status: status,
        solucao_aplicada: solucao,
        respostas_enviadas: respostasValidas,
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

      onResolutionSaved();
    } catch (error) {
      console.error("Erro ao salvar resolução:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar as informações de resolução.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          Registrar Resolução
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status da Resolução</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger id="status">
              <SelectValue placeholder="Selecione o status" />
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
          <Label htmlFor="solucao">Solução Aplicada</Label>
          <Textarea
            id="solucao"
            placeholder="Descreva como o problema foi resolvido..."
            value={solucao}
            onChange={(e) => setSolucao(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Respostas Enviadas ao Cliente</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addResposta}
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Resposta
            </Button>
          </div>
          {respostas.map((resposta, index) => (
            <div key={index} className="flex gap-2">
              <Textarea
                placeholder={`Resposta ${index + 1}...`}
                value={resposta}
                onChange={(e) => updateResposta(index, e.target.value)}
                rows={2}
              />
              {respostas.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeResposta(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar Resolução"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
