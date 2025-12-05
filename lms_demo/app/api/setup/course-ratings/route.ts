import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  try {
    // Check if table exists by trying to query it
    await prisma.courseRating.findFirst({
      select: { id: true }
    });

    // If we can query without error, table exists
    return NextResponse.json({
      success: true,
      message: 'Tabel course_ratings sudah ada dan dapat diakses.'
    });

  } catch (error) {
    console.error('Error checking course_ratings table:', error);
    
    // If table doesn't exist or there's an error, provide migration instructions
    return NextResponse.json({
      success: false,
      error: 'Tabel course_ratings tidak dapat diakses.',
      message: 'Pastikan database migration sudah dijalankan dengan Prisma. Jalankan perintah berikut:',
      commands: [
        'npx prisma migrate deploy',
        'npx prisma generate'
      ]
    });
  }
}