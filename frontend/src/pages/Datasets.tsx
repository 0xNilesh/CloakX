import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Upload, ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const mockDatasets = [
  {
    id: 1,
    name: "Healthcare Records",
    description: "Anonymized patient health metrics and outcomes",
    contributors: 142,
    computePrice: "1 SUI",
    schema: ["patient_id", "age", "diagnosis", "treatment", "outcome"],
    category: "Healthcare"
  },
  {
    id: 2,
    name: "Financial Transactions",
    description: "Encrypted banking transaction patterns",
    contributors: 89,
    computePrice: "1 SUI",
    schema: ["transaction_id", "amount", "category", "timestamp", "merchant_type"],
    category: "Finance"
  },
  {
    id: 3,
    name: "IoT Sensor Data",
    description: "Smart home device metrics and patterns",
    contributors: 234,
    computePrice: "1 SUI",
    schema: ["device_id", "temperature", "humidity", "energy_usage", "timestamp"],
    category: "IoT"
  },
  {
    id: 4,
    name: "E-commerce Behavior",
    description: "User shopping patterns and preferences",
    contributors: 178,
    computePrice: "1 SUI",
    schema: ["session_id", "product_views", "cart_additions", "purchase_value", "time_spent"],
    category: "Retail"
  }
];

const Datasets = () => {
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Dataset Catalog
          </h1>
          <p className="text-muted-foreground">
            Browse curated datasets and contribute your data or request computations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {mockDatasets.map((dataset) => (
            <Card key={dataset.id} className="p-6 border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{dataset.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {dataset.category}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-4">
                {dataset.description}
              </p>

              <div className="bg-secondary rounded p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Schema</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dataset.schema.map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{dataset.contributors} contributors</span>
                <span className="font-medium">{dataset.computePrice}/compute</span>
              </div>

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link to={`/contribute/${dataset.id}`}>
                    <Upload className="w-4 h-4 mr-2" />
                    Contribute Data
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link to={`/compute/${dataset.id}`}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Request Compute
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Datasets;
