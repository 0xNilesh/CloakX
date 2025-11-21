import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Lock, Cloud, CheckCircle, ExternalLink, Copy, Wallet } from "lucide-react";
import { encryptFileWithNaCl, encryptedDataToBlob } from "@/lib/naclEncryption";
import { uploadToWalrus } from "@/lib/walrusStorage";
import { registerUserData } from "@/lib/contractCalls";
import { DEFAULT_POOL_ID } from "@/lib/contractConstants";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";

interface UploadResult {
  fileName: string;
  encryptedSize: number;
  blobId: string;
  suiObjectId: string;
  explorerUrl: string;
  retrievalUrl: string;
  cost: number;
  uploadDuration: number;
  // Transaction info
  transactionDigest?: string;
  transactionUrl?: string;
  userDataObjectId?: string;
}

interface CSVUploaderProps {
  poolId?: number;
}

export const CSVUploader = ({ poolId = DEFAULT_POOL_ID }: CSVUploaderProps) => {
  const wallet = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a CSV or Excel file
      const validExtensions = [".csv", ".xlsx", ".xls"];
      const validMimeTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      const hasValidExtension = validExtensions.some(ext =>
        selectedFile.name.toLowerCase().endsWith(ext)
      );
      const hasValidMimeType = validMimeTypes.includes(selectedFile.type);

      if (!hasValidExtension && !hasValidMimeType) {
        toast.error("Please select a CSV or Excel file (.csv, .xlsx, .xls)");
        return;
      }

      setFile(selectedFile);
      setResult(null);
      setError(null);
      console.log("File selected:", selectedFile.name, selectedFile.size, "bytes");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    // Check wallet connection
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!wallet.account?.address) {
      toast.error("Wallet address not available");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    console.log("\n" + "=".repeat(60));
    console.log("STARTING UPLOAD & REGISTRATION PROCESS");
    console.log("=".repeat(60));
    console.log("Wallet Address:", wallet.account.address);
    console.log("Pool ID:", poolId);

    try {
      // Step 1: Encrypt with NaCl Box
      setCurrentStep("Encrypting...");
      setProgress(15);
      console.log("\n[STEP 1/4] NaCl BOX ASYMMETRIC ENCRYPTION");
      console.log("Using public key encryption - only the backend with the private key can decrypt");

      const encryptionResult = await encryptFileWithNaCl(file);

      setProgress(35);
      console.log("\n📊 Encryption Results:");
      console.log("  • File name:", encryptionResult.fileName);
      console.log("  • Original size:", encryptionResult.originalSize, "bytes");
      console.log("  • Encrypted size:", encryptionResult.encryptedSize, "bytes");
      console.log("  • Nonce:", encryptionResult.encryptedData.nonce);
      console.log("  • Ephemeral Public Key:", encryptionResult.encryptedData.ephemeralPublicKey);

      // Convert encrypted data to Blob for upload
      console.log("\n📦 Preparing encrypted data for Walrus upload...");
      const encryptedBlob = encryptedDataToBlob(encryptionResult.encryptedData);
      console.log("  • Blob prepared, size:", encryptedBlob.size, "bytes");

      // Step 2: Upload to Walrus
      setCurrentStep("Uploading to Walrus...");
      setProgress(50);
      console.log("\n[STEP 2/4] WALRUS UPLOAD");
      console.log("Uploading encrypted blob to Walrus decentralized storage...");

      const uploadResult = await uploadToWalrus(encryptedBlob, {
        epochs: 5, // Store for 5 epochs
      });

      setProgress(70);
      console.log("✅ Walrus upload successful!");
      console.log("Blob ID:", uploadResult.blobId);

      // Step 3: Register on-chain
      setCurrentStep("Registering on-chain...");
      setProgress(80);
      console.log("\n[STEP 3/4] ON-CHAIN REGISTRATION");
      console.log("Calling register_user_data Move function...");

      const txResult = await registerUserData(
        wallet.signAndExecuteTransaction,
        poolId,
        uploadResult.blobId
      );

      setProgress(95);
      console.log("✅ On-chain registration successful!");
      console.log("Transaction Digest:", txResult.digest);
      console.log("UserData Object ID:", txResult.userDataObjectId);

      // Step 4: Complete
      setCurrentStep("Complete!");
      setProgress(100);
      console.log("\n[STEP 4/4] COMPLETE");
      console.log("✅ File successfully encrypted, uploaded, and registered on-chain!");

      const finalResult: UploadResult = {
        fileName: file.name,
        encryptedSize: encryptionResult.encryptedSize,
        blobId: uploadResult.blobId,
        suiObjectId: uploadResult.suiObjectId,
        explorerUrl: uploadResult.explorerUrl,
        retrievalUrl: uploadResult.retrievalUrl,
        cost: uploadResult.cost,
        uploadDuration: uploadResult.metadata.uploadDuration,
        transactionDigest: txResult.digest,
        transactionUrl: txResult.explorerUrl,
        userDataObjectId: txResult.userDataObjectId,
      };

      setResult(finalResult);

      console.log("\n" + "=".repeat(60));
      console.log("UPLOAD & REGISTRATION PROCESS COMPLETE");
      console.log("=".repeat(60));
      console.log("Summary:", JSON.stringify(finalResult, null, 2));
      console.log("=".repeat(60) + "\n");

      toast.success("Data registered successfully on-chain!");
    } catch (err: any) {
      console.error("\n❌ PROCESS FAILED:", err);
      setError(err.message || "Upload failed");
      toast.error("Failed: " + err.message);
    } finally {
      setUploading(false);
      setCurrentStep("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Connection Warning */}
      {!wallet.connected && (
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertDescription>
            Please connect your wallet to upload and register data on-chain.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Data to Encrypted Storage
          </CardTitle>
          <CardDescription>
            CSV or Excel files will be encrypted with asymmetric encryption, stored on Walrus, and registered on Sui blockchain (Pool ID: {poolId})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="data-file">Select CSV or Excel File</Label>
            <div className="flex gap-2">
              <Input
                id="data-file"
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                disabled={uploading}
                className="flex-1"
              />
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>{file.name}</span>
                <span className="text-xs">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <span className="animate-pulse">Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Encrypt and Upload
              </>
            )}
          </Button>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {currentStep}
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Upload Result */}
      {result && (
        <Card className="border-green-500/50 bg-green-50/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Upload Successful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">File Name</p>
                <p className="text-sm font-mono">{result.fileName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Encrypted Size</p>
                <p className="text-sm font-mono">
                  {(result.encryptedSize / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>

            {/* Blob ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Walrus Blob ID
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(result.blobId, "Blob ID")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                {result.blobId}
              </p>
            </div>

            {/* Sui Object ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Sui Object ID
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(result.suiObjectId, "Object ID")}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                {result.suiObjectId}
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Sui Explorer
                </a>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={result.retrievalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Walrus Retrieval URL
                </a>
              </Button>
            </div>

            {/* Transaction Info */}
            {result.transactionDigest && (
              <>
                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-3 text-green-600">
                    ✅ On-chain Registration Successful
                  </p>

                  {/* Transaction Digest */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Transaction Digest
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(result.transactionDigest!, "Transaction Digest")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                      {result.transactionDigest}
                    </p>
                  </div>

                  {/* UserData Object ID */}
                  {result.userDataObjectId && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          UserData Object ID
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(result.userDataObjectId!, "UserData Object ID")}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                        {result.userDataObjectId}
                      </p>
                    </div>
                  )}

                  {/* Transaction Explorer Link */}
                  {result.transactionUrl && (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <a href={result.transactionUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Transaction on Sui Explorer
                      </a>
                    </Button>
                  )}
                </div>
              </>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Cost</p>
                <p className="text-sm font-mono">{result.cost} FROST</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Upload Time</p>
                <p className="text-sm font-mono">
                  {(result.uploadDuration / 1000).toFixed(2)}s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Process Explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How it works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Encryption</p>
                <p className="text-muted-foreground">
                  Your file is encrypted client-side using asymmetric encryption (X25519-XSalsa20-Poly1305)
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                2
              </div>
              <div>
                <p className="font-medium">Walrus Upload</p>
                <p className="text-muted-foreground">
                  Encrypted data is stored on Walrus decentralized storage network
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                3
              </div>
              <div>
                <p className="font-medium">On-chain Registration</p>
                <p className="text-muted-foreground">
                  Calls register_user_data() to register your contribution on Sui blockchain
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                4
              </div>
              <div>
                <p className="font-medium">Earn Rewards</p>
                <p className="text-muted-foreground">
                  When your data is used in computations, you earn SUI tokens proportionally
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
