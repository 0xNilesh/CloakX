import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  Database,
  Zap,
  Calendar,
  Loader2,
  RefreshCw,
  Wallet,
  AlertCircle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Upload,
} from "lucide-react";
import { useWallet } from "@suiet/wallet-kit";
import { useContributorStats } from "@/hooks/useContributorStats";
import { useBuyerStats } from "@/hooks/useBuyerStats";
import { getPoolById } from "@/lib/poolQueries";
import { JobStatus } from "@/lib/jobQueries";
import { getObjectUrl, JOBS_TABLE_ID, POOLS_TABLE_ID } from "@/lib/contractConstants";
import { useEffect, useState as useReactState } from "react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("contributor");
  const wallet = useWallet();
  const userAddress = wallet.account?.address;

  // Fetch contributor and buyer stats
  const contributorData = useContributorStats(userAddress);
  const buyerData = useBuyerStats(userAddress);

  // Pool cache for names and object IDs
  const [poolNames, setPoolNames] = useReactState<Record<number, string>>({});
  const [poolObjects, setPoolObjects] = useReactState<Record<number, { metadata: string; objectId?: string }>>({});

  // Fetch pool names and object IDs for display
  useEffect(() => {
    const fetchPoolData = async () => {
      const poolIds = new Set<number>();

      // Collect all pool IDs from both contributor and buyer data
      contributorData.poolStats.forEach((ps) => poolIds.add(ps.poolId));
      buyerData.history.forEach((job) => poolIds.add(job.poolId));

      const names: Record<number, string> = {};
      const objects: Record<number, { metadata: string; objectId?: string }> = {};
      for (const poolId of poolIds) {
        if (!poolNames[poolId]) {
          const pool = await getPoolById(poolId);
          if (pool) {
            names[poolId] = pool.metadata || `Pool ${poolId}`;
            objects[poolId] = {
              metadata: pool.metadata || `Pool ${poolId}`,
              objectId: pool.objectId
            };
          }
        }
      }
      setPoolNames((prev) => ({ ...prev, ...names }));
      setPoolObjects((prev) => ({ ...prev, ...objects }));
    };

    if (contributorData.poolStats.length > 0 || buyerData.history.length > 0) {
      fetchPoolData();
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
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Dashboard
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Track your contributions and compute activities in real-time
              </p>
            </div>

            <Card className="p-16 border border-border text-center">
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">
                Wallet Not Connected
              </h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Please connect your wallet to view your dashboard and track your
                activity
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-6 py-20">
        {/* Header with wallet info */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Dashboard
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Track your contributions and compute activities in real-time
              </p>
            </div>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-10"
        >
          <TabsList className="bg-card border border-border inline-flex h-12 items-center justify-center rounded-xl p-1.5 shadow-sm">
            <TabsTrigger
              value="contributor"
              className="font-medium rounded-lg px-6"
            >
              <Database className="w-4 h-4 mr-2" />
              Contributor View
            </TabsTrigger>
            <TabsTrigger value="buyer" className="font-medium rounded-lg px-6">
              <Zap className="w-4 h-4 mr-2" />
              Buyer View
            </TabsTrigger>
          </TabsList>

          {/* CONTRIBUTOR VIEW */}
          <TabsContent value="contributor" className="space-y-8">
            {contributorData.loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  Loading contributor data...
                </p>
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
                  <Card className="p-6 border border-border overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Pending Earnings
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                          {contributorData.stats
                            ? `${formatSUI(
                                contributorData.stats.pendingEarnings
                              )}`
                            : "0"}
                          <span className="text-lg text-muted-foreground ml-2">
                            SUI
                          </span>
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-border overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Active Datasets
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                          {contributorData.stats?.activeDatasets || 0}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-border overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Total Computations
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                          {contributorData.stats?.totalComputations || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Contributions Table */}
                <Card className="border border-border overflow-hidden">
                  <div className="p-8 pb-6 border-b border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight mb-1">
                          Contribution History
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Track your data contributions across pools
                        </p>
                      </div>
                      <Button
                        onClick={contributorData.refetch}
                        variant="outline"
                        size="sm"
                        disabled={contributorData.loading}
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${
                            contributorData.loading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {contributorData.poolStats.length === 0 ? (
                    <div className="text-center py-16 px-8">
                      <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Database className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-2">
                        No contributions yet
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Start contributing data to earn rewards when
                        computations are performed
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contributorData.poolStats.map((poolStat) => {
                        console.log('Pool Stat:', poolStat);
                        console.log('UserData Objects:', poolStat.userDataObjects);
                        return (
                        <Card key={poolStat.poolId} className="overflow-hidden">
                          {/* Pool Header */}
                          <div className="bg-secondary/30 px-6 py-4 border-b border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                                  <Database className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-base text-foreground mb-0.5">
                                    {poolStat.poolMetadata || `Pool ${poolStat.poolId}`}
                                  </h3>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    Pool #{poolStat.poolId}
                                  </p>
                                </div>
                              </div>

                              {/* Stats Summary */}
                              <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                  <div className="text-center px-3 py-1 rounded-lg bg-green-500/10">
                                    <p className="text-lg font-bold text-green-600">
                                      {poolStat.completedJobs}
                                    </p>
                                    <p className="text-[10px] text-green-600/80 uppercase tracking-wide">
                                      Completed
                                    </p>
                                  </div>
                                  <div className="text-center px-3 py-1 rounded-lg bg-orange-500/10">
                                    <p className="text-lg font-bold text-orange-600">
                                      {poolStat.pendingJobs}
                                    </p>
                                    <p className="text-[10px] text-orange-600/80 uppercase tracking-wide">
                                      Pending
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="secondary" className="font-semibold">
                                  {poolStat.totalJobs} total jobs
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Contributions Section */}
                          {poolStat.userDataObjects && poolStat.userDataObjects.length > 0 ? (
                            <div className="p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Upload className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-foreground">
                                    Your Data Contributions
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {poolStat.userDataObjects.length} {poolStat.userDataObjects.length === 1 ? 'dataset' : 'datasets'} uploaded to this pool
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {poolStat.userDataObjects.map((userData, idx) => (
                                  <a
                                    key={userData.objectId}
                                    href={`https://testnet.suivision.xyz/object/${userData.objectId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group"
                                  >
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 hover:border-primary/50 transition-all duration-200">
                                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm flex-shrink-0">
                                        <Database className="w-5 h-5 text-white" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-foreground mb-0.5">
                                          Contribution #{idx + 1}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                                          {userData.objectId.slice(0, 8)}...{userData.objectId.slice(-6)}
                                        </p>
                                      </div>
                                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 text-center">
                              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mx-auto mb-3">
                                <Database className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                No contributions to this pool yet
                              </p>
                            </div>
                          )}
                        </Card>
                      )})}
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
                  <Card className="p-6 border border-border overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Total Spent
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                          {buyerData.stats
                            ? `${formatSUI(buyerData.stats.totalSpent)}`
                            : "0"}
                          <span className="text-lg text-muted-foreground ml-2">
                            SUI
                          </span>
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-border overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Computations
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                          {buyerData.stats?.totalJobs || 0}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 border border-border overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                          <Database className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          Datasets Used
                        </p>
                        <p className="text-3xl font-bold tracking-tight">
                          {buyerData.stats?.uniqueDatasetsUsed || 0}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Computes Table */}
                <Card className="border border-border overflow-hidden">
                  <div className="p-8 pb-6 border-b border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight mb-1">
                          Computation History
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Review your requested computations and their status
                        </p>
                      </div>
                      <Button
                        onClick={buyerData.refetch}
                        variant="outline"
                        size="sm"
                        disabled={buyerData.loading}
                      >
                        <RefreshCw
                          className={`w-4 h-4 mr-2 ${
                            buyerData.loading ? "animate-spin" : ""
                          }`}
                        />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  {buyerData.history.length === 0 ? (
                    <div className="text-center py-16 px-8">
                      <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-2">
                        No computations yet
                      </p>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Request computation on datasets to see your history
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {buyerData.history.map((job) => {
                        console.log('Job:', job);
                        console.log('Job objectId:', job.objectId);

                        const statusBadge = getStatusBadge(job.status);
                        const statusIcons = {
                          [JobStatus.Completed]: (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ),
                          [JobStatus.Pending]: (
                            <Clock className="w-4 h-4 text-orange-600" />
                          ),
                          [JobStatus.Cancelled]: (
                            <XCircle className="w-4 h-4 text-red-600" />
                          ),
                        };

                        return (
                          <div
                            key={job.jobId}
                            className="p-6 hover:bg-secondary/30 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                  <Zap className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground text-base mb-1">
                                    {poolNames[job.poolId] ||
                                      `Pool ${job.poolId}`}
                                  </p>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground font-mono">
                                      Job #{job.jobId}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      •
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-normal"
                                    >
                                      {job.epochs} epochs
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 ml-6">
                                <div className="flex items-center gap-2">
                                  {statusIcons[job.status as JobStatus]}
                                  <Badge
                                    variant={statusBadge.variant}
                                    className="font-medium"
                                  >
                                    {statusBadge.label}
                                  </Badge>
                                </div>
                                <div className="text-right min-w-[100px]">
                                  <p className="text-lg font-bold text-foreground">
                                    {formatSUI(job.price)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    SUI
                                  </p>
                                </div>
                                {job.objectId && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0"
                                    asChild
                                  >
                                    <a
                                      href={`https://testnet.suivision.xyz/object/${job.objectId}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="View Job on Sui Explorer"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
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
