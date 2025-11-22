import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

// Initialize SUI client for testnet
export const suiClient = new SuiClient({
  url: "https://fullnode.testnet.sui.io:443",
});

// Example: Call a Move function on your smart contract
export const callMoveFunction = async (
  signAndExecuteTransaction: any,
  packageId: string,
  moduleName: string,
  functionName: string,
  args: any[] = []
) => {
  try {
    const tx = new Transaction();

    // Add move call to transaction
    tx.moveCall({
      target: `${packageId}::${moduleName}::${functionName}`,
      arguments: args,
    });

    // Sign and execute transaction
    const result = await signAndExecuteTransaction({
      transaction: tx,
    });

    console.log("Transaction result:", result);
    return result;
  } catch (error) {
    console.error("Error calling Move function:", error);
    throw error;
  }
};

// Example: Read data from blockchain (no transaction needed)
export const readContractData = async (
  packageId: string,
  objectId: string
) => {
  try {
    const object = await suiClient.getObject({
      id: objectId,
      options: {
        showContent: true,
        showOwner: true,
      },
    });
    return object;
  } catch (error) {
    console.error("Error reading contract data:", error);
    throw error;
  }
};

// Example: Get account balance
export const getAccountBalance = async (address: string) => {
  try {
    const balance = await suiClient.getBalance({
      owner: address,
    });
    return balance;
  } catch (error) {
    console.error("Error getting balance:", error);
    throw error;
  }
};

// Example: Get owned objects
export const getOwnedObjects = async (address: string) => {
  try {
    const objects = await suiClient.getOwnedObjects({
      owner: address,
    });
    return objects;
  } catch (error) {
    console.error("Error getting owned objects:", error);
    throw error;
  }
};

// Example: Transfer SUI tokens
export const transferSui = async (
  signAndExecuteTransaction: any,
  recipientAddress: string,
  amount: number // in MIST (1 SUI = 1,000,000,000 MIST)
) => {
  try {
    const tx = new Transaction();

    const [coin] = tx.splitCoins(tx.gas, [amount]);
    tx.transferObjects([coin], recipientAddress);

    const result = await signAndExecuteTransaction({
      transaction: tx,
    });

    return result;
  } catch (error) {
    console.error("Error transferring SUI:", error);
    throw error;
  }
};
