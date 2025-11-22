import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Coins,
  Loader2,
  CheckCircle2,
  Download,
  Upload,
  FileJson,
  CheckCircle,
  AlertCircle,
  Copy,
  KeyRound,
  AlertTriangle,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { encryptFileWithNaCl, encryptedDataToBlob } from "@/lib/naclEncryption";
import { uploadToWalrus } from "@/lib/walrusStorage";
import {
  getOrGenerateUserKeypair,
  getUserKeypair,
  UserKeypair,
} from "@/lib/userKeypair";
import { createJob } from "@/lib/contractCalls";
import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";

type ComputeStep =
  | "idle"
  | "payment"
  | "extracting"
  | "computing"
  | "formatting"
  | "complete";

interface ModelSchemaUpload {
  fileName: string;
  blobId: string;
  suiObjectId: string;
  explorerUrl: string;
  encryptedSize: number;
}

interface JobCreationResult {
  jobId?: number;
  transactionDigest: string;
  transactionUrl: string;
}

const Compute = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const wallet = useWallet();
  const [computeStep, setComputeStep] = useState<ComputeStep>("idle");
  const [progress, setProgress] = useState(0);

  // Model schema upload state
  const [schemaFile, setSchemaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<ModelSchemaUpload | null>(
    null
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  // User keypair state
  const [userKeypair, setUserKeypair] = useState<UserKeypair | null>(null);
  const [showPrivateKeyModal, setShowPrivateKeyModal] = useState(false);

  // Job creation state
  const [jobResult, setJobResult] = useState<JobCreationResult | null>(null);
  const [creatingJob, setCreatingJob] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if it's a JSON file
      const isJSON =
        selectedFile.name.toLowerCase().endsWith(".json") ||
        selectedFile.type === "application/json";

      if (!isJSON) {
        toast.error("Please select a JSON file");
        return;
      }

      setSchemaFile(selectedFile);
      setUploadResult(null);
      setUploadError(null);
      console.log(
        "📄 JSON file selected:",
        selectedFile.name,
        selectedFile.size,
        "bytes"
      );
    }
  };

  const handleSchemaUpload = async () => {
    if (!schemaFile) {
      toast.error("Please select a JSON file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);

    console.log("\n" + "=".repeat(60));
    console.log("🧠 STARTING MODEL SCHEMA UPLOAD PROCESS");
    console.log("=".repeat(60));

    try {
      // Step 0: Generate or retrieve user keypair
      console.log("\n[STEP 0/4] USER KEYPAIR SETUP");
      const keypairExistsInStorage = getUserKeypair() !== null;
      const keypair = getOrGenerateUserKeypair();
      setUserKeypair(keypair);

      // Step 1: Validate JSON
      setUploadProgress(10);
      console.log("\n[STEP 1/4] VALIDATING JSON");

      const fileText = await schemaFile.text();
      try {
        JSON.parse(fileText);
        console.log("  ✅ Valid JSON file confirmed");
      } catch (parseError) {
        throw new Error("Invalid JSON file format");
      }

      // Step 2: Encrypt with NaCl Box
      setUploadProgress(30);
      console.log("\n[STEP 2/4] ENCRYPTING MODEL SCHEMA");
      console.log(
        "Using NaCl Box asymmetric encryption with RECIPIENT public key"
      );

      const encryptionResult = await encryptFileWithNaCl(schemaFile);

      console.log("\n📊 Encryption Results:");
      console.log("  • File name:", encryptionResult.fileName);
      console.log("  • Original size:", encryptionResult.originalSize, "bytes");
      console.log(
        "  • Encrypted size:",
        encryptionResult.encryptedSize,
        "bytes"
      );
      console.log("  • Nonce:", encryptionResult.encryptedData.nonce);
      console.log(
        "  • Ephemeral Public Key:",
        encryptionResult.encryptedData.ephemeralPublicKey
      );

      // Convert encrypted data to Blob for upload
      console.log("\n📦 Preparing encrypted schema for Walrus upload...");
      const encryptedBlob = encryptedDataToBlob(encryptionResult.encryptedData);

      // Step 3: Upload to Walrus
      setUploadProgress(60);
      console.log("\n[STEP 3/4] UPLOADING TO WALRUS");
      console.log("Uploading encrypted model schema to Walrus...");

      const uploadToWalrusResult = await uploadToWalrus(encryptedBlob, {
        epochs: 5,
      });

      setUploadProgress(90);

      // Step 4: Finalize
      console.log("\n[STEP 4/4] FINALIZING");

      const result: ModelSchemaUpload = {
        fileName: schemaFile.name,
        blobId: uploadToWalrusResult.blobId,
        suiObjectId: uploadToWalrusResult.suiObjectId,
        explorerUrl: uploadToWalrusResult.explorerUrl,
        encryptedSize: encryptionResult.encryptedSize,
      };

      setUploadResult(result);
      setUploadProgress(100);

      console.log("\n" + "=".repeat(60));
      console.log("✅ MODEL SCHEMA UPLOAD COMPLETE");
      console.log("=".repeat(60));
      console.log("📋 Upload Summary:");
      console.log("  • File Name:", result.fileName);
      console.log("  • Walrus Blob ID:", result.blobId);
      console.log("  • Sui Object ID:", result.suiObjectId);
      console.log("  • Sui Explorer URL:", result.explorerUrl);
      console.log("  • Encrypted Size:", result.encryptedSize, "bytes");
      console.log("\n👤 User Keypair (stored in localStorage):");
      console.log("  • Public Key:", keypair.publicKey);
      console.log(
        "  • Private Key:",
        keypair.privateKey.substring(0, 20) + "... (truncated)"
      );
      console.log("=".repeat(60) + "\n");

      toast.success("Model schema uploaded successfully!");

      // Show the private key modal only if keypair was newly generated
      if (!keypairExistsInStorage) {
        setShowPrivateKeyModal(true);
      }
    } catch (err: any) {
      console.error("\n❌ MODEL SCHEMA UPLOAD FAILED:", err);
      setUploadError(err.message || "Upload failed");
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyPrivateKey = () => {
    if (userKeypair) {
      navigator.clipboard.writeText(userKeypair.privateKey);
      toast.success("Private key copied to clipboard");
    }
  };

  const handleRequestCompute = async () => {
    if (!uploadResult) {
      toast.error("Please upload model schema first");
      return;
    }

    if (!userKeypair) {
      toast.error("User keypair not found. Please upload schema again.");
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

    setCreatingJob(true);
    setComputeStep("payment");
    setProgress(10);

    console.log("\n" + "=".repeat(60));
    console.log("💰 CREATING ML TRAINING JOB");
    console.log("=".repeat(60));
    console.log("📋 Job Parameters:");
    console.log("  • Pool ID:", datasetId || 1);
    console.log("  • Model WID (Walrus Blob ID):", uploadResult.blobId);
    console.log("  • Buyer Public Key:", userKeypair.publicKey);
    console.log("  • Epochs:", 10);
    console.log("  • Learning Rate:", 100, "(represents 0.01)");
    console.log("  • Price:", "0.001 SUI (1,000,000 MIST)");
    console.log("  • Wallet Address:", wallet.account.address);
    console.log("=".repeat(60));

    try {
      // Payment: 0.001 SUI = 1,000,000 MIST
      const PRICE_IN_MIST = "1000000";
      const poolId = parseInt(datasetId || "1", 10);

      // Training parameters
      const EPOCHS = 10;
      const LEARNING_RATE = 100; // represents 0.01 (scaled by 10000)

      setProgress(30);

      // Call create_job on blockchain
      const result = await createJob(
        wallet.signAndExecuteTransaction,
        poolId,
        uploadResult.blobId, // model_wid
        userKeypair.publicKey, // buyer_public_key
        EPOCHS,
        LEARNING_RATE,
        PRICE_IN_MIST
      );

      setProgress(60);
      setComputeStep("extracting");

      console.log("\n✅ Job Created Successfully!");
      console.log("Transaction Digest:", result.digest);

      // Extract job ID from events
      let jobId: number | undefined;
      if (result.events) {
        const jobCreatedEvent = result.events.find((e: any) =>
          e.type?.includes("::jobs::JobCreated")
        );
        if (jobCreatedEvent && jobCreatedEvent.parsedJson) {
          jobId = parseInt(jobCreatedEvent.parsedJson.job_id, 10);
          console.log("Job ID:", jobId);
        }
      }

      setProgress(80);
      setComputeStep("computing");

      const jobCreationResult: JobCreationResult = {
        jobId,
        transactionDigest: result.digest,
        transactionUrl: `https://testnet.suivision.xyz/txblock/${result.digest}`,
      };

      setJobResult(jobCreationResult);

      // Simulate remaining steps
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProgress(90);
      setComputeStep("formatting");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProgress(100);
      setComputeStep("complete");

      console.log("=".repeat(60));
      console.log("✅ JOB CREATION COMPLETE");
      console.log("=".repeat(60) + "\n");

      toast.success("ML training job created successfully!");
    } catch (error: any) {
      console.error("\n❌ JOB CREATION FAILED");
      console.error("Error:", error);
      console.error("=".repeat(60) + "\n");

      setComputeStep("idle");
      setProgress(0);
      toast.error(`Failed to create job: ${error.message || "Unknown error"}`);
    } finally {
      setCreatingJob(false);
    }
  };

  const getStepInfo = () => {
    switch (computeStep) {
      case "payment":
        return {
          title: "Processing Payment",
          description: "Confirming 0.001 SUI token payment...",
        };
      case "extracting":
        return {
          title: "Extracting Data",
          description: "Retrieving encrypted data from contributors",
        };
      case "computing":
        return {
          title: "Performing Computation",
          description: "Running analysis in Nautilus TEE",
        };
      case "formatting":
        return {
          title: "Formatting Results",
          description: "Preparing your computation results",
        };
      case "complete":
        return {
          title: "Computation Complete",
          description: "Your results are ready",
        };
      default:
        return {
          title: "Request Computation",
          description: "0.001 SUI token per compute",
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/datasets")}
            className="mb-8 font-medium text-muted-foreground hover:text-white"
          >
            ← Back to Datasets
          </Button>

          <Card className="p-10 border border-border">
            <div className="text-center mb-10">
              <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                {computeStep === "complete" ? (
                  <CheckCircle2 className="w-7 h-7 text-primary" />
                ) : computeStep !== "idle" ? (
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                ) : (
                  <Coins className="w-7 h-7 text-primary" />
                )}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
                {stepInfo.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {stepInfo.description}
              </p>
            </div>

            {computeStep === "idle" && (
              <div className="space-y-6">
                {/* Dataset Info */}
                <div className="border border-border rounded-lg p-6 space-y-4 bg-card">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm text-muted-foreground font-medium">
                      Dataset
                    </span>
                    <span className="font-semibold text-foreground">
                      Healthcare Records
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm text-muted-foreground font-medium">
                      Data Contributors
                    </span>
                    <span className="font-semibold text-foreground">
                      142 sources
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      Compute Cost
                    </span>
                    <span className="font-semibold text-foreground">
                      0.001 SUI
                    </span>
                  </div>
                </div>

                {/* Model Schema Upload Section */}
                <div className="border border-border rounded-lg p-6 space-y-4 bg-card">
                  <div className="space-y-2">
                    <Label
                      htmlFor="schema-file"
                      className="text-base font-semibold"
                    >
                      Upload Model Schema (JSON)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Upload a JSON file defining your neural network architecture for ML model training
                    </p>
                  </div>

                  {/* Schema Requirements Explanation */}
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h4 className="text-sm font-semibold text-foreground">What is a Model Schema?</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      A model schema defines the structure of your neural network, including layer types, dimensions,
                      activation functions, and hyperparameters. This JSON file tells the training system how to build
                      and train your ML model on the encrypted dataset.
                    </p>
                  </div>

                  {/* JSON Format Example */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Example Model Schema Format</h4>
                    <div className="bg-muted/50 p-3 rounded-lg border border-border">
                      <pre className="text-xs font-mono overflow-x-auto">
{`{
  "model_type": "neural_network",
  "architecture": {
    "input_layer": {
      "size": 4,
      "description": "Input features from dataset"
    },
    "hidden_layers": [
      {
        "type": "dense",
        "units": 64,
        "activation": "relu"
      },
      {
        "type": "dense",
        "units": 32,
        "activation": "relu"
      }
    ],
    "output_layer": {
      "units": 1,
      "activation": "sigmoid"
    }
  },
  "hyperparameters": {
    "optimizer": "adam",
    "loss_function": "binary_crossentropy",
    "metrics": ["accuracy"]
  }
}`}
                      </pre>
                    </div>
                  </div>

                  {/* Schema Requirements */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">Schema Requirements</h4>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Valid JSON:</strong> File must be properly formatted JSON with no syntax errors</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Model Type:</strong> Specify the type of model (e.g., neural_network, linear_regression, decision_tree)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Architecture:</strong> Define input, hidden, and output layers with dimensions matching your data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Hyperparameters:</strong> Include optimizer, loss function, and evaluation metrics</span>
                      </li>
                    </ul>
                  </div>

                  {/* File Input */}
                  <div className="space-y-3">
                    <Input
                      id="schema-file"
                      type="file"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      disabled={uploading || !!uploadResult}
                      className="cursor-pointer"
                    />

                    {schemaFile && !uploadResult && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileJson className="w-4 h-4" />
                        <span>{schemaFile.name}</span>
                        <span className="text-xs">
                          ({(schemaFile.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                    )}

                    {/* Upload Button */}
                    {schemaFile && !uploadResult && (
                      <Button
                        onClick={handleSchemaUpload}
                        disabled={uploading}
                        className="w-full"
                        variant="outline"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Encrypting & Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Encrypt & Upload Schema
                          </>
                        )}
                      </Button>
                    )}

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="space-y-2">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground">
                          {uploadProgress}% complete
                        </p>
                      </div>
                    )}

                    {/* Upload Success - Detailed View */}
                    {uploadResult && (
                      <Card className="border-green-500/50 bg-green-50/5">
                        <div className="p-4 space-y-4">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <h3 className="font-semibold">Upload Successful</h3>
                          </div>

                          {/* File Info */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                File Name
                              </p>
                              <p className="text-sm font-mono">
                                {uploadResult.fileName}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Encrypted Size
                              </p>
                              <p className="text-sm font-mono">
                                {(uploadResult.encryptedSize / 1024).toFixed(2)}{" "}
                                KB
                              </p>
                            </div>
                          </div>

                          {/* Blob ID */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                                  />
                                </svg>
                                Walrus Blob ID
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    uploadResult.blobId
                                  );
                                  toast.success("Blob ID copied to clipboard");
                                }}
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </Button>
                            </div>
                            <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                              {uploadResult.blobId}
                            </p>
                          </div>

                          {/* Sui Object ID */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                  />
                                </svg>
                                Sui Object ID
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    uploadResult.suiObjectId
                                  );
                                  toast.success(
                                    "Object ID copied to clipboard"
                                  );
                                }}
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </Button>
                            </div>
                            <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                              {uploadResult.suiObjectId}
                            </p>
                          </div>

                          {/* Explorer Link */}
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              className="w-full justify-start"
                              asChild
                            >
                              <a
                                href={uploadResult.explorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                                View on Sui Explorer
                              </a>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    {/* Upload Error */}
                    {uploadError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{uploadError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                {/* Wallet Connection Warning */}
                {!wallet.connected && uploadResult && (
                  <Alert>
                    <Wallet className="h-4 w-4" />
                    <AlertDescription>
                      Please connect your wallet to create a compute job.
                    </AlertDescription>
                  </Alert>
                )}

                {/* What to Expect Section */}
                {uploadResult && (
                  <div className="border border-border rounded-lg p-5 space-y-4 bg-muted/20">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      What Happens Next?
                    </h4>
                    <div className="space-y-3 text-xs text-muted-foreground">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-primary">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Payment Processing</p>
                          <p className="text-muted-foreground">Your 0.001 SUI payment is processed and held in escrow until job completion</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-primary">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Job Queue</p>
                          <p className="text-muted-foreground">Your training job is added to the processing queue on Sui blockchain</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-primary">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Secure Training in TEE</p>
                          <p className="text-muted-foreground">Nautilus enclave retrieves encrypted data, trains your model for 10 epochs at 0.01 learning rate in a secure environment</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-primary">4</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Encrypted Results</p>
                          <p className="text-muted-foreground">Trained model weights are encrypted with your public key and stored on-chain</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-semibold text-primary">5</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Claim & Decrypt</p>
                          <p className="text-muted-foreground">Use your private key to decrypt and download the trained model weights</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Expected Results Section */}
                {uploadResult && (
                  <div className="border border-border rounded-lg p-5 space-y-4 bg-gradient-to-br from-primary/5 to-primary/10">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      What Results Will You Receive?
                    </h4>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Trained Model Weights:</strong> Neural network parameters optimized on the encrypted dataset</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Training Metrics:</strong> Loss values, accuracy scores, and convergence statistics for each epoch</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Model Performance:</strong> Validation metrics showing how well your model learned from the data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Deployment Ready:</strong> Model weights in standard format ready for inference and deployment</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span><strong className="text-foreground">Privacy Preserved:</strong> You never see raw data - only the trained model results</span>
                      </li>
                    </ul>
                  </div>
                )}

                {/* Payment Button - Only show after successful upload */}
                {uploadResult && (
                  <Button
                    onClick={handleRequestCompute}
                    disabled={creatingJob || !wallet.connected}
                    className="w-full font-medium"
                    size="lg"
                  >
                    {creatingJob ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Job...
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4 mr-2" />
                        Pay 0.001 SUI & Request Compute
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {computeStep !== "idle" && computeStep !== "complete" && (
              <div className="space-y-6">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">
                    {Math.round(progress)}% complete
                  </span>
                </div>
              </div>
            )}

            {computeStep === "complete" && (
              <div className="space-y-6">
                {/* Job Creation Success */}
                {jobResult && (
                  <Card className="border-green-500/50 bg-green-50/5">
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <h3 className="font-semibold">
                          Job Created Successfully!
                        </h3>
                      </div>

                      {/* Job ID */}
                      {jobResult.jobId !== undefined && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            Job ID
                          </p>
                          <p className="text-2xl font-bold">
                            {jobResult.jobId}
                          </p>
                        </div>
                      )}

                      {/* Transaction Digest */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            Transaction Digest
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                jobResult.transactionDigest
                              );
                              toast.success("Transaction digest copied");
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                          {jobResult.transactionDigest}
                        </p>
                      </div>

                      {/* Explorer Link */}
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        asChild
                      >
                        <a
                          href={jobResult.transactionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Transaction on Sui Explorer
                        </a>
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Job Details */}
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="font-semibold tracking-tight mb-6">
                    Job Details
                  </h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between pb-4 border-b border-border">
                      <span className="text-muted-foreground font-medium">
                        Payment Amount
                      </span>
                      <span className="font-semibold text-foreground">
                        0.001 SUI
                      </span>
                    </div>
                    <div className="flex justify-between pb-4 border-b border-border">
                      <span className="text-muted-foreground font-medium">
                        Training Epochs
                      </span>
                      <span className="font-semibold text-foreground">10</span>
                    </div>
                    <div className="flex justify-between pb-4 border-b border-border">
                      <span className="text-muted-foreground font-medium">
                        Learning Rate
                      </span>
                      <span className="font-semibold text-foreground">
                        0.01
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">
                        Status
                      </span>
                      <span className="font-semibold text-foreground">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post-Completion Expectations */}
                <div className="border border-border rounded-lg p-6 space-y-5 bg-card">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-base font-semibold tracking-tight">What to Expect Once Training Completes</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Timeline */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Processing Time
                      </h4>
                      <p className="text-xs text-muted-foreground pl-6">
                        Training typically completes within 5-15 minutes depending on dataset size and queue length.
                        You'll be able to monitor job status from your dashboard.
                      </p>
                    </div>

                    {/* Notification */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Job Status Updates
                      </h4>
                      <p className="text-xs text-muted-foreground pl-6">
                        Check your dashboard to see when the job status changes from "Pending" to "Completed".
                        The blockchain will emit a completion event that you can track.
                      </p>
                    </div>

                    {/* Claiming Results */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                        Claiming Your Results
                      </h4>
                      <div className="pl-6 space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Once complete, you can claim your encrypted results:
                        </p>
                        <ol className="space-y-1.5 text-xs text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">1.</span>
                            <span>Navigate to your <strong className="text-foreground">Dashboard</strong> and locate the completed job</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">2.</span>
                            <span>Click <strong className="text-foreground">"Claim Reward"</strong> to retrieve the encrypted model from the enclave</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">3.</span>
                            <span>Use your <strong className="text-foreground">private key</strong> (saved earlier) to decrypt the results</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="font-semibold text-foreground">4.</span>
                            <span>Download the <strong className="text-foreground">trained model weights</strong> and performance metrics</span>
                          </li>
                        </ol>
                      </div>
                    </div>

                    {/* Result Contents */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        What's Included in Results
                      </h4>
                      <div className="pl-6 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span><strong className="text-foreground">Model Weights File:</strong> Trained neural network parameters in standard format (e.g., .h5, .pth, .pb)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span><strong className="text-foreground">Training Report:</strong> JSON file with epoch-by-epoch loss and accuracy metrics</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span><strong className="text-foreground">Performance Summary:</strong> Final validation scores and model statistics</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span><strong className="text-foreground">Training Configuration:</strong> Hyperparameters used during training for reproducibility</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span><strong className="text-foreground">Convergence Plots:</strong> Visual charts showing training progress (if applicable)</span>
                        </div>
                      </div>
                    </div>

                    {/* Next Steps After Download */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Using Your Trained Model
                      </h4>
                      <div className="pl-6 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span><strong className="text-foreground">Load & Deploy:</strong> Import weights into your ML framework (TensorFlow, PyTorch, etc.)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span><strong className="text-foreground">Make Predictions:</strong> Use the model for inference on new data</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span><strong className="text-foreground">Further Training:</strong> Fine-tune on your own data if needed</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span><strong className="text-foreground">Integration:</strong> Integrate into your applications and services</span>
                        </div>
                      </div>
                    </div>

                    {/* Important Notes */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="bg-amber-50/5 border border-amber-500/20 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <h5 className="text-xs font-semibold text-amber-500">Important Reminders</h5>
                        </div>
                        <ul className="space-y-1 text-xs text-muted-foreground pl-6">
                          <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>Keep your <strong className="text-foreground">private key secure</strong> - it's required to decrypt results</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>Results remain on-chain and can be <strong className="text-foreground">claimed anytime</strong> - no rush</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span>•</span>
                            <span>Contributors earn rewards automatically when you claim results</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="flex-1 font-medium"
                  >
                    View Dashboard
                  </Button>
                  <Button
                    onClick={() => {
                      setComputeStep("idle");
                      setProgress(0);
                      setUploadResult(null);
                      setSchemaFile(null);
                      setJobResult(null);
                    }}
                    variant="outline"
                    className="flex-1 font-medium"
                  >
                    Create Another Job
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Private Key Modal */}
      <Dialog open={showPrivateKeyModal} onOpenChange={setShowPrivateKeyModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-amber-500" />
              </div>
              <DialogTitle className="text-2xl">
                Save Your Private Key
              </DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              Please save your private key securely. This key is required for
              decrypting computation results in the next steps.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Warning Alert */}
            <Alert className="border-amber-500/50 bg-amber-50/5">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertDescription className="text-sm ml-2">
                <span className="font-semibold text-amber-500">Important:</span>{" "}
                This private key is NOT stored anywhere on our servers. If you
                lose it, you won't be able to decrypt your computation results.
              </AlertDescription>
            </Alert>

            {/* Private Key Display */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Your Private Key</Label>
              <div className="relative">
                <div className="bg-muted p-4 rounded-lg border border-border">
                  <code className="text-xs font-mono break-all block">
                    {userKeypair?.privateKey}
                  </code>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={handleCopyPrivateKey}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
            </div>

            {/* Public Key Display */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Public Key (for reference)
              </Label>
              <div className="bg-muted/50 p-3 rounded-lg border border-border">
                <code className="text-xs font-mono break-all block text-muted-foreground">
                  {userKeypair?.publicKey}
                </code>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <div className="text-xs text-muted-foreground text-center mb-2">
              Make sure you have copied and stored your private key securely
              before continuing.
            </div>
            <Button
              onClick={() => setShowPrivateKeyModal(false)}
              className="w-full"
            >
              I've Saved My Private Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compute;
