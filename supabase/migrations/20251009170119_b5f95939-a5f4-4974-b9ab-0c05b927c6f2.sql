-- Adicionar campos para registro de resolução e histórico de respostas
ALTER TABLE public.analyses
ADD COLUMN resolucao_status text CHECK (resolucao_status IN ('pendente', 'em_progresso', 'resolvido', 'nao_resolvido')),
ADD COLUMN solucao_aplicada text,
ADD COLUMN respostas_enviadas jsonb DEFAULT '[]'::jsonb,
ADD COLUMN tempo_resolucao interval,
ADD COLUMN resolvido_em timestamp with time zone;

-- Adicionar índices para busca de casos similares
CREATE INDEX idx_analyses_categoria ON public.analyses ((analise_data->>'categoria'));
CREATE INDEX idx_analyses_urgencia ON public.analyses ((analise_data->>'urgencia'));
CREATE INDEX idx_analyses_resolucao_status ON public.analyses (resolucao_status);

-- Função para buscar casos similares resolvidos
CREATE OR REPLACE FUNCTION public.buscar_casos_similares(
  p_categoria text,
  p_problemas text[]
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  solucao_aplicada text,
  respostas_enviadas jsonb,
  tempo_resolucao interval,
  analise_data jsonb
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.conversation_id,
    a.solucao_aplicada,
    a.respostas_enviadas,
    a.tempo_resolucao,
    a.analise_data
  FROM public.analyses a
  WHERE a.resolucao_status = 'resolvido'
    AND a.analise_data->>'categoria' = p_categoria
    AND a.solucao_aplicada IS NOT NULL
  ORDER BY a.resolvido_em DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;