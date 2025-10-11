-- Criar tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome_completo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role (security definer para evitar recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Políticas para user_roles
CREATE POLICY "Usuários podem ver suas próprias roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Apenas admins podem gerenciar roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Função para criar perfil automaticamente ao cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome_completo)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nome_completo'
  );
  
  -- Criar role padrão de 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Adicionar coluna user_id nas tabelas existentes
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

-- Atualizar RLS policies para filtrar por usuário
DROP POLICY IF EXISTS "Permitir acesso público a conversas" ON public.conversations;
DROP POLICY IF EXISTS "Permitir acesso público a análises" ON public.analyses;

-- Novas políticas para conversations
CREATE POLICY "Usuários podem ver suas próprias conversas"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias conversas"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias conversas"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias conversas"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Admins podem ver todas as conversas
CREATE POLICY "Admins podem gerenciar todas conversas"
  ON public.conversations FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Novas políticas para analyses
CREATE POLICY "Usuários podem ver suas próprias análises"
  ON public.analyses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas próprias análises"
  ON public.analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias análises"
  ON public.analyses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias análises"
  ON public.analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Admins podem ver todas as análises
CREATE POLICY "Admins podem gerenciar todas análises"
  ON public.analyses FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para evidences (vinculadas através da análise)
DROP POLICY IF EXISTS "Permitir acesso público a evidências" ON public.evidences;

CREATE POLICY "Usuários podem ver evidências de suas análises"
  ON public.evidences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = evidences.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir evidências em suas análises"
  ON public.evidences FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = evidences.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar evidências de suas análises"
  ON public.evidences FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = evidences.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar evidências de suas análises"
  ON public.evidences FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      WHERE analyses.id = evidences.analysis_id
      AND analyses.user_id = auth.uid()
    )
  );

-- Admins podem gerenciar todas evidências
CREATE POLICY "Admins podem gerenciar todas evidências"
  ON public.evidences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();