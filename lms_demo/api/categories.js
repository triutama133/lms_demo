import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');

    if (error) throw error;
    res.status(200).json({ success: true, categories: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
