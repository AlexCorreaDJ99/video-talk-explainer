import { useState, useEffect } from "react";
import { Loader2, Upload, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import VideoUpload from "@/components/VideoUpload";
import VideoAnalysisResults from "@/components/VideoAnalysisResults";
import { ITReportForm } from "@/components/ITReportForm";
import { ConversationsList } from "@/components/ConversationsList";
import { NewConversationDialog } from "@/components/NewConversationDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export interface VideoAnalysis {
  transcricao: string;
  segmentos: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  analise: {
    contexto: string;
    topicos: string[];
    problemas: string[];
    insights: string[];
  };
}

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<{ cliente: string; atendente: string } | null>(null);
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [conversationsRefresh, setConversationsRefresh] = useState(0);
  const { toast } = useToast();

  // Carregar conversa selecionada
  useEffect(() => {
    if (selectedConversationId) {
      loadConversation(selectedConversationId);
    }
  }, [selectedConversationId]);

  const loadConversation = async (conversationId: string) => {
    try {
      // Carregar dados da conversa
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .single();

      if (convError) throw convError;
      setCurrentConversation({ cliente: conversation.cliente, atendente: conversation.atendente });

      // Carregar análises da conversa
      const { data: analyses, error: analysesError } = await supabase
        .from("analyses")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (analysesError) throw analysesError;

      if (analyses && analyses.length > 0) {
        const lastAnalysis = analyses[0];
        setAnalysis({
          transcricao: lastAnalysis.transcricao || "",
          segmentos: [],
          analise: lastAnalysis.analise_data as any,
        });
      } else {
        setAnalysis(null);
      }

      setShowReport(false);
      setAddingEvidence(false);
    } catch (error) {
      console.error("Erro ao carregar conversa:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar conversa",
        description: "Não foi possível carregar os dados da conversa.",
      });
    }
  };

  const handleNewConversation = () => {
    setShowNewConversationDialog(true);
  };

  const handleCreateConversation = async (cliente: string, atendente: string) => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .insert({ cliente, atendente })
        .select()
        .single();

      if (error) throw error;

      setSelectedConversationId(data.id);
      setCurrentConversation({ cliente, atendente });
      setAnalysis(null);
      setShowReport(false);
      setAddingEvidence(false);
      setConversationsRefresh(prev => prev + 1);

      toast({
        title: "Conversa criada!",
        description: `Atendimento iniciado para ${cliente}`,
      });
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar conversa",
        description: "Não foi possível criar a conversa.",
      });
    }
  };

  const handleVideoUpload = async (files: File[], pastedText?: string) => {
    if (!selectedConversationId) {
      toast({
        variant: "destructive",
        title: "Atenção",
        description: "Selecione ou crie uma conversa antes de enviar arquivos.",
      });
      return;
    }

    setIsAnalyzing(true);
    if (!addingEvidence) {
      setAnalysis(null);
    }

    try {
      const formData = new FormData();
      
      files.forEach((file, index) => {
        if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
          formData.append(`media_${index}`, file);
        } else if (file.type.startsWith('image/')) {
          formData.append(`image_${index}`, file);
        }
      });

      if (pastedText) {
        formData.append('pasted_text', pastedText);
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-video`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar arquivos');
      }

      const newData = await response.json();
      
      // Salvar análise no banco
      let savedAnalysis;
      if (addingEvidence && analysis) {
        // Combinar com análise anterior
        const combinedAnalysis = {
          transcricao: `${analysis.transcricao}\n\n--- Nova Evidência ---\n${newData.transcricao}`,
          segmentos: [...analysis.segmentos, ...newData.segmentos],
          analise: {
            contexto: `${analysis.analise.contexto}\n\nContexto adicional: ${newData.analise.contexto}`,
            topicos: [...new Set([...analysis.analise.topicos, ...newData.analise.topicos])],
            problemas: [...new Set([...analysis.analise.problemas, ...newData.analise.problemas])],
            insights: [...new Set([...analysis.analise.insights, ...newData.analise.insights])],
          }
        };
        
        const { error: saveError } = await supabase
          .from("analyses")
          .insert({
            conversation_id: selectedConversationId,
            transcricao: combinedAnalysis.transcricao,
            analise_data: combinedAnalysis.analise,
          });

        if (saveError) throw saveError;
        savedAnalysis = combinedAnalysis;
      } else {
        const { error: saveError } = await supabase
          .from("analyses")
          .insert({
            conversation_id: selectedConversationId,
            transcricao: newData.transcricao,
            analise_data: newData.analise,
          });

        if (saveError) throw saveError;
        savedAnalysis = newData;
      }

      setAnalysis(savedAnalysis);
      setAddingEvidence(false);

      toast({
        title: addingEvidence ? "Novas evidências adicionadas!" : "Análise concluída!",
        description: addingEvidence ? "As evidências foram combinadas com a análise anterior." : "Seus arquivos foram processados com sucesso.",
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Não foi possível processar os arquivos",
      });
      setAddingEvidence(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="flex h-screen">
        {/* Sidebar com lista de conversas */}
        <div className="w-80 border-r bg-card p-4">
          <ConversationsList
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            onNewConversation={handleNewConversation}
            refreshTrigger={conversationsRefresh}
          />
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-12 space-y-12">
            <header className="text-center space-y-4 max-w-3xl mx-auto">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                Análise Inteligente de Mídia
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Faça upload de vídeos, áudios e imagens para análise e geração de relatório
              </p>
              {currentConversation && (
                <Card className="inline-block px-4 py-2 bg-primary/10">
                  <p className="text-sm font-medium">
                    Cliente: {currentConversation.cliente} | Atendente: {currentConversation.atendente}
                  </p>
                </Card>
              )}
            </header>

            {/* Upload Section */}
            {(!analysis || addingEvidence) && !showReport && !selectedConversationId && (
              <div className="max-w-3xl mx-auto text-center">
                <Card className="p-8">
                  <p className="text-lg text-muted-foreground">
                    Selecione uma conversa existente ou crie uma nova para começar
                  </p>
                </Card>
              </div>
            )}

            {(!analysis || addingEvidence) && !showReport && selectedConversationId && (
              <div className="max-w-3xl mx-auto">
                <VideoUpload
                  onUpload={handleVideoUpload}
                  isAnalyzing={isAnalyzing}
                />

                {isAnalyzing && (
                  <Card className="mt-8 p-8 text-center space-y-4 border-2 border-primary/20 bg-card/50 backdrop-blur">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold">
                        {addingEvidence ? "Processando novas evidências..." : "Processando seus arquivos..."}
                      </h3>
                      <p className="text-muted-foreground">
                        Estamos transcrevendo áudios, analisando imagens e processando o conteúdo. Isso pode levar alguns minutos.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Results Section */}
            {analysis && !isAnalyzing && !showReport && !addingEvidence && (
              <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-3xl font-bold">Resultados da Análise</h2>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => setAddingEvidence(true)}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Adicionar Mais Evidências
                    </Button>
                    <Button
                      onClick={() => setShowReport(true)}
                      className="flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Gerar Relatório para TI
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAnalysis(null);
                        setShowReport(false);
                        setAddingEvidence(false);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Nova Análise
                    </Button>
                  </div>
                </div>

                <VideoAnalysisResults analysis={analysis} />
              </div>
            )}

            {/* Report Section */}
            {showReport && analysis && currentConversation && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-3xl font-bold">Relatório para TI</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setShowReport(false);
                        setAddingEvidence(true);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Adicionar Mais Evidências
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowReport(false)}
                    >
                      Voltar para Análise
                    </Button>
                  </div>
                </div>
                <ITReportForm 
                  analysisData={analysis}
                  defaultValues={{
                    atendente: currentConversation.atendente,
                    cliente: currentConversation.cliente,
                  }}
                />
              </div>
            )}

            {/* Info Footer */}
            {!showReport && selectedConversationId && (
              <footer className="mt-16 text-center">
                <Card className="inline-flex items-start gap-3 p-4 bg-accent/5 border-accent/20">
                  <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-left text-sm">
                    <p className="font-medium text-foreground">
                      Vídeos: MP4, MOV, WEBM | Áudios: M4A, MP3, WAV | Imagens: JPG, PNG, WEBP
                    </p>
                    <p className="text-muted-foreground">
                      Envie múltiplos arquivos juntos para análise com mais contexto
                    </p>
                  </div>
                </Card>
              </footer>
            )}
          </div>
        </div>
      </div>

      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        onCreateConversation={handleCreateConversation}
      />
    </main>
  );
};

export default Index;
