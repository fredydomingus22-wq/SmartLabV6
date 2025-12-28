-- Add current_usage column to micro_incubators if it doesn't exist
ALTER TABLE micro_incubators ADD COLUMN IF NOT EXISTS current_usage INTEGER DEFAULT 0;

-- Function to update incubator usage
CREATE OR REPLACE FUNCTION fn_update_incubator_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Determine the incubator_id (handle INSERT/UPDATE/DELETE cases)
    DECLARE
        target_incubator_id UUID;
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            target_incubator_id := OLD.incubator_id;
        ELSE
            target_incubator_id := NEW.incubator_id;
        END IF;

        -- Update the usage count for the specific incubator
        -- Counts all sessions that are currently 'incubating'
        IF target_incubator_id IS NOT NULL THEN
            UPDATE micro_incubators
            SET current_usage = (
                SELECT count(*)
                FROM micro_test_sessions
                WHERE incubator_id = target_incubator_id
                AND status = 'incubating'
            )
            WHERE id = target_incubator_id;
        END IF;

        -- If updating and incubator changed (unlikely but possible), update old one too
        IF (TG_OP = 'UPDATE' AND OLD.incubator_id IS DISTINCT FROM NEW.incubator_id) THEN
            UPDATE micro_incubators
            SET current_usage = (
                SELECT count(*)
                FROM micro_test_sessions
                WHERE incubator_id = OLD.incubator_id
                AND status = 'incubating'
            )
            WHERE id = OLD.incubator_id;
        END IF;

        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if any to avoid duplication
DROP TRIGGER IF EXISTS trigger_update_incubator_usage ON micro_test_sessions;

-- Create Trigger
CREATE TRIGGER trigger_update_incubator_usage
AFTER INSERT OR UPDATE OR DELETE ON micro_test_sessions
FOR EACH ROW
EXECUTE FUNCTION fn_update_incubator_usage();

-- Initial Recalculation for existing data
UPDATE micro_incubators
SET current_usage = (
    SELECT count(*)
    FROM micro_test_sessions
    WHERE incubator_id = micro_incubators.id
    AND status = 'incubating'
);
