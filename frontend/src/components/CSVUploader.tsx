import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Lock, Cloud, CheckCircle, ExternalLink, Copy } from "lucide-react";
import { encryptFile } from "@/lib/sealEncryption";
import { uploadToWalrus } from "@/lib/walrusStorage";
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
}

export const CSVUploader = () => {
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

    setUploading(true);
    setProgress(0);
    setError(null);
    setResult(null);

    console.log("\n" + "=".repeat(60));
    console.log("STARTING UPLOAD PROCESS");
    console.log("=".repeat(60));

    try {
      // Step 1: Encrypt with Seal
      setCurrentStep("Encrypting with Seal...");
      setProgress(20);
      console.log("\n[STEP 1/3] ENCRYPTION");

      const encryptionResult = await encryptFile(file, 2);

      setProgress(50);
      console.log("Encryption metadata:", {
        fileName: encryptionResult.fileName,
        originalSize: encryptionResult.metadata.originalSize,
        encryptedSize: encryptionResult.encryptedData.length,
        threshold: encryptionResult.metadata.threshold,
      });

      // Step 2: Upload to Walrus
      setCurrentStep("Uploading to Walrus...");
      setProgress(60);
      console.log("\n[STEP 2/3] WALRUS UPLOAD");

      const uploadResult = await uploadToWalrus(encryptionResult.encryptedData, {
        epochs: 5, // Store for 5 epochs
      });

      setProgress(90);

      // Step 3: Complete
      setCurrentStep("Upload complete!");
      setProgress(100);
      console.log("\n[STEP 3/3] COMPLETE");

      const finalResult: UploadResult = {
        fileName: file.name,
        encryptedSize: encryptionResult.encryptedData.length,
        blobId: uploadResult.blobId,
        suiObjectId: uploadResult.suiObjectId,
        explorerUrl: uploadResult.explorerUrl,
        retrievalUrl: uploadResult.retrievalUrl,
        cost: uploadResult.cost,
        uploadDuration: uploadResult.metadata.uploadDuration,
      };

      setResult(finalResult);

      console.log("\n" + "=".repeat(60));
      console.log("UPLOAD PROCESS COMPLETE");
      console.log("=".repeat(60));
      console.log("Summary:", JSON.stringify(finalResult, null, 2));
      console.log("=".repeat(60) + "\n");

      toast.success("File uploaded successfully!");
    } catch (err: any) {
      console.error("\n❌ UPLOAD PROCESS FAILED:", err);
      setError(err.message || "Upload failed");
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
      setCurrentStep("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Data to Encrypted Storage
          </CardTitle>
          <CardDescription>
            CSV or Excel files will be encrypted with Seal and stored on Walrus decentralized storage
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
                <p className="font-medium">Seal Encryption</p>
                <p className="text-muted-foreground">
                  Your file is encrypted client-side using Seal's threshold encryption
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
                  Storage proof is recorded on Sui blockchain for verification
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
