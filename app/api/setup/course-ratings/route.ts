import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST() {
  try {
    // Create course_ratings table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS course_ratings (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
          review TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, course_id)
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    });

    if (tableError) {
      // Try direct table creation
      const { error: directError } = await supabase.from('course_ratings').select('id').limit(1);
      if (directError?.code === 'PGRST116') {
        // Table doesn't exist, try to create it
        console.log('Creating course_ratings table...');
        // Note: This might not work in all Supabase configurations
        // User might need to run SQL manually in Supabase dashboard
      }
    }

    // Create indexes
    const indexSQLs = [
      'CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings(course_id);',
      'CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON course_ratings(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_course_ratings_created_at ON course_ratings(created_at DESC);'
    ];

    for (const sql of indexSQLs) {
      try {
        await supabase.rpc('exec_sql', { sql });
      } catch {
        // Ignore index creation errors if rpc not available
      }
    }

    // Try to create the table using a different approach
    const { error: testError } = await supabase
      .from('course_ratings')
      .select('id')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        success: false,
        error: 'Tabel course_ratings belum dibuat. Silakan jalankan SQL berikut di Supabase Dashboard SQL Editor:',
        sql: createTableSQL.trim()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Tabel course_ratings berhasil dibuat/setup.'
    });

  } catch (error) {
    console.error('Error setting up course_ratings table:', error);
    return NextResponse.json({
      success: false,
      error: 'Gagal setup tabel course_ratings.',
      details: 'Silakan jalankan create_course_ratings_table.sql di Supabase Dashboard.'
    });
  }
}