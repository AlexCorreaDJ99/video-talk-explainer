import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface SimilarCase {
  id: string;
  conversation_id: string;
  solucao_aplicada: string;
  respostas_enviadas: string[];
  tempo_resolucao: string;
  analise_data: {
    contexto: string;
    problemas: string[];
    categoria: string;
  };
}

interface SimilarCasesPanelProps {
  categoria: string;
  problemas: string[];
}

export const SimilarCasesPanel = ({ categoria, problemas }: SimilarCasesPanelProps) => {
  const [casos, setCasos] = useState<SimilarCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimilarCases();
  }, [categoria, problemas]);

  const loadSimilarCases = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("buscar_casos_similares", {
        p_categoria: categoria,
        p_problemas: problemas,
      });

      if (error) throw error;
      
      const casosFormatados = (data || []).map((caso: any) => ({
        ...caso,
        respostas_enviadas: Array.isArray(caso.respostas_enviadas) 
          ? caso.respostas_enviadas 
          : [],
      }));
      
      setCasos(casosFormatados);
    } catch (error) {
      console.error("Erro ao buscar casos similares:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Casos Similares Resolvidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (casos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Casos Similares Resolvidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhum caso similar encontrado. Esta será a primeira resolução registrada para esta categoria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Casos Similares Resolvidos ({casos.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {casos.map((caso, index) => (
          <div key={caso.id} className="p-4 border rounded-lg space-y-3 bg-accent/5">
            <div className="flex items-center justify-between">
              <Badge variant="secondary">Caso #{index + 1}</Badge>
              {caso.tempo_resolucao && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatTempo(caso.tempo_resolucao)}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Problema:</p>
                <p className="text-sm">{caso.analise_data?.contexto?.substring(0, 150)}...</p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Solução Aplicada:</p>
                <p className="text-sm font-medium text-primary">{caso.solucao_aplicada}</p>
              </div>

              {caso.respostas_enviadas && caso.respostas_enviadas.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Respostas Enviadas:
                  </p>
                  <ul className="space-y-1">
                    {caso.respostas_enviadas.map((resposta, idx) => (
                      <li key={idx} className="text-sm pl-3 border-l-2 border-primary/30">
                        {resposta}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

function formatTempo(interval: string): string {
  const match = interval.match(/(\d+):(\d+):(\d+)/);
  if (!match) return interval;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
