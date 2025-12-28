-- 20251227000003_metrology_sync.sql
-- Ensure all metrological columns exist in equipments

ALTER TABLE public.equipments 
ADD COLUMN IF NOT EXISTS model TEXT,
ADD COLUMN IF NOT EXISTS installation_date DATE,
ADD COLUMN IF NOT EXISTS criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS next_maintenance_date DATE;

-- Ensure maintenance_logs has correct types
-- Already handled by migration file, but good to check.
