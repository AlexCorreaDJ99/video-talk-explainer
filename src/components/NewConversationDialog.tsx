import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (cliente: string, atendente: string) => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreateConversation,
}: NewConversationDialogProps) {
  const [cliente, setCliente] = useState("");
  const [atendente, setAtendente] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cliente.trim() && atendente.trim()) {
      onCreateConversation(cliente.trim(), atendente.trim());
      setCliente("");
      setAtendente("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Inicie um novo atendimento preenchendo as informações abaixo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                placeholder="Nome do cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="atendente">Atendente</Label>
              <Input
                id="atendente"
                placeholder="Seu nome"
                value={atendente}
                onChange={(e) => setAtendente(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Criar Conversa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}