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

      <div className="container mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Manage your contributions and compute activities</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-card border border-border inline-flex h-10 items-center justify-center rounded-lg p-1">
            <TabsTrigger value="contributor" className="font-medium">Contributor View</TabsTrigger>
            <TabsTrigger value="buyer" className="font-medium">Buyer View</TabsTrigger>
          </TabsList>

          <TabsContent value="contributor" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-8 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Total Earned</span>
                </div>
                <p className="text-4xl font-bold tracking-tight">{contributorStats.totalEarned}</p>
              </Card>

              <Card className="p-8 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Active Datasets</span>
                </div>
                <p className="text-4xl font-bold tracking-tight">{contributorStats.datasets}</p>
              </Card>

              <Card className="p-8 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Compute Uses</span>
                </div>
                <p className="text-4xl font-bold tracking-tight">{contributorStats.computeRequests}</p>
              </Card>
            </div>

            {/* Contributions Table */}
            <Card className="p-8 border border-border">
              <h2 className="text-xl font-bold tracking-tight mb-6">Contribution History</h2>
              <div className="space-y-1">
                {contributions.map((contribution, index) => (
                  <div
                    key={contribution.id}
                    className={`flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors ${
                      index !== contributions.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{contribution.dataset}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{contribution.date}</span>
                      </div>
                    </div>
                    <div className="text-right pl-4">
                      <p className="text-lg font-semibold text-foreground">{contribution.earnings}</p>
                      <p className="text-sm text-muted-foreground mt-1">{contribution.computes} uses</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="buyer" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-8 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
                </div>
                <p className="text-4xl font-bold tracking-tight">{buyerStats.totalSpent}</p>
              </Card>

              <Card className="p-8 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Computations</span>
                </div>
                <p className="text-4xl font-bold tracking-tight">{buyerStats.computeRequests}</p>
              </Card>

              <Card className="p-8 border border-border">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">Datasets Used</span>
                </div>
                <p className="text-4xl font-bold tracking-tight">{buyerStats.datasetsUsed}</p>
              </Card>
            </div>

            {/* Computes Table */}
            <Card className="p-8 border border-border">
              <h2 className="text-xl font-bold tracking-tight mb-6">Computation History</h2>
              <div className="space-y-1">
                {computes.map((compute, index) => (
                  <div
                    key={compute.id}
                    className={`flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors ${
                      index !== computes.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{compute.dataset}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{compute.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pl-4">
                      <Badge
                        variant={compute.status === "Complete" ? "default" : "secondary"}
                        className="font-medium"
                      >
                        {compute.status}
                      </Badge>
                      <p className="text-lg font-semibold text-foreground whitespace-nowrap">{compute.cost}</p>
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
