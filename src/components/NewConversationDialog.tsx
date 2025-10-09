import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateConversation: (cliente: string, atendente: string) => void;
}

interface ClienteAcesso {
  id: string;
  cliente_nome: string;
  login: string;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onCreateConversation,
}: NewConversationDialogProps) {
  const [cliente, setCliente] = useState("");
  const [atendente, setAtendente] = useState("");
  const [clientes, setClientes] = useState<ClienteAcesso[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [isNovoCliente, setIsNovoCliente] = useState(false);

  // Carregar clientes do banco
  useEffect(() => {
    if (open) {
      loadClientes();
    }
  }, [open]);

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("acessos_clientes")
        .select("id, cliente_nome, login")
        .order("cliente_nome");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cliente.trim() && atendente.trim()) {
      onCreateConversation(cliente.trim(), atendente.trim());
      setCliente("");
      setAtendente("");
      setIsNovoCliente(false);
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
              <Label>Cliente</Label>
              {!isNovoCliente ? (
                <div className="space-y-2">
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                      >
                        {cliente
                          ? clientes.find((c) => c.cliente_nome === cliente)?.cliente_nome
                          : "Selecione um cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandGroup>
                            {clientes.map((clienteItem) => (
                              <CommandItem
                                key={clienteItem.id}
                                value={clienteItem.cliente_nome}
                                onSelect={(currentValue) => {
                                  setCliente(currentValue === cliente ? "" : clienteItem.cliente_nome);
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    cliente === clienteItem.cliente_nome ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{clienteItem.cliente_nome}</span>
                                  <span className="text-xs text-muted-foreground">{clienteItem.login}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsNovoCliente(true);
                      setCliente("");
                    }}
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Novo Cliente (não cadastrado)
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="cliente"
                    placeholder="Nome do novo cliente"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsNovoCliente(false);
                      setCliente("");
                    }}
                    className="w-full"
                  >
                    Voltar para lista de clientes
                  </Button>
                </div>
              )}
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