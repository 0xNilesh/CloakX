/**
 * CloakX Smart Contract Interaction Functions
 * Handles all Move contract calls for the CloakX application
 */

import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import {
  POOL_REGISTRY_ID,
  JOB_REGISTRY_ID,
  FUNCTION_TARGETS,
  getTransactionUrl,
} from "./contractConstants";

/**
 * Result of register_user_data transaction
 */
export interface RegisterUserDataResult {
  success: boolean;
  digest: string;
  explorerUrl: string;
  userDataObjectId?: string;
  effects?: any;
}

/**
 * Register user data contribution to a pool
 * Creates a UserData object and registers the user in the pool
 *
 * @param signAndExecuteTransaction - Wallet's sign and execute function
 * @param poolId - The pool ID to register data to
 * @param walrusBlobId - The Walrus blob ID (string) where encrypted data is stored
 * @returns Transaction result with digest and explorer URL
 */
export async function registerUserData(
  signAndExecuteTransaction: any,
  poolId: number,
  walrusBlobId: string
): Promise<RegisterUserDataResult> {
  console.log("\n" + "=".repeat(60));
  console.log("📝 REGISTERING USER DATA ON-CHAIN");
  console.log("=".repeat(60));
  console.log("Pool ID:", poolId);
  console.log("Walrus Blob ID:", walrusBlobId);
  console.log("Pool Registry:", POOL_REGISTRY_ID);
  console.log("Function Target:", FUNCTION_TARGETS.REGISTER_USER_DATA);

  try {
    // Create transaction
    const tx = new Transaction();

    // Convert Walrus blob ID string to vector<u8>
    // The blob ID is a base64-like string, we need to convert it to bytes
    const encoder = new TextEncoder();
    const walrusIdBytes = encoder.encode(walrusBlobId);

    console.log("\n📦 Transaction Parameters:");
    console.log("  • Pool Registry (shared object):", POOL_REGISTRY_ID);
    console.log("  • Pool ID (u64):", poolId);
    console.log("  • Walrus ID bytes length:", walrusIdBytes.length);
    console.log("  • Walrus ID (first 50 chars):", walrusBlobId.substring(0, 50) + "...");

    // Build the Move call
    tx.moveCall({
      target: FUNCTION_TARGETS.REGISTER_USER_DATA,
      arguments: [
        tx.object(POOL_REGISTRY_ID), // registry: &mut PoolRegistry
        tx.pure(bcs.u64().serialize(poolId).toBytes()), // pool_id: u64
        tx.pure(bcs.vector(bcs.u8()).serialize(walrusIdBytes).toBytes()), // walrus_id: vector<u8>
      ],
    });

    console.log("\n🔐 Signing and executing transaction...");
    console.log("⏳ Waiting for wallet confirmation...");

    // Sign and execute transaction
    const result = await signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    console.log("\n✅ Transaction executed successfully!");
    console.log("Transaction Digest:", result.digest);

    // Extract UserData object ID from object changes
    let userDataObjectId: string | undefined;
    if (result.objectChanges) {
      const createdUserData = result.objectChanges.find(
        (change: any) =>
          change.type === "created" &&
          change.objectType?.includes("::user_data::UserData")
      );
      if (createdUserData) {
        userDataObjectId = (createdUserData as any).objectId;
        console.log("UserData Object Created:", userDataObjectId);
      }
    }

    const explorerUrl = getTransactionUrl(result.digest);
    console.log("Explorer URL:", explorerUrl);

    // Check transaction status
    const status = result.effects?.status?.status;
    console.log("Transaction Status:", status);

    if (status !== "success") {
      throw new Error(`Transaction failed with status: ${status}`);
    }

    console.log("=".repeat(60) + "\n");

    return {
      success: true,
      digest: result.digest,
      explorerUrl,
      userDataObjectId,
      effects: result.effects,
    };
  } catch (error: any) {
    console.error("\n❌ REGISTER USER DATA FAILED");
    console.error("Error:", error);
    console.error("Error message:", error.message);
    console.error("=".repeat(60) + "\n");

    throw new Error(
      `Failed to register user data: ${error.message || "Unknown error"}`
    );
  }
}

