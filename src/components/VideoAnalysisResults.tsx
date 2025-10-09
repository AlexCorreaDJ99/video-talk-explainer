import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Lightbulb, AlertTriangle, List } from "lucide-react";
import type { VideoAnalysis } from "@/pages/Index";
import { AnalysisBadge } from "@/components/AnalysisBadge";
import { SimilarCasesSuggestions } from "@/components/SimilarCasesSuggestions";
import { ResolutionForm } from "@/components/ResolutionForm";

interface VideoAnalysisResultsProps {
  analysis: VideoAnalysis;
  analysisId?: string;
  conversationId?: string;
  onResolutionSaved?: () => void;
}

const VideoAnalysisResults = ({ analysis, analysisId, conversationId, onResolutionSaved }: VideoAnalysisResultsProps) => {
  const categoria = (analysis.analise as any).categoria || "";
  const problemas = analysis.analise.problemas || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Similar Cases Suggestions */}
      {categoria && problemas.length > 0 && (
        <SimilarCasesSuggestions categoria={categoria} problemas={problemas} />
      )}

      {/* Analysis Badges */}
      {(analysis.analise as any).urgencia && (
        <Card className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-muted-foreground">Classificação:</span>
            <AnalysisBadge type="urgencia" value={(analysis.analise as any).urgencia} />
            <AnalysisBadge type="sentimento" value={(analysis.analise as any).sentimento} />
            <AnalysisBadge type="categoria" value={(analysis.analise as any).categoria} />
          </div>
          {(analysis.analise as any).resumo_curto && (
            <p className="mt-3 text-sm text-muted-foreground">
              <strong>Resumo:</strong> {(analysis.analise as any).resumo_curto}
            </p>
          )}
        </Card>
      )}

      {/* Context Summary */}
      <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-card/50 backdrop-blur">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Contexto Geral</h3>
            <p className="text-muted-foreground leading-relaxed">
              {analysis.analise.contexto}
            </p>
          </div>
        </div>
      </Card>

      {/* Analysis Tabs */}
      <Tabs defaultValue="topics" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="topics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <List className="w-4 h-4 mr-2" />
            Tópicos
          </TabsTrigger>
          <TabsTrigger value="problems" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Problemas
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
            <Lightbulb className="w-4 h-4 mr-2" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="topics" className="mt-6">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Principais Tópicos Discutidos</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.analise.topicos.map((topico, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-sm py-2 px-4 bg-primary/10 hover:bg-primary/20 transition-colors"
                >
                  {topico}
                </Badge>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="problems" className="mt-6">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Problemas Identificados</h4>
            <ul className="space-y-3">
              {analysis.analise.problemas.map((problema, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/10"
                >
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{problema}</span>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4">Insights e Observações</h4>
            <ul className="space-y-3">
              {analysis.analise.insights.map((insight, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10"
                >
                  <Lightbulb className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{insight}</span>
                </li>
              ))}
            </ul>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Full Transcription */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Transcrição Completa
        </h3>
        <ScrollArea className="h-64 w-full rounded-lg border bg-muted/30 p-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {analysis.transcricao}
          </p>
        </ScrollArea>
      </Card>

      {/* Segments Timeline */}
      {analysis.segmentos.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Timeline de Falas</h3>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {analysis.segmentos.map((segmento, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-shrink-0 text-sm font-mono text-primary">
                    {Math.floor(segmento.start / 60)}:{String(Math.floor(segmento.start % 60)).padStart(2, '0')}
                  </div>
                  <p className="text-sm flex-1">{segmento.text}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}

      {/* Resolution Form */}
      {analysisId && conversationId && (
        <ResolutionForm
          analysisId={analysisId}
          conversationId={conversationId}
          onSave={onResolutionSaved || (() => {})}
        />
      )}
    </div>
  );
};

export default VideoAnalysisResults;
