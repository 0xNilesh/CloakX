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
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/datasets")}
            className="mb-6"
          >
            ← Back to Datasets
          </Button>

          <Card className="p-8 border">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <StepIcon className={`w-8 h-8 ${uploadStep === "complete" ? "" : ""} ${uploadStep === "encrypting" || uploadStep === "uploading" ? "animate-pulse" : ""}`} />
              </div>
              <h2 className="text-2xl font-bold mb-2">{stepInfo.title}</h2>
              <p className="text-muted-foreground">{stepInfo.description}</p>
            </div>

            {uploadStep === "idle" && (
              <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Drop your file here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports CSV and Excel files</p>
                </label>
              </div>
            )}

            {(uploadStep === "encrypting" || uploadStep === "uploading") && (
              <div className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{progress}% complete</span>
                </div>
              </div>
            )}

            {uploadStep === "complete" && (
              <div className="space-y-6">
                <div className="bg-secondary border rounded p-4">
                  <p className="text-sm font-medium mb-2">Blob ID / Transaction Hash</p>
                  <p className="text-xs font-mono break-all">{blobId}</p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={() => navigate("/dashboard")}
                    className="flex-1"
                  >
                    View Dashboard
                  </Button>
                  <Button 
                    onClick={() => navigate("/datasets")}
                    variant="outline"
                    className="flex-1"
                  >
                    Browse Datasets
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 mt-6 border">
            <h3 className="font-semibold mb-3">Required Schema</h3>
            <div className="flex flex-wrap gap-2">
              {["patient_id", "age", "diagnosis", "treatment", "outcome"].map((field) => (
                <code key={field} className="px-3 py-1 bg-secondary rounded text-sm">
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
