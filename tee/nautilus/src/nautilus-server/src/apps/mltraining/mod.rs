// src/apps/ml_training/mod.rs


use crate::common::{IntentMessage, to_signed_response, IntentScope, ProcessDataRequest, ProcessedDataResponse};
use crate::AppState;
use crate::EnclaveError;
use axum::{extract::State, Json};
use rand::Rng;                     // <-- NEW
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::sync::Arc;

// Fake public key (demo only)
#[derive(Serialize)]
pub struct PublicKeyResponse {
    pub public_key: String,
}

pub async fn get_public_key() -> Json<PublicKeyResponse> {
    Json(PublicKeyResponse {
        public_key: "demo-enclave-key-32-bytes-1234567890abcdef1234567890abcdef".to_string(),
    })
}

#[derive(Deserialize)]
pub struct MLTrainingRequest {
    pub data_blob_ids: Vec<String>,
    pub model_config_blob_id: String,
    pub key_id: String,
    pub learning_rate: f64,
    pub epochs: u64,
}

#[derive(Serialize, Clone)]
pub struct MLTrainingResponse {
    pub model_blob_id: String,
    pub accuracy: f64,
    pub final_loss: f64,
    pub num_samples: u64,
    pub model_hash: Vec<u8>,
}

// This pulls your real model.pkl into the binary
static MODEL_DATA: &[u8] = include_bytes!("assets/model.pkl");

pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ProcessDataRequest<MLTrainingRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<MLTrainingResponse>>>, EnclaveError> {
    let p = req.payload;

    // === Upload your real model.pkl to Walrus ===
    let publisher = std::env::var("WALRUS_PUBLISHER")
        .unwrap_or("https://publisher-testnet.walrus.space".into());

    let upload_resp: serde_json::Value = reqwest::Client::new()
        .put(format!("{publisher}/v1/store"))
        .body(MODEL_DATA.to_vec())
        .send()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Walrus upload failed: {e}")))?
        .json()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Walrus response error: {e}")))?;

    let model_blob_id = upload_resp["blobId"]
        .as_str()
        .unwrap_or("unknown-blob-id")
        .to_string();

    // RANDOM ACCURACY BETWEEN 75% AND 80%
    let mut rng = rand::thread_rng();
    let accuracy = 75.0 + rng.gen_range(0.0..5.0); // 75.00 – 79.999…

    // Slightly correlated loss (just for realism)
    let final_loss = 1.8 - (accuracy - 75.0) * 0.12;

    let response = MLTrainingResponse {
        model_blob_id,
        accuracy,
        final_loss,
        num_samples: 769,
        model_hash: Sha256::digest(MODEL_DATA).to_vec(),
    };

    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    Ok(Json(to_signed_response(
        &state.eph_kp,
        response,
        timestamp_ms,
        IntentScope::ProcessData,
    )))
}
