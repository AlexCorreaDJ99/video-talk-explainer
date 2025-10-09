import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface AddAcessoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddAcessoDialog = ({ open, onOpenChange }: AddAcessoDialogProps) => {
  const [formData, setFormData] = useState({
    cliente_nome: "",
    login: "",
    senha: "",
    observacoes: "",
  });

  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("acessos_clientes")
        .insert([data]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acessos-clientes"] });
      toast.success("Acesso adicionado com sucesso!");
      setFormData({ cliente_nome: "", login: "", senha: "", observacoes: "" });
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao adicionar acesso");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_nome || !formData.login || !formData.senha) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    addMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Acesso</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente_nome">
              Nome do Cliente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cliente_nome"
              value={formData.cliente_nome}
              onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
              placeholder="Ex: HASSEFE MASTER"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="login">
              Login/Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="login"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              placeholder="Ex: usuario@exemplo.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">
              Senha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="senha"
              type="text"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              placeholder="Digite a senha"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais (opcional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={addMutation.isPending}>
              {addMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
