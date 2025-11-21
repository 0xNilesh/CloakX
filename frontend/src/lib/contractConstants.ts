/**
 * CloakX Smart Contract Constants
 * Addresses from deployed contracts on Sui Testnet
 */

// Package ID - Main CloakX package
export const PACKAGE_ID = "0x5490bef7987ed1c72cf5750de3a269c197d6743a0359a360cca8472b5f1a815a";

// Module Names
export const MODULES = {
  POOLS: "pools",
  JOBS: "jobs",
  USER_DATA: "user_data",
} as const;

// Shared Object IDs
export const POOL_REGISTRY_ID = "0xffca34785317c6dcde84e1245130983a67c814e14f6f4ff086994575170a51dc";
export const JOB_REGISTRY_ID = "0x480896e60dd02d226c05e2d5544402a527891b429653271a3c94a3d0cb89ed40";

// Admin Objects (owned by publisher)
export const ADMIN_CAP_ID = "0x83a50290d019da09bf3427821d62c646d3e2a59aab6d05a60433bd9474fb4e4e";
export const UPGRADE_CAP_ID = "0x3df79134da79bd8446cf2c7bf4ee8f1256148e20ecd2541b527dcfe1810475aa";

// Enclave Objects
export const CAP_OBJECT_ID = "0x457631a7fad3b243cb6ecb72061ffe64884a5e3cfab30df71f468575f7783c49";
export const ENCLAVE_CONFIG_ID = "0xb6f53fa0fcbc34b88d654edf96206e360ce5553b6b51433e24f319360e98ad41";

// Addresses
export const PUBLISHER_ADDRESS = "0x655de55c177944b888e022b8cd82f5134765028034a7858e34025032bf2bfd79";
export const ENCLAVE_PACKAGE_ADDRESS = "0x06e385548bc3f9b157907fdf01f1d0c60f6614b0431b1cc0a84b3da4d5a02920";

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
