/**
 * User/Contributor Query Utilities
 * Functions to query contributor data from the Sui blockchain
 */

import { suiClient } from "./suiContract";
import {
  POOL_USERS_TABLE_ID,
  USER_POOLS_TABLE_ID,
  USER_DATA_TABLE_ID,
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

    console.log(`✅ Found ${contributors.length} contributors for pool ${poolId}`);
    return contributors;
  } catch (error: any) {
    console.error(`❌ Error fetching contributors:`, error.message);
    return [];
  }
}

/**
 * Get pools that a user has contributed to (contribution history)
 */
export async function getUserContributionHistory(userAddress: string): Promise<number[]> {
  console.log(`\n📜 Fetching contribution history for: ${userAddress.substring(0, 10)}...`);

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

    console.log(`✅ User contributed to ${poolIds.length} pools: ${poolIds.join(", ")}`);
    return poolIds.map((id: string) => parseInt(id, 10));
  } catch (error: any) {
    console.error(`❌ Error fetching contribution history:`, error.message);
    return [];
  }
}

/**
 * Get active datasets (pools) that a user has contributed to
 */
export async function getUserActiveDatasets(userAddress: string): Promise<PoolData[]> {
  console.log(`\n🔄 Fetching active datasets for: ${userAddress.substring(0, 10)}...`);

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
export async function getUserContributedDatasets(userAddress: string): Promise<PoolData[]> {
  console.log(`\n📊 Fetching contributed datasets for: ${userAddress.substring(0, 10)}...`);

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
