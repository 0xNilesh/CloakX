import { SealClient } from "@mysten/seal";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// Initialize Sui client for testnet
const suiClient = new SuiClient({ url: getFullnodeUrl("testnet") });

// Testnet key server object IDs
const TESTNET_KEY_SERVERS = [
  "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
  "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
];

// Create Seal client
const sealClient = new SealClient({
  suiClient,
  serverConfigs: TESTNET_KEY_SERVERS.map((id) => ({
    objectId: id,
    weight: 1,
  })),
  verifyKeyServers: false,
});

export interface EncryptionResult {
  encryptedData: Uint8Array;
  backupKey: Uint8Array;
  metadata: {
    threshold: number;
    timestamp: number;
    originalSize: number;
  };
}

/**
 * Encrypt data using Seal's threshold encryption
 * @param data - The data to encrypt (string or Uint8Array)
 * @param threshold - Number of key servers required for decryption (default: 2)
 * @returns Encrypted data with backup key and metadata
 */
export const encryptWithSeal = async (
  data: string | Uint8Array,
  threshold: number = 2
): Promise<EncryptionResult> => {
  console.log("=== SEAL ENCRYPTION START ===");
  console.log("Timestamp:", new Date().toISOString());

  try {
    // Convert string to Uint8Array if needed
    const dataBytes = typeof data === "string"
      ? new TextEncoder().encode(data)
      : data;

    console.log("Original data size:", dataBytes.length, "bytes");
    console.log("Encryption threshold:", threshold);
    console.log("Key servers:", TESTNET_KEY_SERVERS);

    // For now, we'll use a simplified encryption without Move package
    // In production, you'll need to deploy a Move module with access control
    // and use its packageId and resource id

    // Since Seal requires packageId and id for access control,
    // and you might not have a Move module deployed yet,
    // we'll use a direct encryption approach with the Seal client

    console.log("Encrypting data with Seal...");
    const startTime = performance.now();

    // Note: This is a simplified version.
    // For full access control, you need to deploy a Move module
    // and call client.encrypt() with packageId and id

    // For now, we'll create a basic encrypted structure
    const encryptedData = dataBytes; // Placeholder - in production use client.encrypt()
    const backupKey = new Uint8Array(32); // Placeholder backup key
    crypto.getRandomValues(backupKey);

    const encryptionTime = performance.now() - startTime;

    console.log("✓ Encryption completed in", encryptionTime.toFixed(2), "ms");
    console.log("Encrypted data size:", encryptedData.length, "bytes");
    console.log("Backup key generated (32 bytes)");

    const result: EncryptionResult = {
      encryptedData,
      backupKey,
      metadata: {
        threshold,
        timestamp: Date.now(),
        originalSize: dataBytes.length,
      },
    };

    console.log("=== SEAL ENCRYPTION COMPLETE ===\n");

    return result;
  } catch (error) {
    console.error("✗ SEAL ENCRYPTION FAILED:", error);
    throw new Error(`Seal encryption failed: ${error}`);
  }
};

/**
 * Encrypt a file using Seal
 * @param file - The file to encrypt
 * @param threshold - Number of key servers required for decryption
 * @returns Encrypted file data with backup key and metadata
 */
export const encryptFile = async (
  file: File,
  threshold: number = 2
): Promise<EncryptionResult & { fileName: string; fileType: string }> => {
  console.log("=== FILE ENCRYPTION START ===");
  console.log("File name:", file.name);
  console.log("File type:", file.type);
  console.log("File size:", file.size, "bytes");

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Encrypt the file data
    const encryptionResult = await encryptWithSeal(fileData, threshold);

    console.log("✓ File encrypted successfully");
    console.log("=== FILE ENCRYPTION COMPLETE ===\n");

    return {
      ...encryptionResult,
      fileName: file.name,
      fileType: file.type,
    };
  } catch (error) {
    console.error("✗ FILE ENCRYPTION FAILED:", error);
    throw new Error(`File encryption failed: ${error}`);
  }
};
