import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateMaterialUrls() {
  console.log('Starting material URL migration from Supabase to MinIO...');

  // Get all materials with Supabase URLs
  const materials = await prisma.material.findMany({
    where: {
      pdfUrl: {
        contains: 'supabase.co'
      }
    },
    select: {
      id: true,
      pdfUrl: true,
      title: true
    }
  });

  console.log(`Found ${materials.length} materials with Supabase URLs`);

  const supabaseBaseUrl = 'https://iibsiolneijwmofwimuw.supabase.co/storage/v1/object/public/materials/';
  const minioBaseUrl = 'http://157.66.35.109:9000/ilmilms-bucket/';

  let migratedCount = 0;
  let errorCount = 0;

  for (const material of materials) {
    try {
      if (!material.pdfUrl) continue;

      // Extract filename from Supabase URL
      const filename = material.pdfUrl.replace(supabaseBaseUrl, '');

      // Create new MinIO URL
      const newUrl = minioBaseUrl + filename;

      // Update the material
      await prisma.material.update({
        where: { id: material.id },
        data: { pdfUrl: newUrl }
      });

      console.log(`✓ Migrated: ${material.title} - ${filename}`);
      migratedCount++;
    } catch (error) {
      console.error(`✗ Error migrating ${material.title}:`, error);
      errorCount++;
    }
  }

  console.log(`\nMigration completed:`);
  console.log(`- Migrated: ${migratedCount} materials`);
  console.log(`- Errors: ${errorCount} materials`);

  await prisma.$disconnect();
}

migrateMaterialUrls().catch(console.error);