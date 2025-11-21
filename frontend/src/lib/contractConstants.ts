/**
 * CloakX Smart Contract Constants
 * Addresses from deployed contracts on Sui Testnet
 */

// Package ID - Main CloakX package
export const PACKAGE_ID = "0xc70af73a7d9e7932c94506523a5d141871f3eb84e81a65e171d075bb43b8e07e";

// Module Names
export const MODULES = {
  POOLS: "pools",
  JOBS: "jobs",
  USER_DATA: "user_data",
} as const;

// Shared Object IDs
export const POOL_REGISTRY_ID = "0x022e4cd08d7b267f733fdc5e625e617a6fb875ef9e24b460d5276ec60bb9d069";
export const JOB_REGISTRY_ID = "0x5decd6dfe763b48dc8ae01a3588a43cea7c8ab489daa6c8ab9fdfed77fa8085f";

// Admin Objects (owned by publisher)
export const ADMIN_CAP_ID = "0x8b2cb1fda5f56bd98201aeb339ff455dec07d7f2f8a8b54b3be38e697f3a322b";
export const UPGRADE_CAP_ID = "0x558e5d1961d1797d841f35bdaf5f5c966fadbf52bd1945d78214c5d83c0893e8";

// Enclave Objects
export const CAP_OBJECT_ID = "0x7b4cc04916c7037fb502a1f989330e15496049a2bd37208a63e9a9325d6874c6";
export const ENCLAVE_CONFIG_ID = "0xb3cb272ac835e9bc76c0ca7aec623467059557c4aadb04c48bea446219ae6e36";

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
