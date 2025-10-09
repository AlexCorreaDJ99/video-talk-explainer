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
  investigationData?: any;
  onSave: () => void;
}

export const ResolutionForm = ({ analysisId, conversationId, investigationData, onSave }: ResolutionFormProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<string>("pendente");
  const [minhaInvestigacao, setMinhaInvestigacao] = useState("");
  const [analiseFinal, setAnaliseFinal] = useState("");
  const [solucao, setSolucao] = useState("");
  const [resposta, setResposta] = useState("");
  const [respostasEnviadas, setRespostasEnviadas] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

  const handleAddResposta = () => {
    if (resposta.trim()) {
      setRespostasEnviadas([...respostasEnviadas, resposta.trim()]);
      setResposta("");
    }
  };

  const handleRemoveResposta = (index: number) => {
    setRespostasEnviadas(respostasEnviadas.filter((_, i) => i !== index));
  };

  const handleGenerateReport = async () => {
    if (!minhaInvestigacao.trim() || !analiseFinal.trim()) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Preencha sua investigação e análise final antes de gerar o relatório.",
      });
      return;
    }

    setGerandoRelatorio(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-it-report`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            investigation_data: investigationData,
            my_investigation: minhaInvestigacao,
            final_analysis: analiseFinal,
            solution: solucao,
            responses_sent: respostasEnviadas,
          }),
        }
      );

      if (!response.ok) throw new Error('Erro ao gerar relatório');

      const { report } = await response.json();

      // Baixar relatório
      const blob = new Blob([report], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-ti-${new Date().toISOString()}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "✅ Relatório gerado!",
        description: "O relatório foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: "Não foi possível gerar o relatório.",
      });
    } finally {
      setGerandoRelatorio(false);
    }
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
        minha_investigacao: minhaInvestigacao.trim() || null,
        analise_final: analiseFinal.trim() || null,
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
          <Label htmlFor="investigacao">Minha Investigação</Label>
          <Textarea
            id="investigacao"
            placeholder="Descreva o que você fez para investigar o problema: logs verificados, testes realizados, etc..."
            value={minhaInvestigacao}
            onChange={(e) => setMinhaInvestigacao(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="analise">Análise Final</Label>
          <Textarea
            id="analise"
            placeholder="Sua conclusão sobre o problema: causa raiz identificada, impacto, etc..."
            value={analiseFinal}
            onChange={(e) => setAnaliseFinal(e.target.value)}
            rows={3}
            className="resize-none"
          />
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

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Salvando..." : "Salvar Resolução"}
          </Button>
          {investigationData && (
            <Button
              onClick={handleGenerateReport}
              disabled={gerandoRelatorio}
              variant="secondary"
              className="flex-1"
            >
              {gerandoRelatorio ? "Gerando..." : "Gerar Relatório para TI"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};