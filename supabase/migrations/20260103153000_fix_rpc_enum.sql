-- Fix for 42704: Remove invalid enum cast
CREATE OR REPLACE FUNCTION update_batch_results_atomic(
  payload jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result_record jsonb;
BEGIN
  -- Iterate through the array of results
  FOR result_record IN SELECT * FROM jsonb_array_elements(payload)
  LOOP
    UPDATE lab_analysis
    SET
      value_numeric = (result_record->>'value_numeric')::numeric,
      value_text = (result_record->>'value_text'),
      is_conforming = (result_record->>'is_conforming')::boolean,
      notes = (result_record->>'notes'),
      deviation_type = (result_record->>'deviation_type'),
      lab_asset_id = (result_record->>'lab_asset_id')::uuid,
      status = (result_record->>'status')::analysis_status, -- Correct Enum Name
      signed_transaction_hash = (result_record->>'signed_transaction_hash'),
      analyzed_at = (result_record->>'analyzed_at')::timestamptz,
      analyzed_by = (result_record->>'analyzed_by')::uuid,
      updated_by = (result_record->>'updated_by')::uuid,
      updated_at = (result_record->>'updated_at')::timestamptz
    WHERE id = (result_record->>'id')::uuid;
  END LOOP;
END;
$$;
