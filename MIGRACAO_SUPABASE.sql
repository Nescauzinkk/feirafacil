-- ==============================================================================
-- MIGRACAO PARA O SUPABASE (FEIRA FACIL ONLINE)
-- ==============================================================================
-- Este arquivo contém as alterações necessárias para o seu banco de dados no Supabase.
-- Copie e cole este conteúdo no "SQL Editor" do seu painel Supabase e clique em "Run".

-- 1. Adicionar configuração de preço nos eventos
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'local' 
    CHECK (price_type IN ('local', 'regional', 'resale'));

-- 2. Adicionar vínculo de produtos nas transações financeiras
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS products JSONB DEFAULT NULL;

-- 3. Criar tabela de Lista de Mercado (Shopping List) com suporte a itens manuais
CREATE TABLE IF NOT EXISTS public.shopping_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE CASCADE, -- Opcional para itens manuais
  product_name TEXT, -- Opcional para itens manuais
  manual_item_name TEXT, -- Nome para itens manuais
  manual_unit TEXT, -- Unidade para itens manuais
  quantity NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para a nova tabela
ALTER TABLE public.shopping_list ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso para o usuário
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopping_list' AND policyname = 'Users can manage their own shopping list'
  ) THEN
    CREATE POLICY "Users can manage their own shopping list" ON public.shopping_list
      FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================================================
-- FIM DA MIGRACAO
-- ==============================================================================
