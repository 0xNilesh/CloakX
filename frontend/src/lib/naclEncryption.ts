import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";
import { RECIPIENT_PUBLIC_KEY } from "./constants";

/**
 * Encrypted data structure returned by encryption function
 */
export interface EncryptedData {
  encrypted: string; // Base64 encoded encrypted data
  nonce: string; // Base64 encoded nonce
  ephemeralPublicKey: string; // Base64 encoded ephemeral public key
}

/**
 * Result of file encryption operation
 */
export interface FileEncryptionResult {
  fileName: string;
  originalSize: number;
  encryptedData: EncryptedData;
  encryptedSize: number;
}

/**
 * Encrypts a file blob using NaCl Box asymmetric encryption
 *
 * @param file - The file to encrypt
 * @param recipientPublicKey - The recipient's public key (defaults to RECIPIENT_PUBLIC_KEY)
 * @returns Promise containing encrypted data and metadata
 */
export async function encryptFileWithNaCl(
  file: File,
  recipientPublicKey: Uint8Array = RECIPIENT_PUBLIC_KEY
): Promise<FileEncryptionResult> {
  console.log("\n🔐 Starting NaCl Box Encryption");
  console.log("─".repeat(60));
  console.log("File Details:");
  console.log("  • Name:", file.name);
  console.log("  • Size:", file.size, "bytes", `(${(file.size / 1024).toFixed(2)} KB)`);
  console.log("  • Type:", file.type);
  console.log("  • Last Modified:", new Date(file.lastModified).toISOString());

  const startTime = performance.now();

  try {
    // Step 1: Read file as ArrayBuffer
    console.log("\n📖 Step 1: Reading file content...");
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    console.log("  ✓ File read successfully");
    console.log("  • Data length:", fileData.length, "bytes");

    // Step 2: Generate ephemeral keypair for this encryption
    console.log("\n🔑 Step 2: Generating ephemeral keypair...");
    const ephemeralKeypair = nacl.box.keyPair();
    console.log("  ✓ Ephemeral keypair generated");
    console.log("  • Ephemeral Public Key:", encodeBase64(ephemeralKeypair.publicKey));
    console.log("  • Ephemeral Public Key (length):", ephemeralKeypair.publicKey.length, "bytes");

    // Step 3: Generate random nonce
    console.log("\n🎲 Step 3: Generating random nonce...");
    const nonce = nacl.randomBytes(24);
    console.log("  ✓ Nonce generated");
    console.log("  • Nonce:", encodeBase64(nonce));
    console.log("  • Nonce length:", nonce.length, "bytes (required: 24 bytes)");

    // Step 4: Encrypt the file data
    console.log("\n🔒 Step 4: Encrypting file data...");
    console.log("  • Using recipient public key:", encodeBase64(recipientPublicKey));
    console.log("  • Encryption algorithm: NaCl Box (X25519-XSalsa20-Poly1305)");

    const encryptionStartTime = performance.now();
    const encrypted = nacl.box(
      fileData,
      nonce,
      recipientPublicKey,
      ephemeralKeypair.secretKey
    );
    const encryptionDuration = performance.now() - encryptionStartTime;

    if (!encrypted) {
      throw new Error("Encryption failed - nacl.box returned null");
    }

    console.log("  ✓ Encryption successful");
    console.log("  • Encrypted data length:", encrypted.length, "bytes");
    console.log("  • Encryption duration:", encryptionDuration.toFixed(2), "ms");
    console.log("  • Encryption speed:", ((fileData.length / encryptionDuration) * 1000 / 1024 / 1024).toFixed(2), "MB/s");

    // Step 5: Encode to Base64
    console.log("\n📦 Step 5: Encoding encrypted data to Base64...");
    const encryptedData: EncryptedData = {
      encrypted: encodeBase64(encrypted),
      nonce: encodeBase64(nonce),
      ephemeralPublicKey: encodeBase64(ephemeralKeypair.publicKey),
    };
    console.log("  ✓ Encoding complete");
    console.log("  • Encrypted data (Base64 length):", encryptedData.encrypted.length, "chars");

    const totalDuration = performance.now() - startTime;
    const encryptedSize = encrypted.length;

    // Step 6: Summary
    console.log("\n✅ Encryption Complete!");
    console.log("─".repeat(60));
    console.log("Summary:");
    console.log("  • Original size:", file.size, "bytes", `(${(file.size / 1024).toFixed(2)} KB)`);
    console.log("  • Encrypted size:", encryptedSize, "bytes", `(${(encryptedSize / 1024).toFixed(2)} KB)`);
    console.log("  • Size increase:", encryptedSize - file.size, "bytes", `(+${((encryptedSize - file.size) / file.size * 100).toFixed(2)}%)`);
    console.log("  • Total duration:", totalDuration.toFixed(2), "ms");
    console.log("  • Nonce:", encryptedData.nonce);
    console.log("  • Ephemeral Public Key:", encryptedData.ephemeralPublicKey);
    console.log("─".repeat(60));

    return {
      fileName: file.name,
      originalSize: file.size,
      encryptedData,
      encryptedSize,
    };
  } catch (error) {
    console.error("\n❌ Encryption Failed!");
    console.error("─".repeat(60));
    console.error("Error:", error);
    console.error("─".repeat(60));
    throw error;
  }
}

/**
 * Converts EncryptedData structure to Blob for uploading
 *
 * @param encryptedData - The encrypted data structure
 * @returns Blob containing the encrypted data
 */
export function encryptedDataToBlob(encryptedData: EncryptedData): Blob {
  console.log("\n📦 Converting encrypted data to Blob for upload...");

  // We need to store all three components: encrypted data, nonce, and ephemeral public key
  // Store as JSON for easy reconstruction during decryption
  const encryptedObject = {
    encrypted: encryptedData.encrypted,
    nonce: encryptedData.nonce,
    ephemeralPublicKey: encryptedData.ephemeralPublicKey,
  };

  const jsonString = JSON.stringify(encryptedObject);
  const blob = new Blob([jsonString], { type: "application/json" });

  console.log("  ✓ Blob created");
  console.log("  • Blob size:", blob.size, "bytes", `(${(blob.size / 1024).toFixed(2)} KB)`);
  console.log("  • Blob type:", blob.type);

  return blob;
}

/**
 * Decrypts data that was encrypted with NaCl Box
 * NOTE: This function requires the private key and should only be used in the backend
 *
 * @param encryptedData - The encrypted data structure
 * @param privateKey - The recipient's private key (should be in backend only)
 * @returns Decrypted data as Uint8Array
 */
export function decryptWithNaCl(
  encryptedData: EncryptedData,
  privateKey: Uint8Array
): Uint8Array {
  console.warn("⚠️  WARNING: This function should only be used in the backend with the private key!");

  const encrypted = decodeBase64(encryptedData.encrypted);
  const nonce = decodeBase64(encryptedData.nonce);
  const ephemeralPublicKey = decodeBase64(encryptedData.ephemeralPublicKey);

  const decrypted = nacl.box.open(
    encrypted,
    nonce,
    ephemeralPublicKey,
    privateKey
  );

  if (!decrypted) {
    throw new Error("Decryption failed - could not decrypt data");
  }

  return decrypted;
}
