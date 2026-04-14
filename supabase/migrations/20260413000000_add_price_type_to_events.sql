-- Migration: Add price_type column to events table
-- This allows the price table (Local, Regional, Resale) to be configured
-- at event creation time instead of being selected during the active event.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS price_type TEXT NOT NULL DEFAULT 'local'
    CHECK (price_type IN ('local', 'regional', 'resale'));

COMMENT ON COLUMN public.events.price_type IS 'Tabela de preço selecionada na criação do evento: local, regional ou resale';
