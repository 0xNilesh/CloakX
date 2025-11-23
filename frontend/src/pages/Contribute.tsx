import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useParams, useNavigate } from "react-router-dom";
import { CSVUploader } from "@/components/CSVUploader";
import { getPoolById, PoolData } from "@/lib/poolQueries";

// Schema definitions mapped by pool metadata
const schemaMap: Record<string, {
  name: string;
  fields: string[];
  specifications: { field: string; description: string }[];
  example: string;
}> = {
  "Healthcare": {
    name: "Healthcare Records",
    fields: ["patient_id", "age", "diagnosis", "treatment", "outcome"],
    specifications: [
      { field: "patient_id", description: "Unique identifier for each patient record (string or number)" },
      { field: "age", description: "Patient age in years (numeric value, e.g., 25, 64)" },
      { field: "diagnosis", description: "Medical diagnosis or condition (text, e.g., \"Diabetes Type 2\")" },
      { field: "treatment", description: "Treatment method applied (text, e.g., \"Insulin Therapy\")" },
      { field: "outcome", description: "Treatment outcome status (text, e.g., \"Improved\", \"Stable\")" }
    ],
    example: `patient_id,age,diagnosis,treatment,outcome
P001,45,Diabetes Type 2,Insulin Therapy,Improved
P002,62,Hypertension,Beta Blockers,Stable
P003,34,Asthma,Inhaled Corticosteroids,Improved`
  },
  "Finance": {
    name: "Financial Transactions",
    fields: ["transaction_id", "amount", "category", "timestamp", "merchant_type"],
    specifications: [
      { field: "transaction_id", description: "Unique identifier for each transaction (string or number)" },
      { field: "amount", description: "Transaction amount in currency (numeric value, e.g., 125.50, 2500.00)" },
      { field: "category", description: "Transaction category (text, e.g., \"Groceries\", \"Utilities\")" },
      { field: "timestamp", description: "Transaction date and time (ISO format, e.g., \"2024-01-15T14:30:00Z\")" },
      { field: "merchant_type", description: "Type of merchant (text, e.g., \"Retail\", \"Online\", \"Restaurant\")" }
    ],
    example: `transaction_id,amount,category,timestamp,merchant_type
T001,125.50,Groceries,2024-01-15T14:30:00Z,Retail
T002,2500.00,Rent,2024-01-01T09:00:00Z,Property
T003,45.99,Dining,2024-01-16T19:15:00Z,Restaurant`
  },
  "IoT": {
    name: "IoT Sensor Data",
    fields: ["device_id", "temperature", "humidity", "energy_usage", "timestamp"],
    specifications: [
      { field: "device_id", description: "Unique identifier for each IoT device (string or number)" },
      { field: "temperature", description: "Temperature reading in Celsius (numeric value, e.g., 22.5, 18.3)" },
      { field: "humidity", description: "Humidity percentage (numeric value, e.g., 45, 67)" },
      { field: "energy_usage", description: "Energy consumption in kWh (numeric value, e.g., 1.25, 3.50)" },
      { field: "timestamp", description: "Reading date and time (ISO format, e.g., \"2024-01-15T14:30:00Z\")" }
    ],
    example: `device_id,temperature,humidity,energy_usage,timestamp
D001,22.5,45,1.25,2024-01-15T14:30:00Z
D002,18.3,67,2.10,2024-01-15T14:30:00Z
D003,24.1,52,0.95,2024-01-15T14:30:00Z`
  },
  "Retail": {
    name: "E-commerce Behavior",
    fields: ["session_id", "product_views", "cart_additions", "purchase_value", "time_spent"],
    specifications: [
      { field: "session_id", description: "Unique identifier for each shopping session (string or number)" },
      { field: "product_views", description: "Number of products viewed (numeric value, e.g., 5, 12)" },
      { field: "cart_additions", description: "Number of items added to cart (numeric value, e.g., 2, 7)" },
      { field: "purchase_value", description: "Total purchase amount (numeric value, e.g., 0, 299.99)" },
      { field: "time_spent", description: "Session duration in minutes (numeric value, e.g., 15, 45)" }
    ],
    example: `session_id,product_views,cart_additions,purchase_value,time_spent
S001,12,3,299.99,25
S002,5,0,0,8
S003,18,7,1250.00,45`
  }
};

