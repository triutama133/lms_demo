import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Assume only admin/teacher can create
    if (decoded.role !== 'admin' && decoded.role !== 'teacher') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { title, description, category_id } = req.body;
    const final_category_id = category_id || 1; // Default to 1 if null

    const { data, error } = await supabase
      .from('courses')
      .insert([{ title, description, category_id: final_category_id, created_by: decoded.id }]);

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
