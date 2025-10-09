import { useState, useEffect } from "react";
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

interface AcessoCliente {
  id: string;
  cliente_nome: string;
  login: string;
  senha: string;
  observacoes?: string;
}

interface EditAcessoDialogProps {
  acesso: AcessoCliente;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditAcessoDialog = ({ acesso, open, onOpenChange }: EditAcessoDialogProps) => {
  const [formData, setFormData] = useState({
    cliente_nome: "",
    login: "",
    senha: "",
    observacoes: "",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (acesso) {
      setFormData({
        cliente_nome: acesso.cliente_nome,
        login: acesso.login,
        senha: acesso.senha,
        observacoes: acesso.observacoes || "",
      });
    }
  }, [acesso]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("acessos_clientes")
        .update(data)
        .eq("id", acesso.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acessos-clientes"] });
      toast.success("Acesso atualizado com sucesso!");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erro ao atualizar acesso");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_nome || !formData.login || !formData.senha) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Acesso</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit_cliente_nome">
              Nome do Cliente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit_cliente_nome"
              value={formData.cliente_nome}
              onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_login">
              Login/Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit_login"
              value={formData.login}
              onChange={(e) => setFormData({ ...formData, login: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_senha">
              Senha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit_senha"
              type="text"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_observacoes">Observações</Label>
            <Textarea
              id="edit_observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
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
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
