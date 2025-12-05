import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: 'Unauthorized - Login required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // For registered users, allow access to default category (1) or their categories
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
    res.status(200).json(data);
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
