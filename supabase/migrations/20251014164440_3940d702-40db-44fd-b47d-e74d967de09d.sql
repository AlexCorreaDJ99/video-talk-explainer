-- Criar tabela de empresas
CREATE TABLE public.empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar company_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL;

-- Habilitar RLS na tabela empresas
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;

-- Políticas para empresas - usuários podem ver sua própria empresa
CREATE POLICY "Usuários podem ver sua própria empresa"
ON public.empresas
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.empresa_id = empresas.id
  )
);

-- Políticas para empresas - qualquer usuário autenticado pode criar empresa
CREATE POLICY "Usuários autenticados podem criar empresas"
ON public.empresas
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Função para verificar se usuário pertence à mesma empresa
CREATE OR REPLACE FUNCTION public.mesma_empresa(user_id_1 uuid, user_id_2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p1
    JOIN public.profiles p2 ON p1.empresa_id = p2.empresa_id
    WHERE p1.id = user_id_1
    AND p2.id = user_id_2
    AND p1.empresa_id IS NOT NULL
  )
$$;

-- Atualizar política de conversas para incluir usuários da mesma empresa
DROP POLICY IF EXISTS "Usuários podem ver suas próprias conversas" ON public.conversations;

CREATE POLICY "Usuários podem ver conversas da sua empresa"
ON public.conversations
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.mesma_empresa(auth.uid(), user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Atualizar política de inserção de conversas
DROP POLICY IF EXISTS "Usuários podem inserir suas próprias conversas" ON public.conversations;

CREATE POLICY "Usuários podem inserir conversas"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Atualizar política de atualização de conversas
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias conversas" ON public.conversations;

CREATE POLICY "Usuários podem atualizar conversas da empresa"
ON public.conversations
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR public.mesma_empresa(auth.uid(), user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Atualizar política de exclusão de conversas
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias conversas" ON public.conversations;

CREATE POLICY "Usuários podem deletar conversas da empresa"
ON public.conversations
FOR DELETE
USING (
  auth.uid() = user_id 
  OR public.mesma_empresa(auth.uid(), user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Atualizar políticas de análises
DROP POLICY IF EXISTS "Usuários podem ver suas próprias análises" ON public.analyses;

CREATE POLICY "Usuários podem ver análises da empresa"
ON public.analyses
FOR SELECT
USING (
  auth.uid() = user_id 
  OR public.mesma_empresa(auth.uid(), user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Usuários podem inserir suas próprias análises" ON public.analyses;

CREATE POLICY "Usuários podem inserir análises"
ON public.analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias análises" ON public.analyses;

CREATE POLICY "Usuários podem atualizar análises da empresa"
ON public.analyses
FOR UPDATE
USING (
  auth.uid() = user_id 
  OR public.mesma_empresa(auth.uid(), user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Usuários podem deletar suas próprias análises" ON public.analyses;

CREATE POLICY "Usuários podem deletar análises da empresa"
ON public.analyses
FOR DELETE
USING (
  auth.uid() = user_id 
  OR public.mesma_empresa(auth.uid(), user_id)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Atualizar políticas de evidências
DROP POLICY IF EXISTS "Usuários podem ver evidências de suas análises" ON public.evidences;

CREATE POLICY "Usuários podem ver evidências da empresa"
ON public.evidences
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = evidences.analysis_id
    AND (
      analyses.user_id = auth.uid()
      OR public.mesma_empresa(auth.uid(), analyses.user_id)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

DROP POLICY IF EXISTS "Usuários podem inserir evidências em suas análises" ON public.evidences;

CREATE POLICY "Usuários podem inserir evidências da empresa"
ON public.evidences
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = evidences.analysis_id
    AND (
      analyses.user_id = auth.uid()
      OR public.mesma_empresa(auth.uid(), analyses.user_id)
    )
  )
);

DROP POLICY IF EXISTS "Usuários podem atualizar evidências de suas análises" ON public.evidences;

CREATE POLICY "Usuários podem atualizar evidências da empresa"
ON public.evidences
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = evidences.analysis_id
    AND (
      analyses.user_id = auth.uid()
      OR public.mesma_empresa(auth.uid(), analyses.user_id)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);

DROP POLICY IF EXISTS "Usuários podem deletar evidências de suas análises" ON public.evidences;

CREATE POLICY "Usuários podem deletar evidências da empresa"
ON public.evidences
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.analyses
    WHERE analyses.id = evidences.analysis_id
    AND (
      analyses.user_id = auth.uid()
      OR public.mesma_empresa(auth.uid(), analyses.user_id)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  )
);