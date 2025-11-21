/**
 * React Hook for fetching pool data from blockchain
 */

import { useState, useEffect } from "react";
import { getAllPools, getPoolMetadataStrings, PoolData } from "@/lib/poolQueries";

export function usePools() {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPools = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("🚀 Fetching pools from blockchain...");
      const poolsData = await getAllPools();
      setPools(poolsData);

      // Log metadata array
      const metadataStrings = poolsData.map(p => p.metadata);
      console.log("\n✨ Pool Metadata Array:");
      console.log(metadataStrings);

      return poolsData;
    } catch (err: any) {
      console.error("Failed to fetch pools:", err);
      setError(err.message || "Failed to fetch pools");
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    pools,
    loading,
    error,
    fetchPools,
  };
}

export function usePoolMetadata() {
  const [metadata, setMetadata] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetadata = async () => {
    setLoading(true);
    setError(null);

    try {
      const metadataStrings = await getPoolMetadataStrings();
      setMetadata(metadataStrings);
      return metadataStrings;
    } catch (err: any) {
      console.error("Failed to fetch pool metadata:", err);
      setError(err.message || "Failed to fetch pool metadata");
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    metadata,
    loading,
    error,
    fetchMetadata,
  };
}
