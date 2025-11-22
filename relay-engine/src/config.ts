export const CONFIG = {
	NETWORK: 'testnet' as const, // or 'localnet' / 'mainnet'
	POLLING_INTERVAL_MS: 5_000,

	CLOAKX: {
		// Updated to match contractConstants.ts
		packageId: '0x4ed393ca28d4e62d864c49375d2981ab0d0d89f4b9ecc139c804fe008cea7d85',
		module: 'jobs',
	},

	OBJECTS: {
		// Updated to match contractConstants.ts
		POOL_REGISTRY:
			'0x1302caa28d05f1840c14a5759f2e63f5a46c7d493178d3b3500d5fe43ae95f8e',
		JOB_REGISTRY:
			'0x89bf7e1413730788703c0b50fb4b96010fb43e8ba7a5fa1fc2266311e7dbe21c',
		ADMIN_CAP:
			'0xfceeb97dd759c83c3939e148a34d16cb3fc12915b6d78bfed23f0f2e4e4c6694',
		UPGRADE_CAP:
			'0x005d79900e06faeba61387a95daee90e4ff63b3c2667cdcb363f7d665ca7c6a4',
	},

	addresses: {
		publisher: '0x655de55c177944b888e022b8cd82f5134765028034a7858e34025032bf2bfd79',
		enclavePackage: '0x06e385548bc3f9b157907fdf01f1d0c60f6614b0431b1cc0a84b3da4d5a02920',
	},
};
