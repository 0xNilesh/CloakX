/**
 * User/Contributor Query Utilities
 * Functions to query contributor data from the Sui blockchain
 */

import { suiClient } from "./suiContract";
import {
  POOL_USERS_TABLE_ID,
  USER_POOLS_TABLE_ID,
  POOL_DATA_TABLE_ID,
  PAYOUTS_TABLE_ID,
  JOBS_TABLE_ID,
} from "./contractConstants";
import { getPoolById, PoolData } from "./poolQueries";
import { JobData, JobStatus, getJobById } from "./jobQueries";

/**
 * Get total number of contributors in a pool
 */
export async function getPoolContributorCount(poolId: number): Promise<number> {
  console.log(`\n👥 Fetching contributor count for pool ${poolId}`);

  try {
    const poolUsersField = await suiClient.getDynamicFieldObject({
      parentId: POOL_USERS_TABLE_ID,
      name: {
        type: "u64",
        value: poolId.toString(),
      },
    });

    if (!poolUsersField.data?.content) {
      console.log(`ℹ️  Pool ${poolId} has no contributors yet`);
      return 0;
    }

    const content = poolUsersField.data.content as any;
    const addressVector = content.fields?.value || [];
    const count = Array.isArray(addressVector) ? addressVector.length : 0;

    console.log(`✅ Pool ${poolId} has ${count} contributors`);
    return count;
  } catch (error: any) {
    console.error(`❌ Error fetching contributor count:`, error.message);
    return 0;
  }
}

/**
 * Get list of contributor addresses for a pool
 */
export async function getPoolContributors(poolId: number): Promise<string[]> {
  console.log(`\n👥 Fetching contributors for pool ${poolId}`);

  try {
    const poolUsersField = await suiClient.getDynamicFieldObject({
      parentId: POOL_USERS_TABLE_ID,
      name: {
        type: "u64",
        value: poolId.toString(),
      },
    });

    if (!poolUsersField.data?.content) {
      console.log(`ℹ️  Pool ${poolId} has no contributors`);
      return [];
    }

    const content = poolUsersField.data.content as any;
    const contributors = content.fields?.value || [];

    console.log(
      `✅ Found ${contributors.length} contributors for pool ${poolId}`
    );
    return contributors;
  } catch (error: any) {
    console.error(`❌ Error fetching contributors:`, error.message);
    return [];
  }
}

/**
 * Get pools that a user has contributed to (contribution history)
 */
export async function getUserContributionHistory(
  userAddress: string
): Promise<number[]> {
  console.log(
    `\n📜 Fetching contribution history for: ${userAddress.substring(0, 10)}...`
  );

  try {
    const userPoolsField = await suiClient.getDynamicFieldObject({
      parentId: USER_POOLS_TABLE_ID,
      name: {
        type: "address",
        value: userAddress,
      },
    });

    if (!userPoolsField.data?.content) {
      console.log(`ℹ️  User has no contributions`);
      return [];
    }

    const content = userPoolsField.data.content as any;
    const poolIds = content.fields?.value || [];

    console.log(
      `✅ User contributed to ${poolIds.length} pools: ${poolIds.join(", ")}`
    );
    return poolIds.map((id: string) => parseInt(id, 10));
  } catch (error: any) {
    console.error(`❌ Error fetching contribution history:`, error.message);
    return [];
  }
}

/**
 * Get active datasets (pools) that a user has contributed to
 */
export async function getUserActiveDatasets(
  userAddress: string
): Promise<PoolData[]> {
  console.log(
    `\n🔄 Fetching active datasets for: ${userAddress.substring(0, 10)}...`
  );

  const poolIds = await getUserContributionHistory(userAddress);
  const activePools: PoolData[] = [];

  for (const poolId of poolIds) {
    const pool = await getPoolById(poolId);
    if (pool && pool.active) {
      activePools.push(pool);
    }
  }

  console.log(`✅ Found ${activePools.length} active datasets`);
  return activePools;
}

/**
 * Get all datasets (pools) with details that a user has contributed to
 */
export async function getUserContributedDatasets(
  userAddress: string
): Promise<PoolData[]> {
  console.log(
    `\n📊 Fetching contributed datasets for: ${userAddress.substring(0, 10)}...`
  );

  const poolIds = await getUserContributionHistory(userAddress);
  const pools: PoolData[] = [];

  for (const poolId of poolIds) {
    const pool = await getPoolById(poolId);
    if (pool) {
      pools.push(pool);
    }
  }

  console.log(`✅ Found ${pools.length} contributed datasets`);
  return pools;
}

/**
 * Get total pending earnings for a user (across all jobs)
 * Note: This only includes unclaimed rewards in the payouts table
 */
