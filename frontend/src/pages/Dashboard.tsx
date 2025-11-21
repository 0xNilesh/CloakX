import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, Database, Zap, Calendar, Loader2, RefreshCw, Wallet, AlertCircle } from "lucide-react";
import { useWallet } from "@suiet/wallet-kit";
import { useContributorStats } from "@/hooks/useContributorStats";
import { useBuyerStats } from "@/hooks/useBuyerStats";
import { getPoolById } from "@/lib/poolQueries";
import { JobStatus } from "@/lib/jobQueries";
import { useEffect, useState as useReactState } from "react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("contributor");
  const wallet = useWallet();
  const userAddress = wallet.account?.address;

  // Fetch contributor and buyer stats
  const contributorData = useContributorStats(userAddress);
  const buyerData = useBuyerStats(userAddress);

  // Pool name cache
  const [poolNames, setPoolNames] = useReactState<Record<number, string>>({});

  // Fetch pool names for display
  useEffect(() => {
    const fetchPoolNames = async () => {
      const poolIds = new Set<number>();

      // Collect all pool IDs from both contributor and buyer data
      contributorData.poolStats.forEach((ps) => poolIds.add(ps.poolId));
      buyerData.history.forEach((job) => poolIds.add(job.poolId));

      const names: Record<number, string> = {};
      for (const poolId of poolIds) {
        if (!poolNames[poolId]) {
          const pool = await getPoolById(poolId);
          if (pool) {
            names[poolId] = pool.metadata || `Pool ${poolId}`;
          }
        }
      }
      setPoolNames((prev) => ({ ...prev, ...names }));
    };

    if (contributorData.poolStats.length > 0 || buyerData.history.length > 0) {
      fetchPoolNames();
    }
  }, [contributorData.poolStats, buyerData.history]);

  // Helper functions
  const formatSUI = (mist: number) => {
    return (mist / 1_000_000_000).toFixed(4);
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case JobStatus.Completed:
        return { variant: "default" as const, label: "Complete" };
      case JobStatus.Pending:
        return { variant: "secondary" as const, label: "Pending" };
      case JobStatus.Cancelled:
        return { variant: "destructive" as const, label: "Cancelled" };
      default:
        return { variant: "secondary" as const, label: "Unknown" };
    }
  };

  // Wallet not connected
  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-16">
          <div className="mb-10">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Manage your contributions and compute activities</p>
          </div>

          <Card className="p-12 border border-border text-center">
            <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Wallet Not Connected</h3>
            <p className="text-muted-foreground mb-6">
              Please connect your wallet to view your dashboard
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Manage your contributions and compute activities</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-card border border-border inline-flex h-10 items-center justify-center rounded-lg p-1">
            <TabsTrigger value="contributor" className="font-medium">
              Contributor View
            </TabsTrigger>
            <TabsTrigger value="buyer" className="font-medium">
              Buyer View
            </TabsTrigger>
          </TabsList>

          {/* CONTRIBUTOR VIEW */}
          <TabsContent value="contributor" className="space-y-8">
            {contributorData.loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading contributor data...</p>
              </div>
            ) : contributorData.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{contributorData.error}</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="p-8 border border-border">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Pending Earnings
                      </span>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">
                      {contributorData.stats
                        ? `${formatSUI(contributorData.stats.pendingEarnings)} SUI`
                        : "0 SUI"}
                    </p>
                  </Card>

                  <Card className="p-8 border border-border">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Database className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Active Datasets
                      </span>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">
                      {contributorData.stats?.activeDatasets || 0}
                    </p>
                  </Card>

                  <Card className="p-8 border border-border">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Total Computations
                      </span>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">
                      {contributorData.stats?.totalComputations || 0}
                    </p>
                  </Card>
                </div>

                {/* Contributions Table */}
                <Card className="p-8 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold tracking-tight">Contribution History</h2>
                    <Button
                      onClick={contributorData.refetch}
                      variant="outline"
                      size="sm"
                      disabled={contributorData.loading}
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${contributorData.loading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                  </div>

                  {contributorData.poolStats.length === 0 ? (
                    <div className="text-center py-12">
                      <Database className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No contributions yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Start contributing data to earn rewards
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {contributorData.poolStats.map((poolStat, index) => (
                        <div
                          key={poolStat.poolId}
                          className={`flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors ${
                            index !== contributorData.poolStats.length - 1
                              ? "border-b border-border"
                              : ""
                          }`}
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {poolStat.poolMetadata || `Pool ${poolStat.poolId}`}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm text-muted-foreground">
                                Pool ID: {poolStat.poolId}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {poolStat.totalJobs} jobs
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right pl-4">
                            <p className="text-sm text-muted-foreground">
                              {poolStat.completedJobs} completed
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {poolStat.pendingJobs} pending
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </TabsContent>

          {/* BUYER VIEW */}
          <TabsContent value="buyer" className="space-y-8">
            {buyerData.loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Loading buyer data...</p>
              </div>
            ) : buyerData.error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{buyerData.error}</AlertDescription>
              </Alert>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="p-8 border border-border">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">
                      {buyerData.stats ? `${formatSUI(buyerData.stats.totalSpent)} SUI` : "0 SUI"}
                    </p>
                  </Card>

                  <Card className="p-8 border border-border">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Computations
                      </span>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">
                      {buyerData.stats?.totalJobs || 0}
                    </p>
                  </Card>

                  <Card className="p-8 border border-border">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Database className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Datasets Used
                      </span>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">
                      {buyerData.stats?.uniqueDatasetsUsed || 0}
                    </p>
                  </Card>
                </div>

                {/* Computes Table */}
                <Card className="p-8 border border-border">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold tracking-tight">Computation History</h2>
                    <Button
                      onClick={buyerData.refetch}
                      variant="outline"
                      size="sm"
                      disabled={buyerData.loading}
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${buyerData.loading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                  </div>

                  {buyerData.history.length === 0 ? (
                    <div className="text-center py-12">
                      <Zap className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No computations yet</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Request computation on datasets to see history
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {buyerData.history.map((job, index) => {
                        const statusBadge = getStatusBadge(job.status);
                        return (
                          <div
                            key={job.jobId}
                            className={`flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors ${
                              index !== buyerData.history.length - 1
                                ? "border-b border-border"
                                : ""
                            }`}
                          >
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">
                                {poolNames[job.poolId] || `Pool ${job.poolId}`}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm text-muted-foreground">
                                  Job ID: {job.jobId}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {job.epochs} epochs
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 pl-4">
                              <Badge variant={statusBadge.variant} className="font-medium">
                                {statusBadge.label}
                              </Badge>
                              <p className="text-lg font-semibold text-foreground whitespace-nowrap">
                                {formatSUI(job.price)} SUI
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
