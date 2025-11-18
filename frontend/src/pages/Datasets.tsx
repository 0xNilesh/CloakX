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

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Available Datasets
          </h1>
          <p className="text-lg text-muted-foreground">
            Contribute your data securely or request computations on datasets. All data remains encrypted and private throughout the process.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {mockDatasets.map((dataset) => (
            <Card key={dataset.id} className="p-8 border border-border hover:border-primary/50 transition-colors">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center flex-shrink-0">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold tracking-tight mb-2">{dataset.name}</h3>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {dataset.category}
                  </Badge>
                </div>
              </div>

              <p className="text-muted-foreground mb-6 leading-relaxed">
                {dataset.description}
              </p>

              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Data Schema</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {dataset.schema.map((field) => (
                    <Badge key={field} variant="outline" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm mb-6 pb-6 border-b border-border">
                <div>
                  <span className="text-muted-foreground">{dataset.contributors}</span>
                  <span className="text-muted-foreground ml-1">contributors</span>
                </div>
                <div className="font-semibold">{dataset.computePrice}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button asChild size="sm" className="font-medium">
                  <Link to={`/contribute/${dataset.id}`}>
                    <Upload className="w-4 h-4 mr-2" />
                    Contribute
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="font-medium">
                  <Link to={`/compute/${dataset.id}`}>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Compute
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
