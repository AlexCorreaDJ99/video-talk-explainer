-- Criar função para atualizar updated_at (caso não exista)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar tabela para armazenar acessos de clientes
CREATE TABLE public.acessos_clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nome TEXT NOT NULL,
  login TEXT NOT NULL,
  senha TEXT NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.acessos_clientes ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso público (já que não tem autenticação no app)
CREATE POLICY "Permitir acesso público a acessos_clientes" 
ON public.acessos_clientes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_acessos_clientes_updated_at
BEFORE UPDATE ON public.acessos_clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice para busca por nome do cliente
CREATE INDEX idx_acessos_clientes_nome ON public.acessos_clientes(cliente_nome);