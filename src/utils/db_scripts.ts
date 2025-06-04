import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabaseAndResetIds() {
  try {
    console.log('🚨 Starting full database cleanup and ID reset...');

    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "rewards", "stats", "pools", "tokens" RESTART IDENTITY CASCADE;
    `);

    console.log('🎉 Database cleanup and ID reset completed successfully!');
  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabaseAndResetIds();
