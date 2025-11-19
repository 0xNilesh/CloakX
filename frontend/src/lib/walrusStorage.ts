/**
 * Walrus Storage Utility
 * Handles uploading encrypted data to Walrus decentralized storage
 */

// Walrus Testnet endpoints
const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

// Sui Testnet Explorer
const SUI_EXPLORER_BASE = "https://testnet.suivision.xyz";

export interface WalrusUploadResult {
  blobId: string;
  suiObjectId: string;
  cost: number;
  size: number;
  registeredEpoch: number;
  explorerUrl: string;
  retrievalUrl: string;
  metadata: {
    timestamp: number;
    uploadDuration: number;
  };
}

export interface WalrusUploadOptions {
  epochs?: number; // Storage duration (default: 1)
  permanent?: boolean; // Mark as permanent storage
  deletable?: boolean; // Allow deletion
}

/**
 * Upload encrypted data to Walrus
 * @param data - The encrypted data to upload (Uint8Array)
 * @param options - Upload options (epochs, permanent, deletable)
 * @returns Upload result with blob ID, explorer links, and metadata
 */
export const uploadToWalrus = async (
  data: Uint8Array,
  options: WalrusUploadOptions = {}
): Promise<WalrusUploadResult> => {
  console.log("=== WALRUS UPLOAD START ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Data size:", data.length, "bytes");
  console.log("Upload options:", options);

  try {
    // Build query parameters
    const params = new URLSearchParams();
    if (options.epochs) params.append("epochs", options.epochs.toString());
    if (options.permanent) params.append("permanent", "true");
    if (options.deletable) params.append("deletable", "true");

    const uploadUrl = `${WALRUS_PUBLISHER}/v1/blobs${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    console.log("Upload URL:", uploadUrl);
    console.log("Uploading to Walrus publisher...");

    const startTime = performance.now();

    // Upload to Walrus
    const response = await fetch(uploadUrl, {
      method: "PUT",
      body: data,
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    const uploadDuration = performance.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error("✗ Upload failed:", response.status, errorText);
      throw new Error(
        `Walrus upload failed: ${response.status} - ${errorText}`
      );
    }

    const result = await response.json();
    console.log("✓ Upload completed in", uploadDuration.toFixed(2), "ms");
    console.log("Raw Walrus response:", JSON.stringify(result, null, 2));

    // Extract blob information
    // Walrus returns either 'newlyCreated' or 'alreadyCertified' object
    const blobInfo = result.newlyCreated || result.alreadyCertified;

    if (!blobInfo) {
      console.error("✗ Unexpected response format:", result);
      throw new Error("Invalid response format from Walrus");
    }

    const blobId = blobInfo.blobObject?.blobId || blobInfo.blobId;
    const suiObjectId = blobInfo.blobObject?.id || blobInfo.id;
    const cost = blobInfo.cost || 0;
    const size = blobInfo.blobObject?.size || blobInfo.size || data.length;
    const registeredEpoch = blobInfo.blobObject?.registeredEpoch ||
                           blobInfo.endEpoch || 0;

    console.log("\n=== UPLOAD DETAILS ===");
    console.log("Blob ID:", blobId);
    console.log("Sui Object ID:", suiObjectId);
    console.log("Storage Cost:", cost);
    console.log("Blob Size:", size, "bytes");
    console.log("Registered Epoch:", registeredEpoch);

    // Generate explorer and retrieval URLs
    const explorerUrl = `${SUI_EXPLORER_BASE}/object/${suiObjectId}`;
    const retrievalUrl = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;

    console.log("\n=== ACCESS LINKS ===");
    console.log("Explorer URL:", explorerUrl);
    console.log("Retrieval URL:", retrievalUrl);
    console.log("=== WALRUS UPLOAD COMPLETE ===\n");

    return {
      blobId,
      suiObjectId,
      cost,
      size,
      registeredEpoch,
      explorerUrl,
      retrievalUrl,
      metadata: {
        timestamp: Date.now(),
        uploadDuration,
      },
    };
  } catch (error) {
    console.error("✗ WALRUS UPLOAD FAILED:", error);
    throw new Error(`Walrus upload failed: ${error}`);
  }
};

/**
 * Upload a file to Walrus (convenience wrapper)
 * @param file - The file to upload
 * @param options - Upload options
 * @returns Upload result
 */
export const uploadFileToWalrus = async (
  file: File,
  options: WalrusUploadOptions = {}
): Promise<WalrusUploadResult & { fileName: string }> => {
  console.log("=== FILE UPLOAD START ===");
  console.log("File:", file.name);

  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const result = await uploadToWalrus(data, options);

  console.log("✓ File uploaded successfully");

  return {
    ...result,
    fileName: file.name,
  };
};

/**
 * Retrieve data from Walrus by blob ID
 * @param blobId - The blob ID to retrieve
 * @returns The retrieved data
 */
export const retrieveFromWalrus = async (blobId: string): Promise<Uint8Array> => {
  console.log("=== WALRUS RETRIEVAL START ===");
  console.log("Blob ID:", blobId);

  try {
    const retrievalUrl = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
    console.log("Retrieval URL:", retrievalUrl);

    const response = await fetch(retrievalUrl);

    if (!response.ok) {
      throw new Error(`Retrieval failed: ${response.status}`);
    }

    const data = new Uint8Array(await response.arrayBuffer());
    console.log("✓ Retrieved", data.length, "bytes");
    console.log("=== WALRUS RETRIEVAL COMPLETE ===\n");

    return data;
  } catch (error) {
    console.error("✗ WALRUS RETRIEVAL FAILED:", error);
    throw new Error(`Walrus retrieval failed: ${error}`);
  }
};
