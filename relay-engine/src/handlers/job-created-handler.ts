import { SuiEvent } from '@mysten/sui/client';
import { prisma } from '../db';
import { JobCreatedEvent } from '../types';
import { triggerTrainingPipeline } from '../pipeline/training.pipeline';

/**
 * Convert buyer public key to string
 * It can come as hex string or byte array
 */
function convertBuyerPublicKey(key: string | number[]): string {
  if (typeof key === 'string') {
    return key;
  }
  // Convert byte array to base64 string
  if (Array.isArray(key)) {
    const bytes = new Uint8Array(key);
    return Buffer.from(bytes).toString('base64');
  }
  return String(key);
}

export const handleJobCreated = async (events: SuiEvent[]) => {
  for (const event of events) {
    const data = event.parsedJson as any; // Use any for flexible parsing

    console.log(`\n📝 Job Created Event Received:`);
    console.log(`   Job ID: ${data.job_id}`);
    console.log(`   Creator: ${data.creator}`);
    console.log(`   Pool ID: ${data.pool_id}`);
    console.log(`   Price: ${data.price}`);

    const job = await prisma.job.upsert({
      where: { id: BigInt(data.job_id) },
      update: {},
      create: {
        id: BigInt(data.job_id),
        creator: data.creator,
        poolId: BigInt(data.pool_id),
        price: BigInt(data.price),
        buyerPublicKey: convertBuyerPublicKey(data.buyer_public_key),
        status: 'PENDING',
        epochs: BigInt(data.epochs),
        learningRate: BigInt(data.learning_rate),
      },
    });

    console.log(`✅ Job ${data.job_id} saved to database\n`);

    await triggerTrainingPipeline(job);
  }
};
