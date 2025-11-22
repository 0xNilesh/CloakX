/**
 * Job Query Utilities
 * Functions to query job data from the Sui blockchain
 */

import { suiClient } from "./suiContract";
import {
  JOBS_TABLE_ID,
  JOBS_BY_CREATOR_TABLE_ID,
  JOBS_BY_STATUS_TABLE_ID,
  JOB_RESULTS_TABLE_ID,
} from "./contractConstants";

/**
 * Job Status Enum (matches Move contract)
 */
export enum JobStatus {
  Pending = 0,
  Cancelled = 1,
  Completed = 2,
}

/**
 * Job data structure
 */
export interface JobData {
  jobId: number;
  objectId?: string; // Sui object ID for explorer links
  creator: string;
  poolId: number;
  modelWid: string; // Walrus blob ID (decoded from bytes)
  buyerPublicKey: string; // Base64 encoded
  epochs: number;
  learningRate: number;
  price: number; // In MIST
  status: JobStatus;
  escrowValue: number; // Remaining escrow balance
}

/**
 * Job with result (for completed jobs)
 */
export interface JobWithResult extends JobData {
  resultBlobId?: string; // Walrus blob ID of trained model
}

/**
 * Convert bytes array to UTF-8 string
 */
function bytesToString(bytes: number[]): string {
  if (!bytes || bytes.length === 0) return "";
  try {
    const decoder = new TextDecoder("utf-8");
    const uint8Array = new Uint8Array(bytes);
    return decoder.decode(uint8Array);
  } catch (error) {
    return String.fromCharCode(...bytes);
  }
}

/**
 * Convert bytes array to Base64 string
 */
function bytesToBase64(bytes: number[]): string {
  if (!bytes || bytes.length === 0) return "";
  const uint8Array = new Uint8Array(bytes);
  return btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
}

/**
 * Parse job status from Move enum
 */
function parseJobStatus(statusField: any): JobStatus {
  if (typeof statusField === "object" && statusField !== null) {
    // Handle enum variants: { Pending: true } or { Completed: true }
    if (statusField.Pending !== undefined) return JobStatus.Pending;
    if (statusField.Cancelled !== undefined) return JobStatus.Cancelled;
    if (statusField.Completed !== undefined) return JobStatus.Completed;
  }
  // Fallback: assume numeric
  return statusField as JobStatus;
}

/**
 * Fetch a single job by ID
 */
export async function getJobById(jobId: number): Promise<JobData | null> {
  console.log(`\n🔍 Fetching Job ID: ${jobId}`);

  try {
    const jobField = await suiClient.getDynamicFieldObject({
      parentId: JOBS_TABLE_ID,
      name: {
        type: "u64",
        value: jobId.toString(),
      },
    });

    if (!jobField.data?.content) {
      console.log(`❌ Job ${jobId} not found`);
      return null;
    }

    const content = jobField.data.content as any;
    if (content.dataType !== "moveObject") {
      console.log(`❌ Invalid content type for job ${jobId}`);
      return null;
    }

    const jobFields = content.fields?.value?.fields || content.fields;

    // Extract the Job object's own ID (the actual Job struct has an id field)
    // This is the correct object ID to use for explorer links
    const jobObjectId = jobFields.id?.id;

    console.log(`  Job object ID (jobFields.id.id): ${jobObjectId}`);

    const jobData: JobData = {
      jobId,
      objectId: jobObjectId, // Store the Job object ID for explorer links
      creator: jobFields.creator,
      poolId: parseInt(jobFields.pool_id, 10),
      modelWid: bytesToString(jobFields.model_wid || []),
      buyerPublicKey: bytesToBase64(jobFields.buyer_public_key || []),
      epochs: parseInt(jobFields.epochs, 10),
      learningRate: parseInt(jobFields.learning_rate, 10),
      price: parseInt(jobFields.price, 10),
      status: parseJobStatus(jobFields.status),
      escrowValue: parseInt(jobFields.escrow?.fields?.balance || "0", 10),
    };

    console.log(`✅ Found job ${jobId}: Pool ${jobData.poolId}, Status ${JobStatus[jobData.status]}`);
    return jobData;
  } catch (error: any) {
    console.error(`❌ Error fetching job ${jobId}:`, error.message);
    return null;
  }
}

/**
 * Get all jobs created by a specific address (buyer)
 */
export async function getJobsByCreator(creatorAddress: string): Promise<JobData[]> {
  console.log(`\n👤 Fetching jobs for creator: ${creatorAddress.substring(0, 10)}...`);

  try {
    // Step 1: Get job IDs for this creator
    const jobIdsField = await suiClient.getDynamicFieldObject({
      parentId: JOBS_BY_CREATOR_TABLE_ID,
      name: {
        type: "address",
        value: creatorAddress,
      },
    });

    if (!jobIdsField.data?.content) {
      console.log(`ℹ️  No jobs found for creator`);
      return [];
    }

    const content = jobIdsField.data.content as any;
    const jobIds = content.fields?.value || [];

    console.log(`📋 Found ${jobIds.length} jobs for creator`);

    // Step 2: Fetch each job's details
    const jobs: JobData[] = [];
    for (const jobId of jobIds) {
      const job = await getJobById(parseInt(jobId, 10));
      if (job) {
        jobs.push(job);
      }
    }

    return jobs;
  } catch (error: any) {
    console.error(`❌ Error fetching jobs by creator:`, error.message);
    return [];
  }
}

