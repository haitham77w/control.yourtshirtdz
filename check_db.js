
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qkolkhbelsuxcerhheio.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrb2xraGJlbHN1eGNlcmhoZWlvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTM5MTIxMiwiZXhwIjoyMDg2OTY3MjEyfQ.POKNsfM59dKVuC5jCTd6s7VX76UEzu4v7wrTM5tW2pQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking featured_products...');
    const { data: fp, error: fpErr } = await supabase.from('featured_products').select('*').limit(1);
    if (fpErr) console.error('featured_products error:', fpErr);
    else console.log('featured_products exists');

    console.log('Checking featured_product_variants...');
    const { data: fpv, error: fpvErr } = await supabase.from('featured_product_variants').select('*').limit(1);
    if (fpvErr) console.error('featured_product_variants error:', fpvErr);
    else console.log('featured_product_variants exists');

    console.log('Checking variants in products...');
    const { data: p, error: pErr } = await supabase.from('products').select('*, variants:product_variants(*)').limit(1);
    if (pErr) console.error('products join error:', pErr);
    else console.log('products join works');
}

check();
