/**
 * React Hook for fetching buyer statistics
 */

import { useState, useEffect } from "react";
import {
  getBuyerStats,
  BuyerStats,
  getComputationHistory,
  JobWithResult,
} from "@/lib/jobQueries";

export function useBuyerStats(userAddress: string | undefined) {
  const [stats, setStats] = useState<BuyerStats | null>(null);
  const [history, setHistory] = useState<JobWithResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    if (!userAddress) {
      setStats(null);
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🚀 Fetching buyer stats for:", userAddress);

      const [buyerStats, computationHistory] = await Promise.all([
        getBuyerStats(userAddress),
        getComputationHistory(userAddress),
      ]);

      setStats(buyerStats);
      setHistory(computationHistory);

      console.log("✅ Buyer stats loaded successfully");
    } catch (err: any) {
      console.error("Failed to fetch buyer stats:", err);
      setError(err.message || "Failed to fetch buyer stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userAddress]);

  return {
    stats,
    history,
    loading,
    error,
    refetch: fetchStats,
  };
}
