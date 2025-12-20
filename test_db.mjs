import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing connection to database via Prisma...');
    // Try to select from users table to test connection
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      take: 1
    });

    console.log('Connection successful!');
    console.log('Sample data:', users);
  } catch (err) {
    console.error('Connection failed:', err.message);
    console.error('Error details:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();