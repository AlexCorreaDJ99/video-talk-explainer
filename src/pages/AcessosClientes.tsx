import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AcessosTable } from "@/components/AcessosTable";
import { AddAcessoDialog } from "@/components/AddAcessoDialog";
import { EditAcessoDialog } from "@/components/EditAcessoDialog";
import { ImportAcessosDialog } from "@/components/ImportAcessosDialog";

interface AcessoCliente {
  id: string;
  cliente_nome: string;
  login: string;
  senha: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

const AcessosClientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingAcesso, setEditingAcesso] = useState<AcessoCliente | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Buscar acessos
  const { data: acessos = [], isLoading } = useQuery({
    queryKey: ["acessos-clientes", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("acessos_clientes")
        .select("*")
        .order("cliente_nome");

      if (searchTerm) {
        query = query.ilike("cliente_nome", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        toast.error("Erro ao buscar acessos");
        throw error;
      }
      
      return data as AcessoCliente[];
    },
  });

  // Deletar acesso
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("acessos_clientes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["acessos-clientes"] });
      toast.success("Acesso deletado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao deletar acesso");
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este acesso?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Acessos de Clientes
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie logins e senhas dos seus clientes
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => setIsImportDialogOpen(true)} size="lg" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Importar Arquivo
              </Button>
              <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Acesso
              </Button>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome do cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabela */}
        <AcessosTable
          acessos={acessos}
          isLoading={isLoading}
          onEdit={setEditingAcesso}
          onDelete={handleDelete}
        />

        {/* Dialogs */}
        <AddAcessoDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />

        <ImportAcessosDialog
          open={isImportDialogOpen}
          onOpenChange={setIsImportDialogOpen}
        />

        {editingAcesso && (
          <EditAcessoDialog
            acesso={editingAcesso}
            open={!!editingAcesso}
            onOpenChange={(open) => !open && setEditingAcesso(null)}
          />
        )}
      </div>
    </div>
  );
};

export default AcessosClientes;