export async function getUserPendingEarnings(
  userAddress: string
): Promise<number> {
  console.log(
    `\n💰 Calculating pending earnings for: ${userAddress.substring(0, 10)}...`
  );

  try {
    let totalPending = 0;

    // Get all dynamic fields (job IDs) from payouts table
    let hasNextPage = true;
    let cursor: string | null | undefined = null;

    while (hasNextPage) {
      const payoutFields = await suiClient.getDynamicFields({
        parentId: PAYOUTS_TABLE_ID,
        cursor,
        limit: 50,
      });

      // For each job, check if user has pending payout
      for (const field of payoutFields.data) {
        const jobId = field.name.value;

        try {
          // Get the inner table for this job
          const innerTableField = await suiClient.getDynamicFieldObject({
            parentId: PAYOUTS_TABLE_ID,
            name: {
              type: "u64",
              value: jobId,
            },
          });

          if (!innerTableField.data?.content) continue;

          const innerContent = innerTableField.data.content as any;
          const innerTableId = innerContent.fields?.id?.id;

          if (!innerTableId) continue;

          // Query user's payout from inner table
          try {
            const userPayoutField = await suiClient.getDynamicFieldObject({
              parentId: innerTableId,
              name: {
                type: "address",
                value: userAddress,
              },
            });

            if (userPayoutField.data?.content) {
              const payoutContent = userPayoutField.data.content as any;
              const amount = parseInt(payoutContent.fields?.value || "0", 10);
              totalPending += amount;
              console.log(`  ✓ Job ${jobId}: ${amount} MIST pending`);
            }
          } catch (innerError) {
            // User has no payout for this job, continue
          }
        } catch (error) {
          // Job has no payouts table, continue
        }
      }

      hasNextPage = payoutFields.hasNextPage;
      cursor = payoutFields.nextCursor;
    }

    console.log(
      `✅ Total pending earnings: ${totalPending} MIST (${
        totalPending / 1_000_000_000
      } SUI)`
    );
    return totalPending;
  } catch (error: any) {
    console.error(`❌ Error calculating pending earnings:`, error.message);
    return 0;
  }
}

/**
 * Count how many computations (jobs) have been run on pools the user contributed to
 */
export async function getComputationsOnUserData(
  userAddress: string
): Promise<number> {
  console.log(
    `\n🔢 Counting computations on data from: ${userAddress.substring(
      0,
      10
    )}...`
  );

  // Get pools user contributed to
  const userPoolIds = await getUserContributionHistory(userAddress);

  if (userPoolIds.length === 0) {
    console.log(`ℹ️  User has no contributions`);
    return 0;
  }

  let totalComputations = 0;

  try {
    // Fetch all jobs and filter by pool_id
    let hasNextPage = true;
    let cursor: string | null | undefined = null;

    while (hasNextPage) {
      const jobFields = await suiClient.getDynamicFields({
        parentId: JOBS_TABLE_ID,
        cursor,
        limit: 50,
      });

      // For each job, check if it uses one of the user's pools
      for (const field of jobFields.data) {
        const jobId = parseInt(field.name.value, 10);
        const job = await getJobById(jobId);

        if (job && userPoolIds.includes(job.poolId)) {
          totalComputations++;
        }
      }

      hasNextPage = jobFields.hasNextPage;
      cursor = jobFields.nextCursor;
    }

    console.log(`✅ ${totalComputations} computations run on user's data`);
    return totalComputations;
  } catch (error: any) {
    console.error(`❌ Error counting computations:`, error.message);
    return 0;
  }
}

/**
 * Get detailed breakdown of computations per pool for a contributor
 */
export interface PoolComputationStats {
  poolId: number;
  poolMetadata: string;
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
}

export async function getComputationsPerPool(
  userAddress: string
): Promise<PoolComputationStats[]> {
  console.log(
    `\n📊 Fetching computation stats per pool for: ${userAddress.substring(
      0,
      10
    )}...`
  );

  const userPoolIds = await getUserContributionHistory(userAddress);
  const stats: PoolComputationStats[] = [];

  for (const poolId of userPoolIds) {
    const pool = await getPoolById(poolId);
    if (!pool) continue;

    let totalJobs = 0;
    let pendingJobs = 0;
    let completedJobs = 0;

    // Count jobs for this pool
    try {
      let hasNextPage = true;
      let cursor: string | null | undefined = null;

      while (hasNextPage) {
        const jobFields = await suiClient.getDynamicFields({
          parentId: JOBS_TABLE_ID,
          cursor,
          limit: 50,
        });

        for (const field of jobFields.data) {
          const jobId = parseInt(field.name.value, 10);
          const job = await getJobById(jobId);

          if (job && job.poolId === poolId) {
            totalJobs++;
            if (job.status === JobStatus.Pending) pendingJobs++;
            if (job.status === JobStatus.Completed) completedJobs++;
          }
        }

        hasNextPage = jobFields.hasNextPage;
        cursor = jobFields.nextCursor;
      }
    } catch (error) {
      console.error(`Error counting jobs for pool ${poolId}:`, error);
    }

    stats.push({
      poolId,
      poolMetadata: pool.metadata,
      totalJobs,
      pendingJobs,
      completedJobs,
    });
  }

  console.log(`✅ Computed stats for ${stats.length} pools`);
  return stats;
}

/**
 * Get comprehensive contributor statistics
 */
export interface ContributorStats {
  totalContributions: number; // Number of pools contributed to
  activeDatasets: number; // Number of active pools
  pendingEarnings: number; // In MIST
  totalComputations: number; // Total jobs run on user's data
  contributedPools: number[]; // Pool IDs
}

export async function getContributorStats(
  userAddress: string
): Promise<ContributorStats> {
  console.log(
    `\n📈 Calculating contributor stats for: ${userAddress.substring(0, 10)}...`
  );

  const contributedPoolIds = await getUserContributionHistory(userAddress);
  const activePools = await getUserActiveDatasets(userAddress);
  const pendingEarnings = await getUserPendingEarnings(userAddress);
  const totalComputations = await getComputationsOnUserData(userAddress);

  const stats: ContributorStats = {
    totalContributions: contributedPoolIds.length,
    activeDatasets: activePools.length,
    pendingEarnings,
    totalComputations,
    contributedPools: contributedPoolIds,
  };

  console.log(`✅ Contributor Stats:`, stats);
  return stats;
}
