import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditClassificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentData: {
    urgencia?: string;
    sentimento?: string;
    categoria?: string;
  };
  onUpdate: () => void;
}

export function EditClassificationDialog({
  open,
  onOpenChange,
  conversationId,
  currentData,
  onUpdate,
}: EditClassificationDialogProps) {
  const { toast } = useToast();
  const [urgencia, setUrgencia] = useState(currentData.urgencia || "");
  const [sentimento, setSentimento] = useState(currentData.sentimento || "");
  const [categoria, setCategoria] = useState(currentData.categoria || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Buscar a análise relacionada à conversa
      const { data: analyses, error: fetchError } = await supabase
        .from("analyses")
        .select("id, analise_data")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      if (!analyses || analyses.length === 0) {
        throw new Error("Nenhuma análise encontrada para esta conversa");
      }

      const analysis = analyses[0];
      const currentData = typeof analysis.analise_data === 'object' && analysis.analise_data !== null 
        ? analysis.analise_data 
        : {};
      
      const updatedData = {
        ...currentData,
        urgencia,
        sentimento,
        categoria,
      };

      const { error: updateError } = await supabase
        .from("analyses")
        .update({ analise_data: updatedData })
        .eq("id", analysis.id);

      if (updateError) throw updateError;

      toast({
        title: "Classificação atualizada",
        description: "As alterações foram salvas com sucesso.",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao atualizar classificação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a classificação.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Classificação</DialogTitle>
          <DialogDescription>
            Ajuste a urgência, sentimento e categoria desta análise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="urgencia">Urgência</Label>
            <Select value={urgencia} onValueChange={setUrgencia}>
              <SelectTrigger id="urgencia">
                <SelectValue placeholder="Selecione a urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sentimento">Sentimento</Label>
            <Select value={sentimento} onValueChange={setSentimento}>
              <SelectTrigger id="sentimento">
                <SelectValue placeholder="Selecione o sentimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positivo">Positivo</SelectItem>
                <SelectItem value="neutro">Neutro</SelectItem>
                <SelectItem value="frustrado">Frustrado</SelectItem>
                <SelectItem value="irritado">Irritado</SelectItem>
                <SelectItem value="confuso">Confuso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="duvida">Dúvida</SelectItem>
                <SelectItem value="funcionalidade">Funcionalidade</SelectItem>
                <SelectItem value="pagamento">Pagamento</SelectItem>
                <SelectItem value="desempenho">Desempenho</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
