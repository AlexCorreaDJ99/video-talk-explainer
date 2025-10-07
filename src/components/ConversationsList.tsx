import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, Plus, BarChart3, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnalysisBadge } from "@/components/AnalysisBadge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: string;
  cliente: string;
  atendente: string;
  created_at: string;
  updated_at: string;
  analyses?: Array<{
    analise_data: {
      urgencia?: string;
      sentimento?: string;
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
  const [loading, setLoading] = useState(true);

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

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.atendente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversas
          </h2>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              <BarChart3 className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={onNewConversation}
              className="gap-2"
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
              const lastAnalysis = conv.analyses?.[0]?.analise_data;
              return (
                <button
                  key={conv.id}
                  onClick={() => onSelectConversation(conv.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-accent ${
                    selectedConversationId === conv.id
                      ? "bg-accent border-2 border-primary"
                      : "border border-transparent"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="font-medium text-sm truncate">{conv.cliente}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      Atendente: {conv.atendente}
                    </div>
                    {lastAnalysis?.resumo_curto && (
                      <p className="text-xs text-muted-foreground truncate">
                        {lastAnalysis.resumo_curto}
                      </p>
                    )}
                     <div className="flex items-center justify-between gap-2">
                       <div className="flex flex-wrap gap-1">
                         {lastAnalysis?.urgencia && (
                           <AnalysisBadge type="urgencia" value={lastAnalysis.urgencia} size="sm" />
                         )}
                         {lastAnalysis?.sentimento && (
                           <AnalysisBadge type="sentimento" value={lastAnalysis.sentimento} size="sm" />
                         )}
                       </div>
                       <Button
                         variant="ghost"
                         size="icon"
                         onClick={(e) => handleDelete(conv.id, e)}
                         className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </Button>
                     </div>
                     <div className="text-xs text-muted-foreground mt-1">
                       {formatDistanceToNow(new Date(conv.updated_at), {
                         addSuffix: true,
                         locale: ptBR,
                       })}
                     </div>
                   </div>
                 </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}