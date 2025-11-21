// Script to reset event cursors (useful when missing events)
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetCursors() {
  console.log('🔄 Resetting all event cursors...');

  const result = await prisma.cursor.deleteMany({});

  console.log(`✅ Deleted ${result.count} cursors`);
  console.log('   The relay engine will now start from the beginning');

  await prisma.$disconnect();
}

resetCursors().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
