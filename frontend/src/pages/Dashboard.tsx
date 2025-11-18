import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Database, Zap, Calendar } from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("contributor");

  const contributorStats = {
    totalEarned: "12.5 SUI",
    datasets: 3,
    computeRequests: 42
  };

  const contributions = [
    { id: 1, dataset: "Healthcare Records", date: "2024-01-15", earnings: "3.2 SUI", computes: 12 },
    { id: 2, dataset: "Financial Transactions", date: "2024-01-10", earnings: "5.8 SUI", computes: 18 },
    { id: 3, dataset: "IoT Sensor Data", date: "2024-01-05", earnings: "3.5 SUI", computes: 12 }
  ];

  const buyerStats = {
    totalSpent: "8.0 SUI",
    computeRequests: 8,
    datasetsUsed: 4
  };

  const computes = [
    { id: 1, dataset: "Healthcare Records", date: "2024-01-20", cost: "1 SUI", status: "Complete" },
    { id: 2, dataset: "E-commerce Behavior", date: "2024-01-18", cost: "1 SUI", status: "Complete" },
    { id: 3, dataset: "Financial Transactions", date: "2024-01-15", cost: "1 SUI", status: "Complete" },
    { id: 4, dataset: "IoT Sensor Data", date: "2024-01-12", cost: "1 SUI", status: "Processing" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          Dashboard
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="contributor">Contributor View</TabsTrigger>
            <TabsTrigger value="buyer">Buyer View</TabsTrigger>
          </TabsList>

          <TabsContent value="contributor" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-muted-foreground">Total Earned</span>
                </div>
                <p className="text-3xl font-bold">{contributorStats.totalEarned}</p>
              </Card>

              <Card className="p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="text-muted-foreground">Datasets</span>
                </div>
                <p className="text-3xl font-bold">{contributorStats.datasets}</p>
              </Card>

              <Card className="p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-muted-foreground">Compute Requests</span>
                </div>
                <p className="text-3xl font-bold">{contributorStats.computeRequests}</p>
              </Card>
            </div>

            {/* Contributions Table */}
            <Card className="p-6 border">
              <h2 className="text-xl font-semibold mb-4">Your Contributions</h2>
              <div className="space-y-3">
                {contributions.map((contribution) => (
                  <div key={contribution.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded hover:bg-secondary transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{contribution.dataset}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{contribution.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{contribution.earnings}</p>
                      <p className="text-sm text-muted-foreground">{contribution.computes} computes</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="buyer" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span className="text-muted-foreground">Total Spent</span>
                </div>
                <p className="text-3xl font-bold">{buyerStats.totalSpent}</p>
              </Card>

              <Card className="p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-muted-foreground">Computes</span>
                </div>
                <p className="text-3xl font-bold">{buyerStats.computeRequests}</p>
              </Card>

              <Card className="p-6 border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-secondary rounded flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <span className="text-muted-foreground">Datasets Used</span>
                </div>
                <p className="text-3xl font-bold">{buyerStats.datasetsUsed}</p>
              </Card>
            </div>

            {/* Computes Table */}
            <Card className="p-6 border">
              <h2 className="text-xl font-semibold mb-4">Your Computes</h2>
              <div className="space-y-3">
                {computes.map((compute) => (
                  <div key={compute.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded hover:bg-secondary transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{compute.dataset}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{compute.date}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <Badge variant={compute.status === "Complete" ? "default" : "secondary"}>
                        {compute.status}
                      </Badge>
                      <p className="text-lg font-semibold">{compute.cost}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
