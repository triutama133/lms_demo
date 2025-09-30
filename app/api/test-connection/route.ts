import { NextResponse } from 'next/server';
import { supabase } from '../../utils/supabaseClient';

export async function GET() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Supabase connection failed'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection OK',
      hasData: data && data.length > 0
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}