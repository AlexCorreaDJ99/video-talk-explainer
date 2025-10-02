import { useState } from "react";
import { Upload, Loader2, Video, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import VideoUpload from "@/components/VideoUpload";
import VideoAnalysisResults from "@/components/VideoAnalysisResults";

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
  const { toast } = useToast();

  const handleVideoUpload = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-video`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar vídeo');
      }

      const data = await response.json();
      setAnalysis(data);

      toast({
        title: "Análise concluída!",
        description: "Seu vídeo foi processado com sucesso.",
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Não foi possível processar o vídeo",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-card">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <header className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Análise Inteligente de Vídeos
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Faça upload do seu vídeo e obtenha transcrições automáticas, análise de contexto e identificação de problemas com IA
          </p>
        </header>

        {/* Upload Section */}
        {!analysis && (
          <div className="max-w-3xl mx-auto">
            <VideoUpload
              onUpload={handleVideoUpload}
              isAnalyzing={isAnalyzing}
            />

            {isAnalyzing && (
              <Card className="mt-8 p-8 text-center space-y-4 border-2 border-primary/20 bg-card/50 backdrop-blur">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Processando seu vídeo...</h3>
                  <p className="text-muted-foreground">
                    Estamos transcrevendo o áudio e analisando o conteúdo. Isso pode levar alguns minutos.
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Results Section */}
        {analysis && !isAnalyzing && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Resultados da Análise</h2>
              <Button
                variant="outline"
                onClick={() => setAnalysis(null)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Novo Vídeo
              </Button>
            </div>

            <VideoAnalysisResults analysis={analysis} />
          </div>
        )}

        {/* Info Footer */}
        <footer className="mt-16 text-center">
          <Card className="inline-flex items-start gap-3 p-4 bg-accent/5 border-accent/20">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div className="text-left text-sm">
              <p className="font-medium text-foreground">
                Formatos suportados: MP4, MOV, WEBM, M4A
              </p>
              <p className="text-muted-foreground">
                O processamento pode levar alguns minutos dependendo do tamanho do arquivo
              </p>
            </div>
          </Card>
        </footer>
      </div>
    </main>
  );
};

export default Index;
