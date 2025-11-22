import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Upload, ShoppingCart, Eye, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { usePools } from "@/hooks/usePools";
import { toast } from "sonner";

const mockDatasets = [
  {
    id: 1,
    name: "Healthcare Records",
    description: "Anonymized patient health metrics and outcomes",
    contributors: 142,
    computePrice: "0.001 SUI",
    schema: ["patient_id", "age", "diagnosis", "treatment", "outcome"],
    category: "Healthcare"
  },
  {
    id: 2,
    name: "Financial Transactions",
    description: "Encrypted banking transaction patterns",
    contributors: 89,
    computePrice: "0.001 SUI",
    schema: ["transaction_id", "amount", "category", "timestamp", "merchant_type"],
    category: "Finance"
  },
  {
    id: 3,
    name: "IoT Sensor Data",
    description: "Smart home device metrics and patterns",
    contributors: 234,
    computePrice: "0.001 SUI",
    schema: ["device_id", "temperature", "humidity", "energy_usage", "timestamp"],
    category: "IoT"
  },
  {
    id: 4,
    name: "E-commerce Behavior",
    description: "User shopping patterns and preferences",
    contributors: 178,
    computePrice: "0.001 SUI",
    schema: ["session_id", "product_views", "cart_additions", "purchase_value", "time_spent"],
    category: "Retail"
  }
];

const Datasets = () => {
  const [selectedDataset, setSelectedDataset] = useState<number | null>(null);
  const { pools, loading, error, fetchPools } = usePools();

  // Automatically fetch pools when component mounts
  useEffect(() => {
    fetchPools();
  }, []);

  const handleFetchPools = async () => {
    toast.info("Fetching pools from blockchain...");
    const fetchedPools = await fetchPools();

    if (fetchedPools.length > 0) {
      const metadataArray = fetchedPools.map(p => p.metadata);
      console.log("\n🎯 FINAL RESULT - Pool Metadata Array:");
      console.log(metadataArray);
      toast.success(`Found ${fetchedPools.length} pools! Check console for metadata array.`);
    } else {
      toast.warning("No pools found on-chain. Create some pools first!");
    }
  };

  // Use fetched pools if available, otherwise fall back to mock data
  const displayDatasets = pools.length > 0
    ? pools.map(pool => ({
        id: pool.poolId,
        name: pool.metadata || `Pool ${pool.poolId}`,
        description: `Data pool for ${pool.metadata}`,
        contributors: pool.contributorCount,
        computePrice: "0.001 SUI",
        schema: [], // Schema info not available from pool
        category: pool.metadata || "General"
      }))
    : mockDatasets;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mb-16">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                Available Datasets
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                Contribute your data securely or request computations on datasets. All data remains encrypted and private throughout the process.
              </p>
            </div>
            <Button
              onClick={handleFetchPools}
              disabled={loading}
              variant="outline"
              size="sm"
              className="ml-6 gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Fetch Pools
            </Button>
          </div>

          {/* {pools.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                ✅ Found {pools.length} on-chain pools: {pools.map(p => `"${p.metadata}"`).join(", ")}
              </p>
            </div>
          )} */}

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                ❌ Error: {error}
              </p>
            </div>
          )}
        </div>

        {loading && pools.length === 0 && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading pools...</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayDatasets.map((dataset, index) => {
            // Assign different pastel colors to dataset icons
            const avatarColors = [
              'bg-gradient-to-br from-purple-500 to-purple-600', // Healthcare
              'bg-gradient-to-br from-blue-500 to-blue-600',     // Finance
              'bg-gradient-to-br from-orange-500 to-orange-600', // IoT
              'bg-gradient-to-br from-green-500 to-green-600',   // Retail
            ];
            const badgeVariants: ("purple" | "default" | "orange" | "green")[] = ['purple', 'default', 'orange', 'green'];

            return (
            <Card key={dataset.id} className="p-0 border border-border overflow-hidden">
              <div className="p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-12 h-12 ${avatarColors[index % 4]} rounded-xl flex items-center justify-center flex-shrink-0 text-white font-semibold text-lg shadow-sm`}>
                    <Database className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold tracking-tight mb-2 leading-tight">{dataset.name}</h3>
                    <Badge variant={badgeVariants[index % 4]} className="text-xs">
                      {dataset.category}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  {dataset.description}
                </p>

              {dataset.schema.length > 0 && (
                <div className="space-y-3 mb-6 pb-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data Schema</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dataset.schema.map((field) => (
                      <Badge key={field} variant="outline" className="text-xs font-normal">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Database className="w-3.5 h-3.5" />
                  <span className="font-medium text-foreground">
                    {dataset.contributors > 0 ? dataset.contributors : "0"}
                  </span>
                  <span>contributors</span>
                </div>
                <div className="font-semibold text-foreground">{dataset.computePrice}</div>
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
              </div>
            </Card>
          )})}
        </div>
      </div>
    </div>
  );
};

export default Datasets;