/**
 * Create a new ML training job
 * Escrows SUI payment and creates a job for the enclave to process
 *
 * @param signAndExecuteTransaction - Wallet's sign and execute function
 * @param poolId - The pool ID containing the training data
 * @param modelWid - Walrus blob ID of the encrypted model schema
 * @param buyerPublicKey - User's public key for result encryption (base64 string)
 * @param epochs - Number of training epochs
 * @param learningRate - Learning rate (scaled by 10000, e.g., 0.001 = 10)
 * @param price - Price in MIST (1 SUI = 1,000,000,000 MIST)
 * @returns Transaction result
 */
export async function createJob(
  signAndExecuteTransaction: any,
  poolId: number,
  modelWid: string,
  buyerPublicKey: string,
  epochs: number,
  learningRate: number,
  price: string // in MIST as string
): Promise<any> {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 CREATING ML TRAINING JOB");
  console.log("=".repeat(60));

  try {
    const tx = new Transaction();

    // Convert parameters to bytes
    const encoder = new TextEncoder();
    const modelWidBytes = encoder.encode(modelWid);
    const publicKeyBytes = encoder.encode(buyerPublicKey);

    // Split coins for payment
    const [coin] = tx.splitCoins(tx.gas, [price]);

    // Create job
    tx.moveCall({
      target: FUNCTION_TARGETS.CREATE_JOB,
      arguments: [
        tx.object(JOB_REGISTRY_ID), // reg: &mut JobRegistry
        tx.object(POOL_REGISTRY_ID), // pools: &PoolRegistry
        coin, // payment: Coin<SUI>
        tx.pure(bcs.vector(bcs.u8()).serialize(modelWidBytes).toBytes()), // model_wid
        tx.pure(bcs.vector(bcs.u8()).serialize(publicKeyBytes).toBytes()), // buyer_public_key
        tx.pure(bcs.u64().serialize(epochs).toBytes()), // epochs
        tx.pure(bcs.u64().serialize(learningRate).toBytes()), // learning_rate
        tx.pure(bcs.u64().serialize(poolId).toBytes()), // pool_id
        tx.pure(bcs.u64().serialize(BigInt(price)).toBytes()), // price
      ],
    });

    console.log("🔐 Signing and executing create_job transaction...");

    const result = await signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
      },
    });

    console.log("✅ Job created successfully!");
    console.log("Transaction Digest:", result.digest);
    console.log("Explorer URL:", getTransactionUrl(result.digest));
    console.log("=".repeat(60) + "\n");

    return result;
  } catch (error: any) {
    console.error("\n❌ CREATE JOB FAILED");
    console.error("Error:", error);
    throw new Error(`Failed to create job: ${error.message || "Unknown error"}`);
  }
}

/**
 * Claim rewards from a completed job
 *
 * @param signAndExecuteTransaction - Wallet's sign and execute function
 * @param jobId - The job ID to claim rewards from
 * @returns Transaction result
 */
export async function claimReward(
  signAndExecuteTransaction: any,
  jobId: number
): Promise<any> {
  console.log("\n" + "=".repeat(60));
  console.log("💰 CLAIMING JOB REWARD");
  console.log("=".repeat(60));
  console.log("Job ID:", jobId);

  try {
    const tx = new Transaction();

    tx.moveCall({
      target: FUNCTION_TARGETS.CLAIM_REWARD,
      arguments: [
        tx.object(JOB_REGISTRY_ID), // reg: &mut JobRegistry
        tx.pure(bcs.u64().serialize(jobId).toBytes()), // job_id
      ],
    });

    console.log("🔐 Signing and executing claim_reward transaction...");

    const result = await signAndExecuteTransaction({
      transaction: tx,
      options: {
        showEffects: true,
        showObjectChanges: true,
      },
    });

    console.log("✅ Reward claimed successfully!");
    console.log("Transaction Digest:", result.digest);
    console.log("Explorer URL:", getTransactionUrl(result.digest));
    console.log("=".repeat(60) + "\n");

    return result;
  } catch (error: any) {
    console.error("\n❌ CLAIM REWARD FAILED");
    console.error("Error:", error);
    throw new Error(`Failed to claim reward: ${error.message || "Unknown error"}`);
  }
}
