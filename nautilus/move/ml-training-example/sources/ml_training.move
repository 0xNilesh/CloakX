// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

module app::ml_training;

use enclave::enclave::{Self, Enclave};
use std::string::String;
use std::vector;

/// ====
/// ML Training verification contract
/// Verifies trained model attestations from Nitro Enclave
/// ====

const ML_TRAINING_INTENT: u8 = 0;
const EInvalidSignature: u64 = 1;
const EInvalidAccuracy: u64 = 2;

/// Represents a trained ML model stored on-chain
/// The actual model weights remain off-chain in the enclave
/// Only the attestation and metadata are stored here
public struct TrainedModel has key, store {
    id: UID,
    /// Reference to training data blob
    blob_id: String,
    /// Final loss value (fixed point: stored as integer * 10000)
    final_loss: u64,
    /// Model accuracy percentage (0-100)
    accuracy: u64,
    /// Hash of trained weights for verification
    model_hash: vector<u8>,
    /// Timestamp when model was trained (ms since epoch)
    timestamp_ms: u64,
    /// Address of the model owner
    owner: address,
}

/// Should match the inner struct T used for IntentMessage<T> in Rust.
public struct MLTrainingResponse has copy, drop {
    blob_id: String,
    final_loss: u64,
    accuracy: u64,
    model_hash: vector<u8>,
}

public struct ML_TRAINING has drop {}

fun init(otw: ML_TRAINING, ctx: &mut TxContext) {
    let cap = enclave::new_cap(otw, ctx);

    // Create enclave config with PCR values
    // These should be updated with actual PCR values from your enclave
    cap.create_enclave_config(
        b"ml-training enclave".to_string(),
        x"0000000000000000000000000000000000000000000000000000000000000000", // pcr0
        x"0000000000000000000000000000000000000000000000000000000000000000", // pcr1
        x"0000000000000000000000000000000000000000000000000000000000000000", // pcr2
        ctx,
    );

    transfer::public_transfer(cap, ctx.sender())
}

/// Process and verify training results from enclave
/// Returns a TrainedModel NFT that can be used for inference requests
public fun register_trained_model<T>(
    blob_id: String,
    final_loss: u64,
    accuracy: u64,
    model_hash: vector<u8>,
    timestamp_ms: u64,
    sig: &vector<u8>,
    enclave: &Enclave<T>,
    ctx: &mut TxContext,
): TrainedModel {
    // Verify that the enclave signature is valid
    let res = enclave.verify_signature(
        ML_TRAINING_INTENT,
        timestamp_ms,
        MLTrainingResponse {
            blob_id: blob_id,
            final_loss,
            accuracy,
            model_hash: model_hash,
        },
        sig,
    );
    assert!(res, EInvalidSignature);

    // Verify accuracy is in valid range
    assert!(accuracy <= 100, EInvalidAccuracy);

    // Create and return model NFT
    TrainedModel {
        id: object::new(ctx),
        blob_id,
        final_loss,
        accuracy,
        model_hash,
        timestamp_ms,
        owner: ctx.sender(),
    }
}

/// Use case 1: Request inference on a trained model
/// The model stays in the enclave, only the reference is on-chain
public fun request_inference(
    model: &TrainedModel,
    input_data: vector<u8>,
    ctx: &mut TxContext,
): InferenceRequest {
    InferenceRequest {
        id: object::new(ctx),
        model_hash: model.model_hash,
        blob_id: model.blob_id,
        input_data,
        timestamp_ms: ctx.epoch(),
    }
}

/// Represents a pending inference request
public struct InferenceRequest has key, store {
    id: UID,
    model_hash: vector<u8>,
    blob_id: String,
    input_data: vector<u8>,
    timestamp_ms: u64,
}

/// Use case 2: Get model statistics
public fun get_model_stats(model: &TrainedModel): (u64, u64, u64) {
    (model.final_loss, model.accuracy, model.timestamp_ms)
}

/// Use case 3: Verify model integrity
/// Ensures the model hash matches expected values
public fun verify_model_integrity(
    model: &TrainedModel,
    expected_hash: &vector<u8>,
): bool {
    &model.model_hash == expected_hash
}

/// Use case 4: Transfer model ownership
public fun transfer_model(
    model: TrainedModel,
    recipient: address,
) {
    transfer::public_transfer(model, recipient)
}

#[test]
fun test_ml_training_flow() {
    use sui::test_scenario::{Self, ctx, next_tx};
    use sui::nitro_attestation;
    use sui::test_utils::destroy;
    use enclave::enclave::{register_enclave, create_enclave_config, update_pcrs, EnclaveConfig};

    let mut scenario = test_scenario::begin(@0x1);
    let mut clock = sui::clock::create_for_testing(scenario.ctx());
    clock.set_for_testing(1744684007462);

    // Initialize ML Training module
    let cap = enclave::new_cap(ML_TRAINING {}, scenario.ctx());
    cap.create_enclave_config(
        b"ml-training enclave".to_string(),
        x"0000000000000000000000000000000000000000000000000000000000000000",
        x"0000000000000000000000000000000000000000000000000000000000000000",
        x"0000000000000000000000000000000000000000000000000000000000000000",
        scenario.ctx(),
    );

    scenario.next_tx(@0x1);

    let mut config = scenario.take_shared<EnclaveConfig<ML_TRAINING>>();

    // Update with actual PCR values from your ML training enclave
    config.update_pcrs(
        &cap,
        x"cbe1afb6ed0ff89f10295af0b802247ec5670da8f886e71a4226373b032c322f4e42c9c98288e7211682b258684505a2",
        x"cbe1afb6ed0ff89f10295af0b802247ec5670da8f886e71a4226373b032c322f4e42c9c98288e7211682b258684505a2",
        x"21b9efbc184807662e966d34f390821309eeac6802309798826296bf3e8bec7c10edb30948c90ba67310f7b964fc500a",
    );

    scenario.next_tx(@0x1);

    // Register model
    let enclave = scenario.take_shared<Enclave<ML_TRAINING>>();

    let model = register_trained_model(
        b"blob_dataset_123".to_string(),
        5000,  // loss: 0.5
        85,    // accuracy: 85%
        vector::tabulate(32, |_| 0xABu8), // model hash
        1744683300000,
        &vector::empty(),  // signature (would be real in production)
        &enclave,
        scenario.ctx(),
    );

    // Test model statistics
    let (loss, accuracy, _timestamp) = get_model_stats(&model);
    assert!(loss == 5000, 0);
    assert!(accuracy == 85, 0);

    // Test model integrity verification
    let model_hash = vector::tabulate(32, |_| 0xABu8);
    assert!(verify_model_integrity(&model, &model_hash), 0);

    // Cleanup
    sui::transfer::public_transfer(model, scenario.ctx().sender());
    test_scenario::return_shared(config);
    test_scenario::return_shared(enclave);
    clock.destroy_for_testing();
    destroy(cap);
    scenario.end();
}
