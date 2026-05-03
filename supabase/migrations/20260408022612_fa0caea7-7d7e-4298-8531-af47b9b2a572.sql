
-- INGREDIENTS
CREATE TABLE public.ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'un',
  quantity numeric NOT NULL DEFAULT 0,
  cost_per_unit numeric NOT NULL DEFAULT 0,
  low_stock_threshold numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ingredients" ON public.ingredients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'un',
  price numeric NOT NULL DEFAULT 0,
  resale_price numeric,
  quantity numeric NOT NULL DEFAULT 0,
  recipe_id uuid,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RECIPES
CREATE TABLE public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  yields_quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recipes" ON public.recipes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RECIPE INGREDIENTS
CREATE TABLE public.recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  ingredient_id uuid REFERENCES public.ingredients(id) ON DELETE CASCADE NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'un'
);
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recipe_ingredients" ON public.recipe_ingredients FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_id AND r.user_id = auth.uid()));

-- EVENTS
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date timestamptz NOT NULL DEFAULT now(),
  duration_days int NOT NULL DEFAULT 1,
  current_day int NOT NULL DEFAULT 0,
  completed_days int[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT false,
  is_completed boolean NOT NULL DEFAULT false,
  sales_goal numeric,
  products jsonb NOT NULL DEFAULT '[]',
  product_goals jsonb NOT NULL DEFAULT '[]',
  day_goals jsonb NOT NULL DEFAULT '[]',
  preparation_costs jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON public.events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SALES
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  product_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  sold_at timestamptz NOT NULL DEFAULT now(),
  day int NOT NULL DEFAULT 1
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'expense',
  amount numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  date timestamptz NOT NULL DEFAULT now(),
  event_id uuid,
  ingredient_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PRODUCTION GOALS
CREATE TABLE public.production_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid NOT NULL,
  recipe_id uuid NOT NULL,
  target_quantity numeric NOT NULL DEFAULT 0,
  produced_quantity numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.production_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own production_goals" ON public.production_goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
