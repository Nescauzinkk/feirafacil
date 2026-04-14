-- Migration: Add products column to transactions table
-- This allows attaching multiple products and quantities to a manual income transaction
-- for automatic stock deduction.

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS products JSONB DEFAULT NULL;

COMMENT ON COLUMN public.transactions.products IS 'Lista de produtos e quantidades vinculados a esta transação: [{productId, quantity}]';
