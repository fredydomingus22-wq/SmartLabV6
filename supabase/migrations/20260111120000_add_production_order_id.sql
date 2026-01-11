ALTER TABLE production_batches 
ADD COLUMN IF NOT EXISTS production_order_id UUID REFERENCES production_orders(id);

CREATE INDEX IF NOT EXISTS idx_production_batches_order_id ON production_batches(production_order_id);
