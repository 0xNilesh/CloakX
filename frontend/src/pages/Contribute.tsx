import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Shield, Database, CheckCircle2, Loader2 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

type UploadStep = "idle" | "encrypting" | "uploading" | "complete";

const Contribute = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [uploadStep, setUploadStep] = useState<UploadStep>("idle");
  const [progress, setProgress] = useState(0);
  const [blobId, setBlobId] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate encryption
    setUploadStep("encrypting");
    setProgress(0);
    await simulateProgress(33);

    // Simulate upload to Walrus
    setUploadStep("uploading");
    await simulateProgress(66);

    // Complete
    setUploadStep("complete");
    setProgress(100);
    setBlobId("0x" + Math.random().toString(16).substring(2, 42));
  };

  const simulateProgress = (target: number) => {
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= target) {
            clearInterval(interval);
            resolve();
            return target;
          }
          return prev + 2;
        });
      }, 50);
    });
  };

  const getStepInfo = () => {
    switch (uploadStep) {
      case "encrypting":
        return {
          icon: Shield,
          title: "Encrypting with Seal",
          description: "Your data is being encrypted to ensure privacy"
        };
      case "uploading":
        return {
          icon: Database,
          title: "Uploading to Walrus",
          description: "Storing encrypted data on decentralized storage"
        };
      case "complete":
        return {
          icon: CheckCircle2,
          title: "Upload Complete",
          description: "Your contribution has been recorded"
        };
      default:
        return {
          icon: Upload,
          title: "Upload Your Data",
          description: "Select a CSV or Excel file matching the dataset schema"
        };
    }
  };

  const stepInfo = getStepInfo();
  const StepIcon = stepInfo.icon;

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
                <StepIcon className={`w-7 h-7 text-primary ${uploadStep === "encrypting" || uploadStep === "uploading" ? "animate-pulse" : ""}`} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{stepInfo.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{stepInfo.description}</p>
            </div>

            {uploadStep === "idle" && (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-lg font-semibold mb-2">Drop your file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse • CSV or Excel formats</p>
                </label>
              </div>
            )}

            {(uploadStep === "encrypting" || uploadStep === "uploading") && (
              <div className="space-y-6">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">{progress}% complete</span>
                </div>
              </div>
            )}

            {uploadStep === "complete" && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-lg p-6">
                  <p className="text-sm font-semibold text-foreground mb-3">Blob ID / Transaction Hash</p>
                  <p className="text-xs font-mono text-muted-foreground break-all bg-secondary/50 p-3 rounded">{blobId}</p>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate("/dashboard")}
                    className="flex-1 font-medium"
                  >
                    View Dashboard
                  </Button>
                  <Button
                    onClick={() => navigate("/datasets")}
                    variant="outline"
                    className="flex-1 font-medium"
                  >
                    Browse More
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-8 mt-8 border border-border">
            <h3 className="text-lg font-semibold tracking-tight mb-4">Data Schema Requirements</h3>
            <p className="text-sm text-muted-foreground mb-4">Your file must contain the following fields:</p>
            <div className="flex flex-wrap gap-2">
              {["patient_id", "age", "diagnosis", "treatment", "outcome"].map((field) => (
                <code key={field} className="px-4 py-2 bg-secondary rounded text-xs font-mono border border-border">
                  {field}
                </code>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