/**
 * Get all jobs by status
 */
export async function getJobsByStatus(status: JobStatus): Promise<JobData[]> {
  console.log(`\n📊 Fetching jobs with status: ${JobStatus[status]}`);

  try {
    // Step 1: Get job IDs for this status
    const jobIdsField = await suiClient.getDynamicFieldObject({
      parentId: JOBS_BY_STATUS_TABLE_ID,
      name: {
        type: "u64",
        value: status.toString(),
      },
    });

    if (!jobIdsField.data?.content) {
      console.log(`ℹ️  No jobs found with status ${JobStatus[status]}`);
      return [];
    }

    const content = jobIdsField.data.content as any;
    const jobIds = content.fields?.value || [];

    console.log(`📋 Found ${jobIds.length} jobs with status ${JobStatus[status]}`);

    // Step 2: Fetch each job's details
    const jobs: JobData[] = [];
    for (const jobId of jobIds) {
      const job = await getJobById(parseInt(jobId, 10));
      if (job) {
        jobs.push(job);
      }
    }

    return jobs;
  } catch (error: any) {
    console.error(`❌ Error fetching jobs by status:`, error.message);
    return [];
  }
}

/**
 * Get job result (Walrus blob ID of trained model)
 */
export async function getJobResult(jobId: number): Promise<string | null> {
  console.log(`\n📦 Fetching result for job ${jobId}`);

  try {
    const resultField = await suiClient.getDynamicFieldObject({
      parentId: JOB_RESULTS_TABLE_ID,
      name: {
        type: "u64",
        value: jobId.toString(),
      },
    });

    if (!resultField.data?.content) {
      console.log(`ℹ️  No result found for job ${jobId}`);
      return null;
    }

    const content = resultField.data.content as any;
    const resultBytes = content.fields?.value || [];
    const resultBlobId = bytesToString(resultBytes);

    console.log(`✅ Job ${jobId} result: ${resultBlobId}`);
    return resultBlobId;
  } catch (error: any) {
    console.error(`❌ Error fetching job result:`, error.message);
    return null;
  }
}

/**
 * Get computation history for a buyer
 * Returns jobs with their results if completed
 */
export async function getComputationHistory(buyerAddress: string): Promise<JobWithResult[]> {
  console.log(`\n📜 Fetching computation history for: ${buyerAddress.substring(0, 10)}...`);

  const jobs = await getJobsByCreator(buyerAddress);
  const jobsWithResults: JobWithResult[] = [];

  for (const job of jobs) {
    const jobWithResult: JobWithResult = { ...job };

    // Fetch result if job is completed
    if (job.status === JobStatus.Completed) {
      jobWithResult.resultBlobId = (await getJobResult(job.jobId)) || undefined;
    }

    jobsWithResults.push(jobWithResult);
  }

  console.log(`✅ Found ${jobsWithResults.length} total jobs`);
  return jobsWithResults;
}

/**
 * Calculate total spent by a buyer
 */
export async function getTotalSpentByBuyer(buyerAddress: string): Promise<number> {
  console.log(`\n💰 Calculating total spent by: ${buyerAddress.substring(0, 10)}...`);

  const jobs = await getJobsByCreator(buyerAddress);
  const totalSpent = jobs.reduce((sum, job) => sum + job.price, 0);

  console.log(`✅ Total spent: ${totalSpent} MIST (${totalSpent / 1_000_000_000} SUI)`);
  return totalSpent;
}

/**
 * Get unique datasets (pool IDs) used by a buyer
 */
export async function getDatasetsUsedByBuyer(buyerAddress: string): Promise<number[]> {
  console.log(`\n📊 Fetching datasets used by: ${buyerAddress.substring(0, 10)}...`);

  const jobs = await getJobsByCreator(buyerAddress);
  const uniquePoolIds = [...new Set(jobs.map((job) => job.poolId))];

  console.log(`✅ Used ${uniquePoolIds.length} unique datasets: ${uniquePoolIds.join(", ")}`);
  return uniquePoolIds;
}

/**
 * Get computation statistics for a buyer
 */
export interface BuyerStats {
  totalJobs: number;
  totalSpent: number; // in MIST
  pendingJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  uniqueDatasetsUsed: number;
}

export async function getBuyerStats(buyerAddress: string): Promise<BuyerStats> {
  console.log(`\n📈 Calculating buyer stats for: ${buyerAddress.substring(0, 10)}...`);

  const jobs = await getJobsByCreator(buyerAddress);

  const stats: BuyerStats = {
    totalJobs: jobs.length,
    totalSpent: jobs.reduce((sum, job) => sum + job.price, 0),
    pendingJobs: jobs.filter((job) => job.status === JobStatus.Pending).length,
    completedJobs: jobs.filter((job) => job.status === JobStatus.Completed).length,
    cancelledJobs: jobs.filter((job) => job.status === JobStatus.Cancelled).length,
    uniqueDatasetsUsed: new Set(jobs.map((job) => job.poolId)).size,
  };

  console.log(`✅ Buyer Stats:`, stats);
  return stats;
}
