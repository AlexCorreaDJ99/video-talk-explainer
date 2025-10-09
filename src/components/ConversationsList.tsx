import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Search, Plus, BarChart3, Trash2, Edit, Settings, Filter, KeyRound } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnalysisBadge } from "@/components/AnalysisBadge";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { EditClassificationDialog } from "./EditClassificationDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Conversation {
  id: string;
  cliente: string;
  atendente: string;
  created_at: string;
  updated_at: string;
  analyses?: Array<{
    id: string;
    resolucao_status?: string;
    analise_data: {
      urgencia?: string;
      sentimento?: string;
      categoria?: string;
      resumo_curto?: string;
    };
  }>;
}

interface ConversationsListProps {
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
  onNewConversation: () => void;
  refreshTrigger?: number;
}

export function ConversationsList({ 
  selectedConversationId, 
  onSelectConversation,
  onNewConversation,
  refreshTrigger 
}: ConversationsListProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUrgencia, setFilterUrgencia] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingConversation, setEditingConversation] = useState<{
    id: string;
    data: { urgencia?: string; sentimento?: string; categoria?: string };
  } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const getStatusBadge = (status?: string) => {
    const st = status || "pendente";
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pendente: { label: "Pendente", variant: "outline" },
      em_progresso: { label: "Em Progresso", variant: "secondary" },
      resolvido: { label: "Resolvido", variant: "default" },
      nao_resolvido: { label: "Não Resolvido", variant: "destructive" },
    };
    return variants[st] || variants.pendente;
  };

  useEffect(() => {
    loadConversations();
  }, [refreshTrigger]);

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          analyses (
            id,
            resolucao_status,
            analise_data
          )
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data as any || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Tem certeza que deseja apagar esta conversa? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      // Deletar evidências das análises relacionadas
      const { data: analyses } = await supabase
        .from("analyses")
        .select("id")
        .eq("conversation_id", conversationId);

      if (analyses && analyses.length > 0) {
        const analysisIds = analyses.map(a => a.id);
        await supabase
          .from("evidences")
          .delete()
          .in("analysis_id", analysisIds);
      }

      // Deletar análises
      await supabase
        .from("analyses")
        .delete()
        .eq("conversation_id", conversationId);

      // Deletar conversa
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      toast({
        title: "Conversa apagada",
        description: "A conversa foi removida com sucesso.",
      });

      loadConversations();
      
      // Se a conversa deletada estava selecionada, limpar seleção
      if (selectedConversationId === conversationId) {
        onSelectConversation(null);
      }
    } catch (error) {
      console.error("Erro ao apagar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível apagar a conversa.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (
    conversationId: string,
    data: { urgencia?: string; sentimento?: string; categoria?: string },
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingConversation({ id: conversationId, data });
    setEditDialogOpen(true);
  };

  const handleStatusChange = async (analysisId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from("analyses")
        .update({ 
          resolucao_status: newStatus,
          resolvido_em: newStatus === "resolvido" ? new Date().toISOString() : null
        })
        .eq("id", analysisId);

      if (error) throw error;

      toast({
        title: "Status atualizado!",
        description: "O status da análise foi alterado com sucesso.",
      });

      loadConversations();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status",
        description: "Não foi possível alterar o status.",
      });
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const lastAnalysis = conv.analyses?.[0];
    const matchesSearch =
      conv.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.atendente.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUrgencia = 
      filterUrgencia === "all" || 
      lastAnalysis?.analise_data?.urgencia === filterUrgencia;
    
    const matchesStatus = 
      filterStatus === "all" || 
      (lastAnalysis?.resolucao_status || "pendente") === filterStatus;
    
    const matchesCategoria = 
      filterCategoria === "all" || 
      lastAnalysis?.analise_data?.categoria === filterCategoria;

    return matchesSearch && matchesUrgencia && matchesStatus && matchesCategoria;
  });

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <Button 
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            title="Conversas"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          <div className="flex gap-2 items-center">
            <Button 
              size="icon"
              variant="outline"
              onClick={() => navigate("/dashboard")}
              title="Dashboard"
              className="h-9 w-9"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button 
              size="icon"
              variant="outline"
              onClick={() => navigate("/acessos-clientes")}
              title="Acessos de Clientes"
              className="h-9 w-9"
            >
              <KeyRound className="w-4 h-4" />
            </Button>
            <Button 
              size="icon"
              variant="outline"
              onClick={() => navigate("/settings")}
              title="Configurações"
              className="h-9 w-9"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={onNewConversation}
              className="gap-2 h-9 px-3"
            >
              <Plus className="w-4 h-4" />
              Nova
            </Button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente ou atendente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Filter className="w-4 h-4" />
              {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 mt-2">
            <Select value={filterUrgencia} onValueChange={setFilterUrgencia}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Urgências</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_progresso">Em Progresso</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="nao_resolvido">Não Resolvido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="atendimento">Atendimento</SelectItem>
                <SelectItem value="operacional">Operacional</SelectItem>
              </SelectContent>
            </Select>

            {(filterUrgencia !== "all" || filterStatus !== "all" || filterCategoria !== "all") && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setFilterUrgencia("all");
                  setFilterStatus("all");
                  setFilterCategoria("all");
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Carregando...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchTerm ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const lastAnalysis = conv.analyses?.[0];
              const statusBadge = getStatusBadge(lastAnalysis?.resolucao_status);
              return (
                <div
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full text-left p-4 rounded-lg transition-colors hover:bg-accent cursor-pointer ${
                    selectedConversationId === conv.id
                      ? "bg-accent border-2 border-primary"
                      : "border border-transparent"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate mb-1">{conv.cliente}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          Atendente: {conv.atendente}
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {lastAnalysis && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) =>
                              handleEdit(
                                conv.id,
                                {
                                  urgencia: lastAnalysis.analise_data?.urgencia,
                                  sentimento: lastAnalysis.analise_data?.sentimento,
                                  categoria: lastAnalysis.analise_data?.categoria,
                                },
                                e
                              )
                            }
                            className="h-7 w-7 hover:bg-accent"
                            title="Editar classificação"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(conv.id, e)}
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Apagar conversa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Status Select ou Badge */}
                    <div>
                      {lastAnalysis ? (
                        <Select
                          value={lastAnalysis.resolucao_status || "pendente"}
                          onValueChange={(value) => handleStatusChange(lastAnalysis.id, value, {} as React.MouseEvent)}
                        >
                          <SelectTrigger 
                            className="w-[140px] h-7 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_progresso">Em Progresso</SelectItem>
                            <SelectItem value="resolvido">Resolvido</SelectItem>
                            <SelectItem value="nao_resolvido">Não Resolvido</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-xs">Sem Análise</Badge>
                      )}
                    </div>
                    
                    {lastAnalysis?.analise_data?.resumo_curto && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {lastAnalysis.analise_data.resumo_curto}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1.5">
                      {lastAnalysis?.analise_data?.urgencia && (
                        <AnalysisBadge type="urgencia" value={lastAnalysis.analise_data.urgencia} size="sm" />
                      )}
                      {lastAnalysis?.analise_data?.sentimento && (
                        <AnalysisBadge type="sentimento" value={lastAnalysis.analise_data.sentimento} size="sm" />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {editingConversation && (
        <EditClassificationDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          conversationId={editingConversation.id}
          currentData={editingConversation.data}
          onUpdate={loadConversations}
        />
      )}
    </Card>
  );
}