// Default schema (Healthcare)
const defaultSchema = schemaMap["Healthcare"];

const Contribute = () => {
  const { datasetId } = useParams();
  const navigate = useNavigate();
  const [pool, setPool] = useState<PoolData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch pool data when component mounts
  useEffect(() => {
    const fetchPool = async () => {
      if (!datasetId) {
        setLoading(false);
        return;
      }

      try {
        const poolId = parseInt(datasetId);
        const poolData = await getPoolById(poolId);
        setPool(poolData);
      } catch (error) {
        console.error("Error fetching pool:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPool();
  }, [datasetId]);

  // Get schema based on pool metadata, fallback to default
  const schema = pool?.metadata
    ? (schemaMap[pool.metadata] || defaultSchema)
    : defaultSchema;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/datasets")}
            className="mb-10 font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to Datasets
          </Button>

          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Contribute to {loading ? "Dataset" : schema.name}
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              {datasetId && <span className="text-sm bg-secondary px-3 py-1 rounded-full mr-2 font-medium">Pool ID: {datasetId}</span>}
              Upload your encrypted data to the marketplace
            </p>
          </div>

          <CSVUploader poolId={datasetId ? parseInt(datasetId) : undefined} />

          <Card className="mt-12 border border-border overflow-hidden">
            <div className="p-8 space-y-8">
              <div>
                <h3 className="text-xl font-semibold tracking-tight mb-3">
                  Data Schema Requirements
                </h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Your file must contain the following fields in the exact order specified below:
                </p>
                <div className="flex flex-wrap gap-2">
                  {schema.fields.map((field) => (
                    <code key={field} className="px-4 py-2 bg-secondary rounded-lg text-xs font-mono border border-border">
                      {field}
                    </code>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide text-muted-foreground">Field Specifications</h4>
                <div className="space-y-4 text-sm">
                  {schema.specifications.map((spec) => (
                    <div key={spec.field} className="grid grid-cols-[140px_1fr] gap-4">
                      <code className="text-xs font-mono text-primary font-semibold">{spec.field}</code>
                      <span className="text-muted-foreground leading-relaxed">{spec.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide text-muted-foreground">File Format Guidelines</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5 font-bold">•</span>
                    <span><strong className="text-foreground font-medium">File Types:</strong> CSV (.csv) or Excel (.xlsx, .xls) formats accepted</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5 font-bold">•</span>
                    <span><strong className="text-foreground font-medium">Encoding:</strong> UTF-8 encoding recommended for best compatibility</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5 font-bold">•</span>
                    <span><strong className="text-foreground font-medium">Headers:</strong> First row must contain column headers matching the schema exactly</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5 font-bold">•</span>
                    <span><strong className="text-foreground font-medium">Column Order:</strong> Columns must appear in the exact order shown above</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary mt-0.5 font-bold">•</span>
                    <span><strong className="text-foreground font-medium">Data Quality:</strong> Ensure no missing values in required fields</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide text-muted-foreground">Example CSV Format</h4>
                <div className="bg-secondary p-5 rounded-lg border border-border">
                  <pre className="text-xs font-mono overflow-x-auto text-foreground">
{schema.example}
                  </pre>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <h4 className="text-sm font-semibold mb-4 uppercase tracking-wide text-muted-foreground">Privacy & Security</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--badge-green))] mt-0.5 font-bold text-base">✓</span>
                    <span><strong className="text-foreground font-medium">Client-Side Encryption:</strong> Your data is encrypted in your browser before upload using NaCl Box (X25519-XSalsa20-Poly1305)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--badge-green))] mt-0.5 font-bold text-base">✓</span>
                    <span><strong className="text-foreground font-medium">Decentralized Storage:</strong> Encrypted data is stored on Walrus, ensuring no single point of failure</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--badge-green))] mt-0.5 font-bold text-base">✓</span>
                    <span><strong className="text-foreground font-medium">Blockchain Registry:</strong> Data ownership is registered on Sui blockchain for transparent tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[hsl(var(--badge-green))] mt-0.5 font-bold text-base">✓</span>
                    <span><strong className="text-foreground font-medium">Earn Rewards:</strong> Receive SUI tokens when your data is used for computations</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contribute;
