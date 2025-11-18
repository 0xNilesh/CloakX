import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, Loader2, CheckCircle2, Download } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

type ComputeStep = "idle" | "payment" | "extracting" | "computing" | "formatting" | "complete";

const Compute = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [computeStep, setComputeStep] = useState<ComputeStep>("idle");
  const [progress, setProgress] = useState(0);

  const handleRequestCompute = async () => {
    const steps: ComputeStep[] = ["payment", "extracting", "computing", "formatting", "complete"];
    
    for (let i = 0; i < steps.length; i++) {
      setComputeStep(steps[i]);
      setProgress(((i + 1) / steps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const getStepInfo = () => {
    switch (computeStep) {
      case "payment":
        return {
          title: "Processing Payment",
          description: "Confirming 1 SUI token payment..."
        };
      case "extracting":
        return {
          title: "Extracting Data",
          description: "Retrieving encrypted data from contributors"
        };
      case "computing":
        return {
          title: "Performing Computation",
          description: "Running analysis in Nautilus TEE"
        };
      case "formatting":
        return {
          title: "Formatting Results",
          description: "Preparing your computation results"
        };
      case "complete":
        return {
          title: "Computation Complete",
          description: "Your results are ready"
        };
      default:
        return {
          title: "Request Computation",
          description: "1 SUI token per compute"
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
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">{stepInfo.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{stepInfo.description}</p>
            </div>

            {computeStep === "idle" && (
              <div className="space-y-6">
                <div className="border border-border rounded-lg p-6 space-y-4 bg-card">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm text-muted-foreground font-medium">Dataset</span>
                    <span className="font-semibold text-foreground">Healthcare Records</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm text-muted-foreground font-medium">Data Contributors</span>
                    <span className="font-semibold text-foreground">142 sources</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">Compute Cost</span>
                    <span className="font-semibold text-foreground">1 SUI</span>
                  </div>
                </div>

                <Button
                  onClick={handleRequestCompute}
                  className="w-full font-medium"
                  size="lg"
                >
                  <Coins className="w-4 h-4 mr-2" />
                  Pay 1 SUI & Request Compute
                </Button>
              </div>
            )}

            {computeStep !== "idle" && computeStep !== "complete" && (
              <div className="space-y-6">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-medium">{Math.round(progress)}% complete</span>
                </div>
              </div>
            )}

            {computeStep === "complete" && (
              <div className="space-y-6">
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h3 className="font-semibold tracking-tight mb-6">Computation Results</h3>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between pb-4 border-b border-border">
                      <span className="text-muted-foreground font-medium">Total Records Analyzed</span>
                      <span className="font-semibold text-foreground">1,247</span>
                    </div>
                    <div className="flex justify-between pb-4 border-b border-border">
                      <span className="text-muted-foreground font-medium">Average Age</span>
                      <span className="font-semibold text-foreground">42.3 years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Success Rate</span>
                      <span className="font-semibold text-foreground">87.2%</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1 font-medium">
                    <Download className="w-4 h-4 mr-2" />
                    Download Results
                  </Button>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                    className="flex-1 font-medium"
                  >
                    Dashboard
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Compute;
