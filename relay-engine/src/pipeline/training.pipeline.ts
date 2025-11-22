import { callNautilusTraining } from "../nautilus/nautilus-client";
import { prisma } from "../db";
import { submitCompleteJob } from "../sui/complete-job";
import { getPoolContributors, getPoolDataBlobIds } from "../lib/userQueries";
import { getJobById } from "../lib/jobQueries";
import { Job } from "../types";

export async function triggerTrainingPipeline(job: Job) {
  try {
    console.log(`\n🚀 Starting training pipeline for job ${job.id}`);

    // Update job status to IN_PROGRESS
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "IN_PROGRESS" },
    });

    // Fetch full job data from blockchain to get model_wid
    console.log(`📖 Fetching job data from blockchain...`);
    const onChainJob = await getJobById(Number(job.id));

    if (!onChainJob) {
      throw new Error(`Job ${job.id} not found on blockchain`);
    }

    const modelConfigBlobId = onChainJob.modelWid;
    console.log(`   Model WID: ${modelConfigBlobId || 'not set'}`);

    if (!modelConfigBlobId || modelConfigBlobId.trim() === '') {
      throw new Error(`Model config blob ID (model_wid) not set for job ${job.id}`);
    }

    // Fetch contributors from on-chain pool registry
    const contributors = await getPoolContributors(Number(job.poolId));
    console.log(`Found ${contributors.length} contributors for pool ${job.poolId}`);

    // Fetch pool data blobs from contract
    const dataBlobIds = await getPoolDataBlobIds(job.poolId);
    console.log(`Retrieved ${dataBlobIds.length} data blob IDs`);

    if (dataBlobIds.length === 0) {
      throw new Error(`No data blobs found for pool ${job.poolId}`);
    }

    const request = {
      data_blob_ids: dataBlobIds,
      model_config_blob_id: modelConfigBlobId,
      key_id: job.creator,
      learning_rate: Number(job.learningRate),
      epochs: Number(job.epochs),
    };

    console.log(`📤 Sending training request to Nautilus enclave`);
    const nautilusResponse = await callNautilusTraining(request);

    console.log(`✅ Training completed, submitting results to blockchain`);
    await submitCompleteJob({
      jobId: job.id,
      response: nautilusResponse.response.payload,
      timestampMs: nautilusResponse.response.timestamp_ms,
      signature: nautilusResponse.signature,
    });

    // Update job status to COMPLETED
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "COMPLETED" },
    });

    console.log(`✅ Job ${job.id} completed successfully`);
  } catch (error: any) {
    console.error(`❌ Error in training pipeline for job ${job.id}:`, error.message);

    // Update job status to FAILED
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "FAILED" },
    });

    throw error;
  }
}
