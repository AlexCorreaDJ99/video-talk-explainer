import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, TrendingUp, MessageSquare, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AnalysisBadge } from "@/components/AnalysisBadge";

interface AnalysisStats {
  totalAnalises: number;
  porCategoria: Record<string, number>;
  porUrgencia: Record<string, number>;
  porSentimento: Record<string, number>;
  recentes: Array<{
    id: string;
    created_at: string;
    conversation_id: string;
    cliente: string;
    categoria: string;
    urgencia: string;
    sentimento: string;
    resumo_curto: string;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AnalysisStats>({
    totalAnalises: 0,
    porCategoria: {},
    porUrgencia: {},
    porSentimento: {},
    recentes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Carregar análises com informações da conversa
      const { data: analyses, error } = await supabase
        .from("analyses")
        .select(`
          id,
          created_at,
          analise_data,
          conversation_id,
          conversations (
            cliente,
            atendente
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const porCategoria: Record<string, number> = {};
      const porUrgencia: Record<string, number> = {};
      const porSentimento: Record<string, number> = {};
      const recentes: any[] = [];

      analyses?.forEach((analysis: any) => {
        const data = analysis.analise_data;
        
        if (data.categoria) {
          porCategoria[data.categoria] = (porCategoria[data.categoria] || 0) + 1;
        }
        if (data.urgencia) {
          porUrgencia[data.urgencia] = (porUrgencia[data.urgencia] || 0) + 1;
        }
        if (data.sentimento) {
          porSentimento[data.sentimento] = (porSentimento[data.sentimento] || 0) + 1;
        }

        if (recentes.length < 10) {
          recentes.push({
            id: analysis.id,
            created_at: analysis.created_at,
            conversation_id: analysis.conversation_id,
            cliente: analysis.conversations?.cliente || "N/A",
            categoria: data.categoria || "N/A",
            urgencia: data.urgencia || "N/A",
            sentimento: data.sentimento || "N/A",
            resumo_curto: data.resumo_curto || data.contexto?.substring(0, 100) || "Sem resumo",
          });
        }
      });

      setStats({
        totalAnalises: analyses?.length || 0,
        porCategoria,
        porUrgencia,
        porSentimento,
        recentes,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const categoriaData = Object.entries(stats.porCategoria).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const urgenciaData = Object.entries(stats.porUrgencia).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const sentimentoData = Object.entries(stats.porSentimento).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#6366f1"];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 flex items-center justify-center">
        <p className="text-muted-foreground">Carregando estatísticas...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold">Dashboard de Insights</h1>
            <p className="text-muted-foreground">Análise e estatísticas dos atendimentos</p>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Análises</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAnalises}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Casos Críticos</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {stats.porUrgencia.critica || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgência Alta</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {stats.porUrgencia.alta || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.porUrgencia.media || 0) + (stats.porUrgencia.baixa || 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Análises por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoriaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Urgência</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={urgenciaData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {urgenciaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Análises Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Análises Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentes.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer"
                  onClick={() => navigate("/")}
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{item.cliente}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.resumo_curto}</p>
                    <div className="flex flex-wrap gap-2">
                      <AnalysisBadge type="urgencia" value={item.urgencia} size="sm" />
                      <AnalysisBadge type="sentimento" value={item.sentimento} size="sm" />
                      <AnalysisBadge type="categoria" value={item.categoria} size="sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
