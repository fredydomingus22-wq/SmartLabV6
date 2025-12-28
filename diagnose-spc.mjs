import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function diagnose() {
    console.log("--- Sample Types ---");
    const { data: sampleTypes } = await supabase.from('sample_types').select('*');
    console.table(sampleTypes);

    console.log("--- Lab Analysis (Latest 5) ---");
    const { data: analysis } = await supabase.from('lab_analysis').select('id, value_numeric, analyzed_at, sample_id').limit(5);
    console.table(analysis);

    console.log("--- Samples (Latest 5) ---");
    const { data: samples } = await supabase.from('samples').select('id, code, sample_type_id').limit(5);
    console.table(samples);
}

diagnose();
