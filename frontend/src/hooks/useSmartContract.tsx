import { useWallet } from "@suiet/wallet-kit";
import { toast } from "sonner";
import { callMoveFunction, getAccountBalance, transferSui } from "@/lib/suiContract";

/**
 * Custom hook for interacting with SUI Move smart contracts
 *
 * Usage example in a component:
 *
 * const {
 *   callContract,
 *   getBalance,
 *   transfer,
 *   address,
 *   connected
 * } = useSmartContract();
 *
 * // Call a Move function
 * await callContract(
 *   "0xYOUR_PACKAGE_ID",
 *   "module_name",
 *   "function_name",
 *   [arg1, arg2]
 * );
 */
export const useSmartContract = () => {
  const wallet = useWallet();

  // Call a Move function on your smart contract
  const callContract = async (
    packageId: string,
    moduleName: string,
    functionName: string,
    args: any[] = []
  ) => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      toast.loading("Processing transaction...");

      const result = await callMoveFunction(
        wallet.signAndExecuteTransaction,
        packageId,
        moduleName,
        functionName,
        args
      );

      toast.success("Transaction successful!");
      return result;
    } catch (error: any) {
      toast.error(`Transaction failed: ${error.message}`);
      throw error;
    }
  };

  // Get SUI balance for connected wallet
  const getBalance = async () => {
    if (!wallet.address) {
      toast.error("Please connect your wallet first");
      return null;
    }

    try {
      const balance = await getAccountBalance(wallet.address);
      return balance;
    } catch (error: any) {
      toast.error(`Failed to fetch balance: ${error.message}`);
      return null;
    }
  };

  // Transfer SUI to another address
  const transfer = async (recipientAddress: string, amount: number) => {
    if (!wallet.connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      toast.loading("Transferring SUI...");

      const result = await transferSui(
        wallet.signAndExecuteTransaction,
        recipientAddress,
        amount
      );

      toast.success("Transfer successful!");
      return result;
    } catch (error: any) {
      toast.error(`Transfer failed: ${error.message}`);
      throw error;
    }
  };

  return {
    callContract,
    getBalance,
    transfer,
    address: wallet.address,
    connected: wallet.connected,
    account: wallet.account,
    wallet,
  };
};
