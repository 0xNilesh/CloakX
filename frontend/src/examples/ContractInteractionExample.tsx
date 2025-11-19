/**
 * EXAMPLE: How to interact with SUI Move Smart Contracts
 *
 * This file demonstrates how to use the Suiet wallet to interact
 * with your Move smart contracts deployed on SUI testnet.
 *
 * Copy the patterns below into your actual pages (Datasets, Contribute, etc.)
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSmartContract } from "@/hooks/useSmartContract";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const ContractInteractionExample = () => {
  const { callContract, getBalance, connected, address } = useSmartContract();
  const [balance, setBalance] = useState<string | null>(null);

  // Example: Fetch balance when wallet is connected
  useEffect(() => {
    if (connected && address) {
      fetchBalance();
    }
  }, [connected, address]);

  const fetchBalance = async () => {
    const balanceData = await getBalance();
    if (balanceData) {
      // Convert MIST to SUI (1 SUI = 1,000,000,000 MIST)
      const suiBalance = Number(balanceData.totalBalance) / 1_000_000_000;
      setBalance(suiBalance.toFixed(4));
    }
  };

  // Example 1: Call a Move function to contribute data
  const handleContributeData = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      // Replace with your actual smart contract details
      const PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE";
      const MODULE_NAME = "data_marketplace";
      const FUNCTION_NAME = "contribute_data";

      // Example arguments - adjust based on your Move function signature
      const args = [
        // arg1, arg2, etc.
      ];

      const result = await callContract(
        PACKAGE_ID,
        MODULE_NAME,
        FUNCTION_NAME,
        args
      );

      console.log("Contribution result:", result);
      toast.success("Data contributed successfully!");
    } catch (error) {
      console.error("Failed to contribute data:", error);
    }
  };

  // Example 2: Call a Move function to request computation
  const handleRequestComputation = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE";
      const MODULE_NAME = "data_marketplace";
      const FUNCTION_NAME = "request_computation";

      const args = [
        // datasetId, computationType, paymentAmount, etc.
      ];

      const result = await callContract(
        PACKAGE_ID,
        MODULE_NAME,
        FUNCTION_NAME,
        args
      );

      console.log("Computation request result:", result);
      toast.success("Computation requested successfully!");
    } catch (error) {
      console.error("Failed to request computation:", error);
    }
  };

  // Example 3: Call a Move function to claim rewards
  const handleClaimRewards = async () => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      const PACKAGE_ID = "0xYOUR_PACKAGE_ID_HERE";
      const MODULE_NAME = "data_marketplace";
      const FUNCTION_NAME = "claim_rewards";

      const result = await callContract(
        PACKAGE_ID,
        MODULE_NAME,
        FUNCTION_NAME,
        []
      );

      console.log("Claim result:", result);
      toast.success("Rewards claimed successfully!");

      // Refresh balance after claiming
      await fetchBalance();
    } catch (error) {
      console.error("Failed to claim rewards:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Smart Contract Interaction Example</h1>

      {!connected ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please connect your wallet to interact with smart contracts
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Wallet Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-semibold">Address:</span>
                <p className="text-sm text-muted-foreground break-all">{address}</p>
              </div>
              <div>
                <span className="font-semibold">Balance:</span>
                <p className="text-sm text-muted-foreground">
                  {balance !== null ? `${balance} SUI` : "Loading..."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Contract Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Contribute Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Submit encrypted data to the marketplace and earn rewards
                </p>
                <Button onClick={handleContributeData}>
                  Contribute Data
                </Button>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Computation</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Request secure computation on encrypted datasets
                </p>
                <Button onClick={handleRequestComputation} variant="secondary">
                  Request Computation
                </Button>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Claim Rewards</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Claim your earned SUI tokens from data contributions
                </p>
                <Button onClick={handleClaimRewards} variant="outline">
                  Claim Rewards
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Move Smart Contract Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
{`// Example Move module structure:
module data_marketplace {
    // Contribute encrypted data
    public entry fun contribute_data(
        dataset: vector<u8>,
        metadata: String,
        ctx: &mut TxContext
    ) { ... }

    // Request computation on dataset
    public entry fun request_computation(
        dataset_id: ID,
        computation_type: String,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) { ... }

    // Claim earned rewards
    public entry fun claim_rewards(
        ctx: &mut TxContext
    ) { ... }
}`}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
