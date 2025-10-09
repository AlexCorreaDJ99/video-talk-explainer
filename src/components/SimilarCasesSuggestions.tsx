import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Lightbulb, Clock, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SimilarCasesProps {
  categoria: string;
  problemas: string[];
}

interface CasoSimilar {
  id: string;
  solucao_aplicada: string;
  respostas_enviadas: any;
  tempo_resolucao: any;
  analise_data: any;
}

export const SimilarCasesSuggestions = ({ categoria, problemas }: SimilarCasesProps) => {
  const [casos, setCasos] = useState<CasoSimilar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSimilarCases();
  }, [categoria, problemas]);

  const loadSimilarCases = async () => {
    try {
      const { data, error } = await supabase.rpc("buscar_casos_similares", {
        p_categoria: categoria,
        p_problemas: problemas,
      });

      if (error) throw error;

      setCasos((data || []) as CasoSimilar[]);
    } catch (error) {
      console.error("Erro ao buscar casos similares:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Buscando casos similares...</p>
        </CardContent>
      </Card>
    );
  }

  if (casos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Casos Similares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center">
            Nenhum caso similar resolvido encontrado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Sugestões baseadas em casos similares
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Encontramos {casos.length} {casos.length === 1 ? "caso similar" : "casos similares"} já resolvidos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {casos.map((caso, index) => (
          <div key={caso.id}>
            {index > 0 && <Separator className="my-4" />}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Caso #{index + 1}</Badge>
                {caso.tempo_resolucao && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Resolvido
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-sm font-medium mb-1">Solução aplicada:</p>
                  <Card className="p-3 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                    <p className="text-sm">{caso.solucao_aplicada}</p>
                  </Card>
                </div>

                {caso.respostas_enviadas && caso.respostas_enviadas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      Respostas que funcionaram:
                    </p>
                    <div className="space-y-2">
                      {caso.respostas_enviadas.map((resposta, idx) => (
                        <Card key={idx} className="p-3 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                          <p className="text-sm">{resposta}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};