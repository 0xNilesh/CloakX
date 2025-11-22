/**
 * CloakX Smart Contract Constants
 * Addresses from deployed contracts on Sui Testnet
 */

// Package ID - Main CloakX package
export const PACKAGE_ID =
  "0x4ed393ca28d4e62d864c49375d2981ab0d0d89f4b9ecc139c804fe008cea7d85";

// Module Names
export const MODULES = {
  POOLS: "pools",
  JOBS: "jobs",
  USER_DATA: "user_data",
} as const;

// Shared Object IDs
export const POOL_REGISTRY_ID =
  "0x1302caa28d05f1840c14a5759f2e63f5a46c7d493178d3b3500d5fe43ae95f8e";
export const JOB_REGISTRY_ID =
  "0x89bf7e1413730788703c0b50fb4b96010fb43e8ba7a5fa1fc2266311e7dbe21c";

// Table IDs (for querying dynamic fields)
// Pool Registry Tables
export const POOLS_TABLE_ID =
  "0xbb34880c10a44c7a686f0f85848c44d74aa8a61e5fe68140ab84b00753741895";
export const POOL_USERS_TABLE_ID =
  "0x46ac9e7157473c72b52c96a47c737aa92ff1784837f50f7fd1d5ca54fa15ebfd";
export const POOL_DATA_TABLE_ID =
  "0xf73a9e758b78ab349005aefa731c1ad59860b7302cefb074e957247772b3912a";
export const USER_POOLS_TABLE_ID =
  "0xad29dd0818971351e26728f8a651c858c3ecf4a23ae7d49c2f5208c9b144b12b";

// Job Registry Tables
export const JOBS_TABLE_ID =
  "0xfd6bad71cdc8753f395538290c540c26fc417c451c39d0f8ee7e54db4762c16c";
export const JOBS_BY_CREATOR_TABLE_ID =
  "0xae48ad529f099c316b2defa7683798c5ef63658eccb27f478ae1fe0452de73ac";
export const JOBS_BY_STATUS_TABLE_ID =
  "0x468d8d697dcd382eb7e9341b8af2d21ce576bbf316e4328cee7294afbb3e9903";
export const PAYOUTS_TABLE_ID =
  "0x3a4967300519cd65eab659da27f3196b2eeffab491edefa15355034c73c9f9bf";
export const JOB_RESULTS_TABLE_ID =
  "0x1c73a503cb5c3a546d9506225f09bee8cd0f35ea8e1830a66834ee5e37889a65";

// Admin Objects (owned by publisher)
export const ADMIN_CAP_ID =
  "0xfceeb97dd759c83c3939e148a34d16cb3fc12915b6d78bfed23f0f2e4e4c6694";
export const UPGRADE_CAP_ID =
  "0x005d79900e06faeba61387a95daee90e4ff63b3c2667cdcb363f7d665ca7c6a4";

// Enclave Objects
export const CAP_OBJECT_ID =
  "0x8b499fd762a4d71cd7a442a52d6ad0da9e1ef9f56f0138d8af3eec711fb3b807";
export const ENCLAVE_CONFIG_ID =
  "0x5be7f5fc2c42ea883e4747c66c6107135ed93f389f1c81085321921579b4a10e";

// Addresses
export const PUBLISHER_ADDRESS =
  "0x655de55c177944b888e022b8cd82f5134765028034a7858e34025032bf2bfd79";
export const ENCLAVE_PACKAGE_ADDRESS =
  "0x06e385548bc3f9b157907fdf01f1d0c60f6614b0431b1cc0a84b3da4d5a02920";

// Function Targets (pre-constructed for convenience)
export const FUNCTION_TARGETS = {
  // User Data Functions
  REGISTER_USER_DATA: `${PACKAGE_ID}::${MODULES.USER_DATA}::register_user_data`,
  GET_USER_DATA: `${PACKAGE_ID}::${MODULES.USER_DATA}::get_user_data`,
  GET_POOL_USERS: `${PACKAGE_ID}::${MODULES.USER_DATA}::get_pool_users`,

  // Pool Functions
  CREATE_POOL: `${PACKAGE_ID}::${MODULES.POOLS}::create_pool`,
  SET_POOL_ACTIVE: `${PACKAGE_ID}::${MODULES.POOLS}::set_pool_active`,
  POOL_EXISTS: `${PACKAGE_ID}::${MODULES.POOLS}::pool_exists`,

  // Job Functions
  CREATE_JOB: `${PACKAGE_ID}::${MODULES.JOBS}::create_job`,
  CANCEL_JOB: `${PACKAGE_ID}::${MODULES.JOBS}::cancel_job`,
  COMPLETE_JOB: `${PACKAGE_ID}::${MODULES.JOBS}::complete_job`,
  CLAIM_REWARD: `${PACKAGE_ID}::${MODULES.JOBS}::claim_reward`,
} as const;

// Default Pool ID (for testing - assumes pool 1 exists)
export const DEFAULT_POOL_ID = 1;

// Sui Testnet Explorer Base URL
export const SUI_EXPLORER_BASE = "https://testnet.suivision.xyz";

/**
 * Get transaction explorer URL
 */
export function getTransactionUrl(digest: string): string {
  return `${SUI_EXPLORER_BASE}/txblock/${digest}`;
}

/**
 * Get object explorer URL
 */
export function getObjectUrl(objectId: string): string {
  return `${SUI_EXPLORER_BASE}/object/${objectId}`;
}
