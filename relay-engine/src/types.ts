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

export type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Job {
	id: bigint;
	creator: string;
	poolId: bigint;
	price: bigint;
	buyerPublicKey: string;
	status: JobStatus;
	epochs: bigint;
	learningRate: bigint;
	modelConfigBlobId?: string;
	createdAt?: Date;
	updatedAt?: Date;
}
