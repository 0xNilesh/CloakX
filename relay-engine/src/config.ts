export const CONFIG = {
	NETWORK: 'testnet' as const, // or 'localnet' / 'mainnet'
	POLLING_INTERVAL_MS: 5_000,

	CLOAKX: {
		packageId: '0xc70af73a7d9e7932c94506523a5d141871f3eb84e81a65e171d075bb43b8e07e',
		module: 'jobs',
	},

	OBJECTS: {
		POOL_REGISTRY:
			'0x022e4cd08d7b267f733fdc5e625e617a6fb875ef9e24b460d5276ec60bb9d069',
		JOB_REGISTRY:
			'0x5decd6dfe763b48dc8ae01a3588a43cea7c8ab489daa6c8ab9fdfed77fa8085f',
		ADMIN_CAP:
			'0x8b2cb1fda5f56bd98201aeb339ff455dec07d7f2f8a8b54b3be38e697f3a322b',
		UPGRADE_CAP:
			'0x558e5d1961d1797d841f35bdaf5f5c966fadbf52bd1945d78214c5d83c0893e8',
	},

	addresses: {
		publisher: '0x655de55c177944b888e022b8cd82f5134765028034a7858e34025032bf2bfd79',
		enclavePackage: '0x06e385548bc3f9b157907fdf01f1d0c60f6614b0431b1cc0a84b3da4d5a02920',
	},
};
