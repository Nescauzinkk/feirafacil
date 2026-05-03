-- Migration: Add price_regional column to products table
-- This column stores the "Preço de Feira Regional/Fora" price type.
-- Previously this field existed only on the frontend type but was never
-- persisted to the database, causing it to be lost on page reload.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_regional NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.products.price_regional IS 'Preço para feiras regionais/fora da localidade. Opcional.';
