import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, TrendingUp, Smile, Frown, Meh } from "lucide-react";

interface AnalysisBadgeProps {
  type: "urgencia" | "sentimento" | "categoria";
  value: string;
  size?: "sm" | "default";
}

export function AnalysisBadge({ type, value, size = "default" }: AnalysisBadgeProps) {
  const getUrgenciaConfig = (urgencia: string) => {
    switch (urgencia) {
      case "critica":
        return { label: "Crítica", variant: "destructive" as const, icon: AlertCircle };
      case "alta":
        return { label: "Alta", variant: "destructive" as const, icon: TrendingUp };
      case "media":
        return { label: "Média", variant: "secondary" as const, icon: Clock };
      case "baixa":
        return { label: "Baixa", variant: "outline" as const, icon: Clock };
      default:
        return { label: urgencia, variant: "outline" as const, icon: Clock };
    }
  };

  const getSentimentoConfig = (sentimento: string) => {
    switch (sentimento) {
      case "positivo":
        return { label: "Positivo", color: "bg-green-500/10 text-green-700 border-green-500/20", icon: Smile };
      case "neutro":
        return { label: "Neutro", color: "bg-blue-500/10 text-blue-700 border-blue-500/20", icon: Meh };
      case "frustrado":
        return { label: "Frustrado", color: "bg-orange-500/10 text-orange-700 border-orange-500/20", icon: Frown };
      case "irritado":
        return { label: "Irritado", color: "bg-red-500/10 text-red-700 border-red-500/20", icon: Frown };
      case "confuso":
        return { label: "Confuso", color: "bg-purple-500/10 text-purple-700 border-purple-500/20", icon: Meh };
      default:
        return { label: sentimento, color: "bg-gray-500/10 text-gray-700 border-gray-500/20", icon: Meh };
    }
  };

  const getCategoriaConfig = (categoria: string) => {
    const configs: Record<string, { label: string; color: string }> = {
      bug: { label: "Bug", color: "bg-red-500/10 text-red-700 border-red-500/20" },
      duvida: { label: "Dúvida", color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
      funcionalidade: { label: "Funcionalidade", color: "bg-purple-500/10 text-purple-700 border-purple-500/20" },
      pagamento: { label: "Pagamento", color: "bg-green-500/10 text-green-700 border-green-500/20" },
      desempenho: { label: "Desempenho", color: "bg-orange-500/10 text-orange-700 border-orange-500/20" },
      outro: { label: "Outro", color: "bg-gray-500/10 text-gray-700 border-gray-500/20" },
    };
    return configs[categoria] || configs.outro;
  };

  if (type === "urgencia") {
    const config = getUrgenciaConfig(value);
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={size === "sm" ? "text-xs py-0 px-2" : ""}>
        <Icon className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} mr-1`} />
        {config.label}
      </Badge>
    );
  }

  if (type === "sentimento") {
    const config = getSentimentoConfig(value);
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} ${size === "sm" ? "text-xs py-0 px-2" : ""}`}>
        <Icon className={`${size === "sm" ? "w-3 h-3" : "w-4 h-4"} mr-1`} />
        {config.label}
      </Badge>
    );
  }

  if (type === "categoria") {
    const config = getCategoriaConfig(value);
    return (
      <Badge className={`${config.color} ${size === "sm" ? "text-xs py-0 px-2" : ""}`}>
        {config.label}
      </Badge>
    );
  }

  return null;
}
