-- Criar tabela de conversas/atendimentos
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente TEXT NOT NULL,
  atendente TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de análises
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  transcricao TEXT,
  analise_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar tabela de evidências
CREATE TABLE public.evidences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL, -- 'video', 'audio', 'image', 'text'
  nome_arquivo TEXT,
  conteudo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS (dados públicos para este caso de uso)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidences ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (já que não há autenticação)
CREATE POLICY "Permitir acesso público a conversas"
  ON public.conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir acesso público a análises"
  ON public.analyses
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir acesso público a evidências"
  ON public.evidences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Criar índices para melhor performance
CREATE INDEX idx_analyses_conversation ON public.analyses(conversation_id);
CREATE INDEX idx_evidences_analysis ON public.evidences(analysis_id);
CREATE INDEX idx_conversations_updated ON public.conversations(updated_at DESC);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp quando nova análise é adicionada
CREATE TRIGGER update_conversation_on_analysis
  AFTER INSERT ON public.analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_timestamp();