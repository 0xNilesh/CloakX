import { callNautilusTraining } from "../nautilus/nautilus-client";
import { prisma } from "../db";
import { submitCompleteJob } from "../sui/complete-job";
import { getPoolContributors } from "../lib/userQueries";

export async function triggerTrainingPipeline(job: any) {
  // Fetch contributors from on-chain pool registry
  const contributors = await getPoolContributors(Number(job.poolId));

  // Fetch pool data blobs from contract
  const dataBlobIds: string[] = [];

  for (const user of contributors) {
    const blobs = await getPoolDataBlobIds(job.poolId);
    dataBlobIds.push(...blobs);
  }

  const request = {
    data_blob_ids: dataBlobIds,
    model_config_blob_id: job.modelConfigBlobId,
    key_id: job.creator,
    learning_rate: job.learningRate,
    epochs: job.epochs,
  };

  const nautilusResponse = await callNautilusTraining(request);

  await submitCompleteJob({
    jobId: job.id,
    response: nautilusResponse.response.payload,
    timestampMs: nautilusResponse.response.timestamp_ms,
    signature: nautilusResponse.signature,
  });
}
