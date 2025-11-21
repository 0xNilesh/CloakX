/**
 * Pool Query Utilities
 * Functions to query pool data from the Sui blockchain
 */

import { suiClient } from "./suiContract";
import { POOL_REGISTRY_ID, POOLS_TABLE_ID } from "./contractConstants";

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
  console.log(`      🔤 Converting bytes to string...`);
  console.log(`         Input bytes:`, bytes);
  console.log(`         Bytes type:`, typeof bytes);
  console.log(`         Is array:`, Array.isArray(bytes));

  if (!bytes || bytes.length === 0) {
    console.warn(`         ⚠️  Empty or null bytes array`);
    return "";
  }

  try {
    // Use TextDecoder for proper UTF-8 decoding
    const decoder = new TextDecoder('utf-8');
    const uint8Array = new Uint8Array(bytes);
    const decoded = decoder.decode(uint8Array);
    console.log(`         ✓ Decoded string: "${decoded}"`);
    return decoded;
  } catch (error) {
    console.error("         ❌ Error decoding bytes to string:", error);
    // Fallback to simple conversion
    const fallback = String.fromCharCode(...bytes);
    console.log(`         ⚠️  Using fallback: "${fallback}"`);
    return fallback;
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
  console.log("Pools Table ID:", POOLS_TABLE_ID);

  try {
    const pools: PoolData[] = [];
    let hasNextPage = true;
    let cursor: string | null | undefined = null;

    // Pagination loop - fetch all dynamic fields from the pools Table
    while (hasNextPage) {
      console.log(`\n🔍 Fetching dynamic fields from pools table${cursor ? ` (cursor: ${cursor.substring(0, 10)}...)` : ""}...`);

      const dynamicFields = await suiClient.getDynamicFields({
        parentId: POOLS_TABLE_ID, // Query the pools table directly!
        cursor,
        limit: 50, // Max 50 per page
      });

      console.log(`  • Found ${dynamicFields.data.length} fields in this page`);

      // Process each dynamic field
      for (const field of dynamicFields.data) {
        try {
          console.log(`\n  🔍 Found dynamic field:`);
          console.log(`      - Object ID: ${field.objectId}`);
          console.log(`      - Name:`, JSON.stringify(field.name, null, 2));
          console.log(`      - Type:`, field.objectType);

          // Get the dynamic field object with full details
          const fieldObject = await suiClient.getDynamicFieldObject({
            parentId: POOLS_TABLE_ID, // Query from pools table
            name: field.name,
          });

          console.log(`      - Field object data:`, JSON.stringify(fieldObject.data, null, 2));

          if (!fieldObject.data) {
            console.warn(`      ⚠️  No data in field object`);
            continue;
          }

          const content = fieldObject.data.content as any;

          if (!content || content.dataType !== 'moveObject') {
            console.warn(`      ⚠️  Invalid content type`);
            continue;
          }

          // Extract pool ID from the field name
          let poolId: number;
          const nameValue = field.name;

          if (typeof nameValue === 'object' && nameValue !== null) {
            // Field name is an object with type and value
            const value = (nameValue as any).value;
            if (typeof value === 'string') {
              poolId = parseInt(value, 10);
            } else if (typeof value === 'number') {
              poolId = value;
            } else {
              console.warn(`      ⚠️  Cannot parse pool ID from:`, value);
              continue;
            }
          } else if (typeof nameValue === 'string') {
            poolId = parseInt(nameValue, 10);
          } else if (typeof nameValue === 'number') {
            poolId = nameValue;
          } else {
            console.warn(`      ⚠️  Unknown name format:`, nameValue);
            continue;
          }

          if (isNaN(poolId)) {
            console.warn(`      ⚠️  Invalid pool ID: ${poolId}`);
            continue;
          }

          console.log(`\n  📦 Processing Pool ID: ${poolId}`);

          // Extract pool data from the 'value' field
          // The structure is: { name: poolId, value: { type: "...", fields: { Pool data } } }
          const valueObject = content.fields?.value;

          if (!valueObject) {
            console.warn(`      ⚠️  No value field in content.fields`);
            console.log(`      Available fields:`, Object.keys(content.fields || {}));
            continue;
          }

          // The actual Pool fields are nested inside value.fields
          const poolFields = valueObject.fields || valueObject;

          console.log(`      - Pool fields:`, JSON.stringify(poolFields, null, 2));

          const metadataBytes = poolFields.metadata || [];
          const active = poolFields.active !== undefined ? poolFields.active : false;
          const creator = poolFields.creator || "";

          console.log(`      - Metadata bytes:`, metadataBytes);
          console.log(`      - Metadata length:`, metadataBytes.length);

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
        } catch (fieldError: any) {
          console.error(`    ❌ Error processing field:`, fieldError);
          console.error(`       Message:`, fieldError.message);
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
