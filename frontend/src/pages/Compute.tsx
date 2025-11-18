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
                {computeStep === "complete" ? (
                  <CheckCircle2 className="w-8 h-8" />
                ) : computeStep !== "idle" ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Coins className="w-8 h-8" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">{stepInfo.title}</h2>
              <p className="text-muted-foreground">{stepInfo.description}</p>
            </div>

            {computeStep === "idle" && (
              <div className="space-y-6">
                <div className="bg-secondary rounded p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Dataset</span>
                    <span className="font-medium">Healthcare Records</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Contributors</span>
                    <span className="font-medium">142 data sources</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Compute Cost</span>
                    <span className="font-medium">1 SUI</span>
                  </div>
                </div>

                <Button 
                  onClick={handleRequestCompute}
                  className="w-full"
                  size="lg"
                >
                  <Coins className="w-5 h-5 mr-2" />
                  Pay 1 SUI & Request Compute
                </Button>
              </div>
            )}

            {computeStep !== "idle" && computeStep !== "complete" && (
              <div className="space-y-4">
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{Math.round(progress)}% complete</span>
                </div>
              </div>
            )}

            {computeStep === "complete" && (
              <div className="space-y-6">
                <div className="bg-secondary border rounded p-6">
                  <h3 className="font-semibold mb-4">Computation Results</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Records Analyzed</span>
                      <span className="font-medium">1,247</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Average Age</span>
                      <span className="font-medium">42.3 years</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-medium">87.2%</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download Full Results
                  </Button>
                  <Button 
                    onClick={() => navigate("/dashboard")}
                    variant="outline"
                    className="flex-1"
                  >
                    View Dashboard
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
