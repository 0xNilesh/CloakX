import { CONFIG } from '../config';
import { MLTrainingResponse } from '../nautilus/nautilus-client';
import { getAdminClient } from './sui-client';
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";

// Define the BCS schema for your struct (module-level, once)
const MLTrainingResponseBcs = bcs.struct("MLTrainingResponse", {
  model_blob_id: bcs.vector(bcs.U8),
  accuracy: bcs.U64,
  final_loss: bcs.U64,
  num_samples: bcs.U64,
  model_hash: bcs.vector(bcs.U8),
});

export async function submitCompleteJob({
  jobId,
  response,
  timestampMs,
  signature,
}: {
  jobId: bigint;
  response: MLTrainingResponse;
  timestampMs: number;
  signature: string;
}) {
  const { client, keypair } = getAdminClient();

  // Convert hex signature to Uint8Array (for vector<u8>)
  const signatureBytes = Buffer.from(signature, "hex");

  // Convert model_blob_id string to Uint8Array (assuming it's hex; change to "utf8" if it's plain text)
  const modelBlobBytes = Buffer.from(response.model_blob_id, "hex"); // or "utf8" for text

  // Prepare the struct data with correct types for BCS
  const structData = {
    model_blob_id: Array.from(modelBlobBytes), // vector<u8>
    accuracy: BigInt(Math.floor(response.accuracy)), // number → u64 (use floor/round as needed)
    final_loss: BigInt(Math.floor(response.final_loss)), // number → u64
    num_samples: BigInt(Math.floor(response.num_samples)), // number → u64
    model_hash: new Uint8Array(response.model_hash), // number[] → vector<u8>
  };

  // Serialize the struct to BCS bytes
  const responseBcsBytes = MLTrainingResponseBcs.serialize(structData).toBytes();

  const tx = new Transaction();

  tx.moveCall({
    target: `${CONFIG.CLOAKX.packageId}::${CONFIG.CLOAKX.module}::complete_job`,
    typeArguments: [],
    arguments: [
      tx.object(CONFIG.OBJECTS.ADMIN_CAP),
      tx.object(CONFIG.OBJECTS.JOB_REGISTRY),
      tx.object(CONFIG.OBJECTS.POOL_REGISTRY),
      tx.object(CONFIG.addresses.enclavePackage),
      tx.pure.u64(timestampMs),
      tx.pure(responseBcsBytes), // BCS bytes for the struct
      tx.pure.vector("u8", Array.from(signatureBytes)), // vector<u8> for signature
      tx.pure.u64(jobId.toString()),
    ],
  });

  const result = await client.signAndExecuteTransaction({
    transaction: tx,
    signer: keypair,
    requestType: "WaitForLocalExecution",
    options: {
      showEffects: true,
      showObjectChanges: true,
    },
  });

  console.log("✅ Job Completed Onchain!");
  console.log("Digest:", result.digest);
  console.log("Status:", result.effects?.status?.status || "unknown");

  return result;
}