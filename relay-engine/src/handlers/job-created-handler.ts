import { SuiEvent } from '@mysten/sui/client';
import { prisma } from '../db';
import { JobCreatedEvent } from '../types';
import { triggerTrainingPipeline } from '../pipeline/training.pipeline';

export const handleJobCreated = async (events: SuiEvent[]) => {
  for (const event of events) {
    const data = event.parsedJson as JobCreatedEvent;

    const job = await prisma.job.upsert({
      where: { id: BigInt(data.job_id) },
      update: {},
      create: {
        id: BigInt(data.job_id),
        creator: data.creator,
        poolId: BigInt(data.pool_id),
        price: BigInt(data.price),
        buyerPublicKey: data.buyer_public_key,
        status: 'PENDING',
        epochs: BigInt(data.epochs),
        learningRate: BigInt(data.learning_rate),
      },
    });

    console.log(`Job Created: ${data.job_id}`);

    await triggerTrainingPipeline(job);
  }
};
