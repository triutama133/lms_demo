import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized - Login required' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Allow access to default category (1) or user's categories
      const user_categories = [1]; // Default public for all registered
      // Optionally fetch user-specific categories if needed
      const { data: userCats } = await supabase
        .from('user_categories')
        .select('category_id')
        .eq('user_id', decoded.id);
      userCats.forEach(cat => user_categories.push(cat.category_id));

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .in('category_id', user_categories);

      if (error) throw error;
      res.status(200).json({ success: true, courses: data });
    } catch (e) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  if (req.method === 'POST') {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role !== 'teacher' && decoded.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { title, description, teacher_id, categories } = req.body;
      // If no categories, set default
      const category_ids = categories && categories.length > 0 ? categories : [1];

      const { data, error } = await supabase
        .from('courses')
        .insert([{ title, description, teacher_id, category_id: category_ids[0] }]); // Assume single category for simplicity

      if (error) throw error;
      res.status(201).json({ success: true, course: data[0] });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
}
