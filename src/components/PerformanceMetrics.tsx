import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle, XCircle } from "lucide-react";

interface PerformanceMetricsProps {
  totalAnalises: number;
  resolvidos: number;
  naoResolvidos: number;
  tempoMedioResolucao?: number;
}

export function PerformanceMetrics({
  totalAnalises,
  resolvidos,
  naoResolvidos,
  tempoMedioResolucao,
}: PerformanceMetricsProps) {
  const taxaResolucao = totalAnalises > 0 
    ? ((resolvidos / totalAnalises) * 100).toFixed(1)
    : "0";

  const formatTempo = (horas?: number) => {
    if (!horas) return "N/A";
    if (horas < 24) return `${horas.toFixed(1)}h`;
    const dias = Math.floor(horas / 24);
    const horasRestantes = Math.floor(horas % 24);
    return `${dias}d ${horasRestantes}h`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{taxaResolucao}%</div>
          <p className="text-xs text-muted-foreground mt-1">
            {resolvidos} de {totalAnalises} casos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTempo(tempoMedioResolucao)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Para resolver casos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{resolvidos}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Casos finalizados com sucesso
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Não Resolvidos</CardTitle>
          <XCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{naoResolvidos}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Casos sem resolução
          </p>
        </CardContent>
      </Card>
    </div>
  );
}