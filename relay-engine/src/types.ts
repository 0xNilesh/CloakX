// src/types.ts

export type JobCreatedEvent = {
	job_id: string; // Sui serialises u64 as string
	creator: string;
	pool_id: string;
	price: string;
	buyer_public_key: string; // hex-encoded bytes
	epochs: string;
	learning_rate: string;
};

export type JobCompletedEvent = {
	job_id: string;
	model_blob_id: string;
	accuracy: string;
	final_loss: string;
	num_samples: string;
	model_hash: string;
};
