-- Add signature_hash columns for electronic signatures (21 CFR Part 11)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'eight_d_reports' AND column_name = 'signature_hash') THEN
        ALTER TABLE public.eight_d_reports ADD COLUMN signature_hash TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'capa_actions' AND column_name = 'signature_hash') THEN
        ALTER TABLE public.capa_actions ADD COLUMN signature_hash TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pcc_logs' AND column_name = 'signature_hash') THEN
        ALTER TABLE public.pcc_logs ADD COLUMN signature_hash TEXT;
    END IF;
END $$;

COMMENT ON COLUMN public.eight_d_reports.signature_hash IS 'Cryptographic hash for step 8 electronic signature (21 CFR Part 11).';
COMMENT ON COLUMN public.capa_actions.signature_hash IS 'Cryptographic hash for verification electronic signature (21 CFR Part 11).';
COMMENT ON COLUMN public.pcc_logs.signature_hash IS 'Cryptographic hash for detection electronic signature (21 CFR Part 11).';
