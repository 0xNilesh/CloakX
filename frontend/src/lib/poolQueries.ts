/**
 * Pool Query Utilities
 * Functions to query pool data from the Sui blockchain
 */

import { suiClient } from "./suiContract";
import { POOL_REGISTRY_ID } from "./contractConstants";

/**
 * Pool data structure
 */
export interface PoolData {
  poolId: number;
  metadata: string; // Decoded from bytes
  metadataBytes: number[]; // Raw bytes
  active: boolean;
  creator: string;
}

/**
 * Convert bytes array to UTF-8 string
 * @param bytes - Array of bytes (vector<u8> from Move)
 * @returns Decoded string
 */
function bytesToString(bytes: number[]): string {
  try {
    // Use TextDecoder for proper UTF-8 decoding
    const decoder = new TextDecoder('utf-8');
    const uint8Array = new Uint8Array(bytes);
    return decoder.decode(uint8Array);
  } catch (error) {
    console.error("Error decoding bytes to string:", error);
    // Fallback to simple conversion
    return String.fromCharCode(...bytes);
  }
}

/**
 * Fetch all pools from the PoolRegistry
 * Queries dynamic fields and decodes metadata
 *
 * @returns Array of pool data with decoded metadata
 */
export async function getAllPools(): Promise<PoolData[]> {
  console.log("\n" + "=".repeat(60));
  console.log("📊 FETCHING ALL POOLS FROM BLOCKCHAIN");
  console.log("=".repeat(60));
  console.log("Pool Registry ID:", POOL_REGISTRY_ID);

  try {
    const pools: PoolData[] = [];
    let hasNextPage = true;
    let cursor: string | null | undefined = null;

    // Pagination loop - fetch all dynamic fields
    while (hasNextPage) {
      console.log(`\n🔍 Fetching dynamic fields${cursor ? ` (cursor: ${cursor.substring(0, 10)}...)` : ""}...`);

      const dynamicFields = await suiClient.getDynamicFields({
        parentId: POOL_REGISTRY_ID,
        cursor,
        limit: 50, // Max 50 per page
      });

      console.log(`  • Found ${dynamicFields.data.length} fields in this page`);

      // Process each dynamic field
      for (const field of dynamicFields.data) {
        try {
          // The field name is the pool ID (u64)
          // We need to check if this is a pools table field
          const fieldName = field.name;

          // Skip if not a valid field structure
          if (!fieldName || typeof fieldName !== 'object') {
            continue;
          }

          // Check if this is a pool entry (name type should be u64)
          const nameValue = (fieldName as any).value;

          // Try to parse pool ID
          let poolId: number;
          if (typeof nameValue === 'string') {
            poolId = parseInt(nameValue, 10);
          } else if (typeof nameValue === 'number') {
            poolId = nameValue;
          } else {
            continue; // Skip non-numeric fields
          }

          if (isNaN(poolId)) {
            continue;
          }

          console.log(`\n  📦 Processing Pool ID: ${poolId}`);

          // Get the actual pool object data
          const poolObject = await suiClient.getObject({
            id: field.objectId,
            options: {
              showContent: true,
              showType: true,
            },
          });

          // Extract pool data from the object
          if (poolObject.data && poolObject.data.content) {
            const content = poolObject.data.content as any;

            // The pool data is in the 'value' field of the dynamic field
            if (content.dataType === 'moveObject' && content.fields && content.fields.value) {
              const poolFields = content.fields.value.fields || content.fields.value;

              const metadataBytes = poolFields.metadata || [];
              const active = poolFields.active || false;
              const creator = poolFields.creator || "";

              // Decode metadata bytes to string
              const metadata = bytesToString(metadataBytes);

              const poolData: PoolData = {
                poolId,
                metadata,
                metadataBytes,
                active,
                creator,
              };

              pools.push(poolData);

              console.log(`    ✓ Pool ${poolId}:`);
              console.log(`      - Metadata (raw): [${metadataBytes.slice(0, 20).join(', ')}${metadataBytes.length > 20 ? '...' : ''}]`);
              console.log(`      - Metadata (decoded): "${metadata}"`);
              console.log(`      - Active: ${active}`);
              console.log(`      - Creator: ${creator.substring(0, 10)}...`);
            }
          }
        } catch (fieldError: any) {
          console.warn(`    ⚠️  Error processing field:`, fieldError.message);
          // Continue with next field
        }
      }

      // Check if there are more pages
      hasNextPage = dynamicFields.hasNextPage;
      cursor = dynamicFields.nextCursor;

      console.log(`\n  • Has next page: ${hasNextPage}`);
    }

    // Sort pools by ID
    pools.sort((a, b) => a.poolId - b.poolId);

    console.log("\n" + "=".repeat(60));
    console.log("✅ POOL FETCHING COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total pools found: ${pools.length}`);

    if (pools.length > 0) {
      console.log("\n📋 All Pool Metadata:");
      const metadataArray = pools.map(p => p.metadata);
      console.log(JSON.stringify(metadataArray, null, 2));

      console.log("\n📊 Pool Summary:");
      pools.forEach(pool => {
        console.log(`  • Pool ${pool.poolId}: "${pool.metadata}" (${pool.active ? 'Active' : 'Inactive'})`);
      });
    } else {
      console.log("\n⚠️  No pools found. Make sure pools are created on-chain.");
    }

    console.log("=".repeat(60) + "\n");

    return pools;
  } catch (error: any) {
    console.error("\n❌ ERROR FETCHING POOLS");
    console.error("Error:", error);
    console.error("Message:", error.message);
    console.error("=".repeat(60) + "\n");
    throw error;
  }
}

/**
 * Get pool metadata strings only
 * Returns array of decoded metadata strings like ["Healthcare", "Financial"]
 *
 * @returns Array of pool metadata strings
 */
export async function getPoolMetadataStrings(): Promise<string[]> {
  const pools = await getAllPools();
  const metadataArray = pools.map(pool => pool.metadata);

  console.log("\n🎯 Pool Metadata Strings:");
  console.log(metadataArray);

  return metadataArray;
}

/**
 * Get a specific pool by ID
 *
 * @param poolId - The pool ID to fetch
 * @returns Pool data or null if not found
 */
export async function getPoolById(poolId: number): Promise<PoolData | null> {
  console.log(`\n🔍 Fetching Pool ID: ${poolId}`);

  const pools = await getAllPools();
  const pool = pools.find(p => p.poolId === poolId);

  if (pool) {
    console.log(`✅ Found pool ${poolId}: "${pool.metadata}"`);
  } else {
    console.log(`❌ Pool ${poolId} not found`);
  }

  return pool || null;
}
