import { useState, useEffect } from "react";
import { Loader2, Upload, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import VideoUpload from "@/components/VideoUpload";
import VideoAnalysisResults from "@/components/VideoAnalysisResults";
import { ITReportForm } from "@/components/ITReportForm";
import { ConversationsList } from "@/components/ConversationsList";
import { NewConversationDialog } from "@/components/NewConversationDialog";
import { BugInvestigationForm } from "@/components/BugInvestigationForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getProviderForContent } from "@/lib/ai-config";
import { convertToWavIfNeeded } from "@/lib/audio";

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
    categoria?: string;
    urgencia?: string;
    sentimento?: string;
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
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);
  const [investigationData, setInvestigationData] = useState<any>(null);
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
        setCurrentAnalysisId(lastAnalysis.id);
        setAnalysis({
          transcricao: lastAnalysis.transcricao || "",
          segmentos: [],
          analise: lastAnalysis.analise_data as any,
        });
      } else {
        setCurrentAnalysisId(null);
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
      // Importar serviços dinamicamente
      const { getStorageMode } = await import("@/lib/storage");
      
      const storageMode = getStorageMode();

      // Construir dados para análise
      let transcricao = pastedText || '';
      const tipo = files.some(f => f.type.startsWith('video/')) ? 'vídeo' : 
                   files.some(f => f.type.startsWith('audio/')) ? 'áudio' : 'imagem';

      let newData;

      // Selecionar provedor baseado no tipo de conteúdo (roteamento Multi-AI)
      const contentType = tipo === 'áudio' ? 'audio' : tipo === 'vídeo' ? 'video' : tipo === 'imagem' ? 'imagem' : 'texto';
      const providerForType = getProviderForContent(contentType as any);
      
      // Para áudio: verificar se tem Groq/OpenAI configurado para transcrição
      const mediaFiles = files.filter(f => f.type.startsWith('video/') || f.type.startsWith('audio/'));
      const needsTranscription = mediaFiles.length > 0;
      const hasAudioProvider = providerForType && (providerForType.provider === 'groq' || providerForType.provider === 'openai') && providerForType.apiKey;
      
      // Se precisa transcrever mas não tem provedor configurado, avisar
      if (needsTranscription && !hasAudioProvider && !pastedText) {
        toast({
          variant: "destructive",
          title: "⚠️ Transcrição não disponível",
          description: "Configure Groq ou OpenAI em Configurações para transcrever áudio/vídeo automaticamente, ou cole o texto manualmente.",
          duration: 6000,
        });
      }

      // MODO REMOTO (Vercel, produção)
      if (storageMode === "remote") {
        // Se precisa transcrever E tem Groq/OpenAI configurado, usar edge function de transcrição
        if (needsTranscription && hasAudioProvider) {
          console.log(`[Remoto] Usando ${providerForType.provider} Whisper via edge function`);
          
          const transcricoes: string[] = [];
          
          for (const mediaFile of mediaFiles) {
            toast({
              title: "Transcrevendo...",
              description: `Processando ${mediaFile.name} com ${providerForType.provider.toUpperCase()}`,
            });
            
            const transcribeFormData = new FormData();
            transcribeFormData.append('file', mediaFile);
            transcribeFormData.append('provider', providerForType.provider);
            transcribeFormData.append('apiKey', providerForType.apiKey!);
            
            const transcribeResponse = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
              {
                method: 'POST',
                body: transcribeFormData,
              }
            );
            
            if (!transcribeResponse.ok) {
              const errorData = await transcribeResponse.json();
              throw new Error(errorData.error || 'Erro ao transcrever áudio');
            }
            
            const transcribeResult = await transcribeResponse.json();
            transcricoes.push(`\n\n=== TRANSCRIÇÃO: ${mediaFile.name} ===\n${transcribeResult.text}`);
          }
          
          transcricao += transcricoes.join('\n');
          
          toast({
            title: "✓ Transcrição Concluída",
            description: `${mediaFiles.length} arquivo(s) transcritos com sucesso`,
          });
        }
        
        // Agora analisar com Lovable AI (sempre usa Lovable AI para análise em modo remoto)
        const formData = new FormData();
        
        files.forEach((file, index) => {
          if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
            formData.append(`media_${index}`, file);
          } else if (file.type.startsWith('image/')) {
            formData.append(`image_${index}`, file);
          }
        });

        // Se já temos transcrição, passar como texto colado
        if (transcricao || pastedText) {
          formData.append('pasted_text', (transcricao || '') + (pastedText || ''));
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
          const errorMessage = errorData.error || 'Erro ao processar arquivos';
          
          if (errorMessage.includes('LOVABLE_API_KEY')) {
            throw new Error('❌ API Key não configurada. Entre em contato com o administrador.');
          } else if (errorMessage.includes('Limite de requisições')) {
            throw new Error('⚠️ Limite de requisições excedido. Aguarde e tente novamente.');
          } else if (errorMessage.includes('Créditos insuficientes')) {
            throw new Error('💳 Créditos insuficientes. Adicione créditos ao workspace.');
          } else {
            throw new Error(errorMessage);
          }
        }

        newData = await response.json();
      } else {
        // MODO LOCAL (desenvolvimento)
        // Modo local ou API externa configurada
        console.log("[Modo Local] Processando com provedor:", providerForType?.provider);
        console.log("[Modo Local] Modelo:", providerForType?.model || "padrão");
        
        if (!providerForType?.apiKey && providerForType?.provider !== "lovable") {
          throw new Error(`❌ Configure a API Key do ${providerForType?.provider} em Configurações antes de continuar.\n\nPasso a passo:\n1. Clique no botão "Configurações"\n2. Configure o provedor de IA desejado\n3. Insira sua API Key\n4. Selecione o modelo/versão\n5. Salve as configurações`);
        }

        // Para modo local, processar com API externa
        const { analyzeVideo } = await import("@/lib/ai-service");
        
        console.log("[Modo Local] Preparando dados para análise...");
        
        // Processar transcrição de áudio/vídeo se necessário
        const mediaFiles = files.filter(f => f.type.startsWith('video/') || f.type.startsWith('audio/'));
        const hasMediaFiles = mediaFiles.length > 0;
        
        if (hasMediaFiles && !pastedText) {
          console.log(`[Modo Local] Detectados ${mediaFiles.length} arquivo(s) de mídia para transcrição`);
          
          const { transcribeAudio } = await import("@/lib/ai-service");
          const transcricoes: string[] = [];
          
          for (const mediaFile of mediaFiles) {
            console.log(`[Modo Local] Transcrevendo: ${mediaFile.name}...`);
            
            toast({
              title: "Transcrevendo...",
              description: `Processando ${mediaFile.name}`,
            });
            
            let fileToSend = mediaFile;
            const ext = mediaFile.name.split('.')?.pop()?.toLowerCase();
            const supportedExt = ['mp3','mp4','mpeg','mpga','m4a','wav','webm'];
            const isOgg = mediaFile.type === 'audio/ogg' || mediaFile.type === 'application/ogg' || ext === 'ogg';

            // Whisper suporta MP4 diretamente! Só converter formatos não suportados (OGG)
            if (isOgg && !supportedExt.includes(ext || '')) {
              console.log("[Modo Local] Convertendo arquivo OGG para WAV...");
              try {
                fileToSend = await convertToWavIfNeeded(mediaFile);
              } catch (e) {
                throw new Error('Falha ao converter o áudio. Tente enviar em MP3 ou WAV.');
              }
            }
            
            const result = await transcribeAudio(fileToSend);
            
            if (result.error) {
              throw new Error(result.error.message);
            }
            
            if (result.data?.text) {
              transcricoes.push(`\n\n=== TRANSCRIÇÃO: ${mediaFile.name} ===\n${result.data.text}`);
              console.log(`[Modo Local] ✓ Transcrição concluída: ${result.data.text.length} caracteres`);
            }
          }
          
          transcricao += transcricoes.join('\n');
          
          toast({
            title: "✓ Transcrição Concluída",
            description: `${mediaFiles.length} arquivo(s) transcritos com sucesso`,
          });
        }
        
        // Construir informações dos arquivos
        if (files.length > 0) {
          transcricao += '\n\n=== ARQUIVOS ENVIADOS ===\n' + files.map((f, i) => 
            `${i + 1}. ${f.name} (${f.type}) - ${(f.size / 1024).toFixed(2)} KB`
          ).join('\n');
        }
        
        console.log("[Modo Local] Chamando serviço de análise...");

        const result = await analyzeVideo({
          transcricao,
          tipo,
        });

        if (result.error) {
          console.error("[Modo Local] Erro na análise:", result.error);
          throw new Error(result.error.message);
        }
        
        console.log("[Modo Local] ✅ Análise concluída com sucesso");

        // Parsear resultado da análise
        const analiseTexto = result.data?.resultado || '';
        let analise;
        
        try {
          // Tentar extrair JSON do resultado
          const jsonMatch = analiseTexto.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analise = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback: criar estrutura básica
            analise = {
              contexto: analiseTexto,
              topicos: [],
              problemas: [],
              insights: [],
              sentimento: 'neutro',
              urgencia: 'media',
              categoria: 'outro',
              resumo_curto: analiseTexto.substring(0, 100),
            };
          }
        } catch (e) {
          analise = {
            contexto: analiseTexto,
            topicos: [],
            problemas: [],
            insights: [],
            sentimento: 'neutro',
            urgencia: 'media',
            categoria: 'outro',
            resumo_curto: 'Análise processada',
          };
        }

        newData = {
          transcricao,
          segmentos: [],
          analise,
        };
      }
      
      // Salvar análise no banco
      let savedAnalysis;
      let savedAnalysisId;
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
        
        const { data: savedData, error: saveError } = await supabase
          .from("analyses")
          .insert({
            conversation_id: selectedConversationId,
            transcricao: combinedAnalysis.transcricao,
            analise_data: combinedAnalysis.analise,
            resolucao_status: 'pendente',
          })
          .select()
          .single();

        if (saveError) throw saveError;
        savedAnalysis = combinedAnalysis;
        savedAnalysisId = savedData.id;
      } else {
        const { data: savedData, error: saveError } = await supabase
          .from("analyses")
          .insert({
            conversation_id: selectedConversationId,
            transcricao: newData.transcricao,
            analise_data: newData.analise,
            resolucao_status: 'pendente',
          })
          .select()
          .single();

        if (saveError) throw saveError;
        savedAnalysis = newData;
        savedAnalysisId = savedData.id;
      }

      setAnalysis(savedAnalysis);
      setCurrentAnalysisId(savedAnalysisId);
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
                        setCurrentAnalysisId(null);
                        setShowReport(false);
                        setAddingEvidence(false);
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Nova Análise
                    </Button>
                  </div>
                </div>

                <VideoAnalysisResults 
                  analysis={analysis}
                  analysisId={currentAnalysisId || undefined}
                  conversationId={selectedConversationId || undefined}
                  investigationData={investigationData}
                  onResolutionSaved={() => {
                    toast({
                      title: "Sucesso!",
                      description: "Resolução salva. Este caso agora pode ajudar em futuros atendimentos similares.",
                    });
                  }}
                />

                {/* Formulário de Coleta de Dados para Investigação */}
                {currentAnalysisId && (
                  <BugInvestigationForm
                    analysisId={currentAnalysisId}
                    onDataCollected={setInvestigationData}
                  />
                )}
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
