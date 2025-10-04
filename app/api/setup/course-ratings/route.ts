import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Use service role key if available, otherwise use anon key (limited operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST() {
  try {
    // Check if table already exists by trying to query it
    const { error: testError } = await supabase
      .from('course_ratings')
      .select('id')
      .limit(1);

    if (!testError) {
      // Table already exists
      return NextResponse.json({
        success: true,
        message: 'Tabel course_ratings sudah ada.'
      });
    }

    // If we have service role key, try to create table
    if (supabaseServiceKey) {
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
        console.log('Creating course_ratings table...');
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

      // Test if table was created successfully
      const { error: finalTestError } = await supabase
        .from('course_ratings')
        .select('id')
        .limit(1);

      if (!finalTestError) {
        return NextResponse.json({
          success: true,
          message: 'Tabel course_ratings berhasil dibuat/setup.'
        });
      }
    }

    // If no service key or creation failed, provide manual instructions
    return NextResponse.json({
      success: false,
      error: 'Tabel course_ratings perlu dibuat manual.',
      message: 'Karena keterbatasan permissions, silakan jalankan SQL berikut di Supabase Dashboard SQL Editor:',
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings(course_id);
        CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON course_ratings(user_id);
        CREATE INDEX IF NOT EXISTS idx_course_ratings_created_at ON course_ratings(created_at DESC);
      `.trim()
    });

  } catch (error) {
    console.error('Error setting up course_ratings table:', error);
    return NextResponse.json({
      success: false,
      error: 'Gagal setup tabel course_ratings.',
      message: 'Jika SUPABASE_SERVICE_ROLE_KEY tidak tersedia, silakan jalankan SQL berikut di Supabase Dashboard SQL Editor:',
      sql: `
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

        CREATE INDEX IF NOT EXISTS idx_course_ratings_course_id ON course_ratings(course_id);
        CREATE INDEX IF NOT EXISTS idx_course_ratings_user_id ON course_ratings(user_id);
        CREATE INDEX IF NOT EXISTS idx_course_ratings_created_at ON course_ratings(created_at DESC);
      `.trim()
    });
  }
}