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

          <Card className="p-8 mt-8 border border-border space-y-6">
            <div>
              <h3 className="text-lg font-semibold tracking-tight mb-4">
                Data Schema Requirements
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your file must contain the following fields in the exact order specified below:
              </p>
              <div className="flex flex-wrap gap-2">
                {["patient_id", "age", "diagnosis", "treatment", "outcome"].map((field) => (
                  <code key={field} className="px-4 py-2 bg-secondary rounded text-xs font-mono border border-border">
                    {field}
                  </code>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Field Specifications</h4>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <code className="text-xs font-mono text-primary">patient_id</code>
                  <span className="text-muted-foreground">Unique identifier for each patient record (string or number)</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <code className="text-xs font-mono text-primary">age</code>
                  <span className="text-muted-foreground">Patient age in years (numeric value, e.g., 25, 64)</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <code className="text-xs font-mono text-primary">diagnosis</code>
                  <span className="text-muted-foreground">Medical diagnosis or condition (text, e.g., "Diabetes Type 2")</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <code className="text-xs font-mono text-primary">treatment</code>
                  <span className="text-muted-foreground">Treatment method applied (text, e.g., "Insulin Therapy")</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-2">
                  <code className="text-xs font-mono text-primary">outcome</code>
                  <span className="text-muted-foreground">Treatment outcome status (text, e.g., "Improved", "Stable")</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">File Format Guidelines</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">File Types:</strong> CSV (.csv) or Excel (.xlsx, .xls) formats accepted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Encoding:</strong> UTF-8 encoding recommended for best compatibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Headers:</strong> First row must contain column headers matching the schema exactly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Column Order:</strong> Columns must appear in the exact order shown above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span><strong className="text-foreground">Data Quality:</strong> Ensure no missing values in required fields</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Example CSV Format</h4>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <pre className="text-xs font-mono overflow-x-auto">
{`patient_id,age,diagnosis,treatment,outcome
P001,45,Diabetes Type 2,Insulin Therapy,Improved
P002,62,Hypertension,Beta Blockers,Stable
P003,34,Asthma,Inhaled Corticosteroids,Improved`}
                </pre>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <h4 className="text-sm font-semibold mb-3">Privacy & Security</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong className="text-foreground">Client-Side Encryption:</strong> Your data is encrypted in your browser before upload using NaCl Box (X25519-XSalsa20-Poly1305)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong className="text-foreground">Decentralized Storage:</strong> Encrypted data is stored on Walrus, ensuring no single point of failure</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong className="text-foreground">Blockchain Registry:</strong> Data ownership is registered on Sui blockchain for transparent tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span><strong className="text-foreground">Earn Rewards:</strong> Receive SUI tokens when your data is used for computations</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
