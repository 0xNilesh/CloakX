/**
 * React Hook for fetching contributor statistics
 */

import { useState, useEffect } from "react";
import {
  getContributorStats,
  ContributorStats,
  getComputationsPerPool,
  PoolComputationStats,
} from "@/lib/userQueries";

export function useContributorStats(userAddress: string | undefined) {
  const [stats, setStats] = useState<ContributorStats | null>(null);
  const [poolStats, setPoolStats] = useState<PoolComputationStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!userAddress) {
      setStats(null);
      setPoolStats([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🚀 Fetching contributor stats for:", userAddress);

      const [contributorStats, computationsPerPool] = await Promise.all([
        getContributorStats(userAddress),
        getComputationsPerPool(userAddress),
      ]);

      setStats(contributorStats);
      setPoolStats(computationsPerPool);

      console.log("✅ Contributor stats loaded successfully");
    } catch (err: any) {
      console.error("Failed to fetch contributor stats:", err);
      setError(err.message || "Failed to fetch contributor stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userAddress]);

  return {
    stats,
    poolStats,
    loading,
    error,
    refetch: fetchStats,
  };
}
