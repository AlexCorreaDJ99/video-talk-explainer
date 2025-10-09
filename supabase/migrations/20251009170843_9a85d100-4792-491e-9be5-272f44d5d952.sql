-- Adicionar campos para investigação detalhada
ALTER TABLE public.analyses
ADD COLUMN IF NOT EXISTS minha_investigacao text,
ADD COLUMN IF NOT EXISTS analise_final text,
ADD COLUMN IF NOT EXISTS dados_investigacao jsonb;