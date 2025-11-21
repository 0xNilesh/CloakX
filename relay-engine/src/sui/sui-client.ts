import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { fromB64 } from "@mysten/sui/utils";

export const getAdminClient = () => {
  const secret = process.env["ADMIN_PRIVATE_KEY"]; // base64 exported
  const kp = Ed25519Keypair.fromSecretKey(fromB64(secret));
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  return { client, keypair: kp };
};

export const signAndExecute = async (txb: Transaction) => {
  const { client, keypair } = getAdminClient();
  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: txb,
  });
  return result;
};
