import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { CSVUploader } from "@/components/CSVUploader";

const Contribute = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/datasets")}
            className="mb-8 font-medium text-muted-foreground hover:text-white"
          >
            ← Back to Datasets
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Contribute to Dataset
            </h1>
            <p className="text-muted-foreground">
              {datasetId ? `Dataset ID: ${datasetId}` : "Upload your encrypted data to the marketplace"}
            </p>
          </div>

          <CSVUploader />

          <Card className="p-8 mt-8 border border-border">
            <h3 className="text-lg font-semibold tracking-tight mb-4">
              Data Schema Requirements
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Your file must contain the following fields:
            </p>
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
