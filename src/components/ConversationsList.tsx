import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  cliente: string;
  atendente: string;
  created_at: string;
  updated_at: string;
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
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    } finally {
      setLoading(false);
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
          <Button 
            size="sm" 
            onClick={onNewConversation}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova
          </Button>
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
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-accent ${
                  selectedConversationId === conv.id
                    ? "bg-accent border-2 border-primary"
                    : "border border-transparent"
                }`}
              >
                <div className="font-medium text-sm truncate">{conv.cliente}</div>
                <div className="text-xs text-muted-foreground truncate">
                  Atendente: {conv.atendente}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(conv.updated_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}