import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

const USER_KEYPAIR_STORAGE_KEY = "cloakx_user_keypair";

export interface UserKeypair {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}

/**
 * Generates a new NaCl Box keypair for the user
 * @returns UserKeypair with base64 encoded keys
 */
export function generateUserKeypair(): UserKeypair {
  console.log("\n🔑 Generating new user keypair...");

  const keypair = nacl.box.keyPair();

  const userKeypair: UserKeypair = {
    publicKey: encodeBase64(keypair.publicKey),
    privateKey: encodeBase64(keypair.secretKey),
  };

  console.log("✅ User keypair generated successfully");
  console.log("  • Public Key:", userKeypair.publicKey);
  console.log("  • Public Key (length):", keypair.publicKey.length, "bytes");
  console.log("  • Private Key (length):", keypair.secretKey.length, "bytes");
  console.log("  ⚠️  Private key will be stored in localStorage");

  return userKeypair;
}

/**
 * Saves user keypair to localStorage
 * @param keypair - The keypair to save
 */
export function saveUserKeypair(keypair: UserKeypair): void {
  try {
    localStorage.setItem(USER_KEYPAIR_STORAGE_KEY, JSON.stringify(keypair));
    console.log("💾 User keypair saved to localStorage");
  } catch (error) {
    console.error("❌ Failed to save keypair to localStorage:", error);
    throw new Error("Failed to save keypair to localStorage");
  }
}

/**
 * Retrieves user keypair from localStorage
 * @returns UserKeypair if exists, null otherwise
 */
export function getUserKeypair(): UserKeypair | null {
  try {
    const stored = localStorage.getItem(USER_KEYPAIR_STORAGE_KEY);
    if (!stored) {
      console.log("ℹ️  No existing user keypair found in localStorage");
      return null;
    }

    const keypair = JSON.parse(stored) as UserKeypair;
    console.log("✅ User keypair loaded from localStorage");
    console.log("  • Public Key:", keypair.publicKey);

    return keypair;
  } catch (error) {
    console.error("❌ Failed to load keypair from localStorage:", error);
    return null;
  }
}

/**
 * Gets existing user keypair or generates a new one if it doesn't exist
 * @returns UserKeypair
 */
export function getOrGenerateUserKeypair(): UserKeypair {
  console.log("\n" + "=".repeat(60));
  console.log("👤 USER KEYPAIR MANAGEMENT");
  console.log("=".repeat(60));

  let keypair = getUserKeypair();

  if (!keypair) {
    console.log("📝 No existing keypair found. Generating new keypair...");
    keypair = generateUserKeypair();
    saveUserKeypair(keypair);
  } else {
    console.log("♻️  Using existing keypair from localStorage");
  }

  console.log("=".repeat(60) + "\n");

  return keypair;
}

/**
 * Clears user keypair from localStorage (for testing/debugging)
 */
export function clearUserKeypair(): void {
  localStorage.removeItem(USER_KEYPAIR_STORAGE_KEY);
  console.log("🗑️  User keypair cleared from localStorage");
}

/**
 * Decodes base64 public key to Uint8Array
 * @param publicKeyBase64 - Base64 encoded public key
 * @returns Uint8Array public key
 */
export function decodePublicKey(publicKeyBase64: string): Uint8Array {
  return decodeBase64(publicKeyBase64);
}

/**
 * Decodes base64 private key to Uint8Array
 * @param privateKeyBase64 - Base64 encoded private key
 * @returns Uint8Array private key
 */
export function decodePrivateKey(privateKeyBase64: string): Uint8Array {
  return decodeBase64(privateKeyBase64);
}
