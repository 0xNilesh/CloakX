// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

use crate::common::IntentMessage;
use crate::common::{to_signed_response, IntentScope, ProcessDataRequest, ProcessedDataResponse};
use crate::AppState;
use crate::EnclaveError;
use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use rand::RngCore;
use sha2::{Sha256, Digest};

// ===== Key Generation Endpoints =====

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateKeyRequest {
    /// Optional seed for deterministic key generation
    pub seed: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateKeyResponse {
    /// Public key (hex encoded)
    pub public_key: String,
    /// Key ID for reference
    pub key_id: String,
}

/// Generate a new encryption key pair
pub async fn generate_key_pair(
    State(state): State<Arc<AppState>>,
    Json(request): Json<GenerateKeyRequest>,
) -> Result<Json<GenerateKeyResponse>, EnclaveError> {
    // Generate 256-bit private key
    let private_key = if let Some(seed) = request.seed {
        // Deterministic key from seed
        let mut hasher = Sha256::new();
        hasher.update(seed.as_bytes());
        hasher.finalize().to_vec()
    } else {
        // Random key
        let mut key = vec![0u8; 32];
        rand::thread_rng().fill_bytes(&mut key);
        key
    };

    // Derive public key (using hash for simplicity - in production use proper key derivation)
    let mut hasher = Sha256::new();
    hasher.update(&private_key);
    hasher.update(b"public");
    let public_key = hasher.finalize().to_vec();

    // Generate key ID
    let mut key_id_hasher = Sha256::new();
    key_id_hasher.update(&public_key);
    let key_id = hex::encode(&key_id_hasher.finalize()[..16]);

    // Store private key in AppState (you'll need to add a HashMap to AppState)
    // For now, we'll store it in a thread-local or environment variable
    std::env::set_var(format!("PRIVATE_KEY_{}", key_id), hex::encode(&private_key));

    Ok(Json(GenerateKeyResponse {
        public_key: hex::encode(&public_key),
        key_id,
    }))
}

// ===== AES Encryption/Decryption =====

/// Encrypt data using AES-256-GCM
fn aes_encrypt(data: &[u8], key: &[u8; 32]) -> Result<Vec<u8>, EnclaveError> {
    let cipher = Aes256Gcm::new(key.into());
    
    // Generate random nonce (12 bytes for GCM)
    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    // Encrypt
    let ciphertext = cipher
        .encrypt(nonce, data)
        .map_err(|e| EnclaveError::GenericError(format!("Encryption failed: {}", e)))?;
    
    // Prepend nonce to ciphertext
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);
    
    Ok(result)
}

/// Decrypt data using AES-256-GCM
fn aes_decrypt(encrypted_data: &[u8], key: &[u8; 32]) -> Result<Vec<u8>, EnclaveError> {
    if encrypted_data.len() < 12 {
        return Err(EnclaveError::GenericError("Invalid encrypted data".to_string()));
    }
    
    let cipher = Aes256Gcm::new(key.into());
    
    // Extract nonce (first 12 bytes)
    let nonce = Nonce::from_slice(&encrypted_data[..12]);
    let ciphertext = &encrypted_data[12..];
    
    // Decrypt
    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| EnclaveError::GenericError(format!("Decryption failed: {}", e)))?;
    
    Ok(plaintext)
}

// ===== ML Training with Encrypted Data =====

#[derive(Debug, Serialize, Deserialize)]
pub struct MLTrainingRequest {
    /// List of encrypted data blob IDs (CSV files)
    pub data_blob_ids: Vec<String>,
    
    /// Model configuration blob ID (encrypted JSON)
    pub model_config_blob_id: String,
    
    /// Key ID for decryption
    pub key_id: String,
    
    /// Learning rate for training (fixed point)
    pub learning_rate: u64,
    
    /// Number of training epochs
    pub epochs: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelConfig {
    pub hidden_layer_size: u64,
    pub activation: String, // "relu" or "sigmoid"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MLTrainingResponse {
    /// Blob ID of encrypted trained model
    pub model_blob_id: String,
    
    /// Training accuracy (0-100)
    pub accuracy: u64,
    
    /// Final training loss (fixed point)
    pub final_loss: u64,
    
    /// Number of training samples
    pub num_samples: u64,
    
    /// Model hash for verification
    pub model_hash: Vec<u8>,
}

/// Simple 2-layer neural network trainer
struct SimpleNeuralNetwork {
    w1: Vec<Vec<f64>>,
    b1: Vec<f64>,
    w2: Vec<f64>,
    b2: f64,
}

impl SimpleNeuralNetwork {
    fn new(input_size: usize, hidden_size: usize) -> Self {
        let mut w1 = vec![vec![0.1; input_size]; hidden_size];
        let mut w2 = vec![0.1; hidden_size];
        
        for i in 0..hidden_size {
            for j in 0..input_size {
                w1[i][j] = ((i * 73 + j * 43) % 100) as f64 / 1000.0;
            }
            w2[i] = ((i * 19) % 100) as f64 / 1000.0;
        }
        
        SimpleNeuralNetwork {
            w1,
            b1: vec![0.0; hidden_size],
            w2,
            b2: 0.0,
        }
    }
    
    fn sigmoid(x: f64) -> f64 {
        1.0 / (1.0 + (-x).exp())
    }
    
    fn relu(x: f64) -> f64 {
        if x > 0.0 { x } else { 0.0 }
    }
    
    fn forward(&self, x: &[f64]) -> (f64, Vec<f64>) {
        let hidden_size = self.w1.len();
        let mut z1 = self.b1.clone();
        
        for i in 0..hidden_size {
            for j in 0..x.len() {
                z1[i] += x[j] * self.w1[i][j];
            }
        }
        
        let a1: Vec<f64> = z1.iter().map(|&z| Self::relu(z)).collect();
        let mut z2 = self.b2;
        
        for i in 0..hidden_size {
            z2 += a1[i] * self.w2[i];
        }
        
        let output = Self::sigmoid(z2);
        (output, a1)
    }
    
    fn backward(&mut self, x: &[f64], y: f64, learning_rate: f64) -> f64 {
        let (output, a1) = self.forward(x);
        let loss = -(y * output.ln() + (1.0 - y) * (1.0 - output).ln());
        let dz2 = output - y;
        
        for i in 0..self.w2.len() {
            self.w2[i] -= learning_rate * dz2 * a1[i];
        }
        self.b2 -= learning_rate * dz2;
        
        let mut da1 = vec![0.0; a1.len()];
        for i in 0..a1.len() {
            da1[i] = dz2 * self.w2[i];
        }
        
        for i in 0..self.w1.len() {
            for j in 0..x.len() {
                let grad = da1[i] * x[j] * if a1[i] > 0.0 { 1.0 } else { 0.0 };
                self.w1[i][j] -= learning_rate * grad;
            }
            self.b1[i] -= learning_rate * da1[i];
        }
        
        loss
    }
    
    fn serialize(&self) -> Vec<u8> {
        // Serialize model to bytes (simple format)
        serde_json::to_vec(&(
            &self.w1,
            &self.b1,
            &self.w2,
            self.b2,
        )).unwrap()
    }
    
    fn get_weights_hash(&self) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(&self.serialize());
        hasher.finalize().to_vec()
    }
}

/// Fetch and decrypt blob from Walrus
async fn fetch_and_decrypt_blob(
    blob_id: &str,
    key: &[u8; 32],
    aggregator_url: &str,
) -> Result<Vec<u8>, EnclaveError> {
    let url = format!("{}/v1/blobs/{}", aggregator_url, blob_id);
    let response = reqwest::get(&url)
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Failed to fetch blob: {}", e)))?;
    
    if !response.status().is_success() {
        return Err(EnclaveError::GenericError(format!(
            "Blob not found: {} (status: {})",
            blob_id,
            response.status()
        )));
    }
    
    let encrypted_data = response
        .bytes()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Failed to read blob: {}", e)))?;
    
    aes_decrypt(&encrypted_data, key)
}

/// Parse CSV data into features and labels
fn parse_csv_data(csv_content: &str) -> Result<(Vec<Vec<f64>>, Vec<f64>), EnclaveError> {
    let mut x_data = Vec::new();
    let mut y_data = Vec::new();
    
    for line in csv_content.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }
        
        let fields: Vec<&str> = line.split(',').collect();
        if fields.len() < 2 {
            return Err(EnclaveError::GenericError(
                "CSV must have at least 2 columns".to_string(),
            ));
        }
        
        // Last column is label, rest are features
        let label: f64 = fields[fields.len() - 1]
            .parse()
            .map_err(|_| EnclaveError::GenericError("Invalid label".to_string()))?;
        
        let mut features = Vec::new();
        for i in 0..fields.len() - 1 {
            let value: f64 = fields[i]
                .parse()
                .map_err(|_| EnclaveError::GenericError("Invalid feature".to_string()))?;
            features.push(value);
        }
        
        x_data.push(features);
        y_data.push(if label > 0.5 { 1.0 } else { 0.0 });
    }
    
    Ok((x_data, y_data))
}

/// Upload encrypted data to Walrus
async fn upload_encrypted_to_walrus(
    data: &[u8],
    key: &[u8; 32],
    publisher_url: &str,
) -> Result<String, EnclaveError> {
    let encrypted = aes_encrypt(data, key)?;
    
    let client = reqwest::Client::new();
    let response = client
        .put(format!("{}/v1/store", publisher_url))
        .body(encrypted)
        .send()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Upload failed: {}", e)))?;
    
    if !response.status().is_success() {
        return Err(EnclaveError::GenericError(format!(
            "Upload failed with status: {}",
            response.status()
        )));
    }
    
    #[derive(Deserialize)]
    struct StoreResponse {
        blob_id: String,
    }
    
    let store_resp: StoreResponse = response
        .json()
        .await
        .map_err(|e| EnclaveError::GenericError(format!("Invalid response: {}", e)))?;
    
    Ok(store_resp.blob_id)
}

pub async fn process_data(
    State(state): State<Arc<AppState>>,
    Json(request): Json<ProcessDataRequest<MLTrainingRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<MLTrainingResponse>>>, EnclaveError> {
    let payload = request.payload;
    
    // Get private key from storage
    let private_key_hex = std::env::var(format!("PRIVATE_KEY_{}", payload.key_id))
        .map_err(|_| EnclaveError::GenericError("Key not found".to_string()))?;
    
    let private_key_vec = hex::decode(&private_key_hex)
        .map_err(|_| EnclaveError::GenericError("Invalid key format".to_string()))?;
    
    let mut private_key = [0u8; 32];
    private_key.copy_from_slice(&private_key_vec);
    
    let walrus_aggregator = std::env::var("WALRUS_AGGREGATOR")
        .unwrap_or_else(|_| "https://aggregator-testnet.walrus.space".to_string());
    let walrus_publisher = std::env::var("WALRUS_PUBLISHER")
        .unwrap_or_else(|_| "https://publisher-testnet.walrus.space".to_string());
    
    // Fetch and decrypt model config
    let config_data = fetch_and_decrypt_blob(
        &payload.model_config_blob_id,
        &private_key,
        &walrus_aggregator,
    ).await?;
    
    let config: ModelConfig = serde_json::from_slice(&config_data)
        .map_err(|e| EnclaveError::GenericError(format!("Invalid config: {}", e)))?;
    
    // Fetch and decrypt all data blobs, combine CSV data
    let mut all_x_data = Vec::new();
    let mut all_y_data = Vec::new();
    
    for blob_id in &payload.data_blob_ids {
        let csv_data = fetch_and_decrypt_blob(blob_id, &private_key, &walrus_aggregator).await?;
        let csv_content = String::from_utf8(csv_data)
            .map_err(|_| EnclaveError::GenericError("Invalid UTF-8".to_string()))?;
        
        let (mut x, mut y) = parse_csv_data(&csv_content)?;
        all_x_data.append(&mut x);
        all_y_data.append(&mut y);
    }
    
    if all_x_data.is_empty() {
        return Err(EnclaveError::GenericError("No training data found".to_string()));
    }
    
    let input_size = all_x_data[0].len();
    let learning_rate = (payload.learning_rate as f64) / 10000.0;
    
    // Train model
    let mut model = SimpleNeuralNetwork::new(input_size, config.hidden_layer_size as usize);
    let mut final_loss = 0.0;
    
    for _ in 0..payload.epochs {
        let mut epoch_loss = 0.0;
        for i in 0..all_x_data.len() {
            let loss = model.backward(&all_x_data[i], all_y_data[i], learning_rate);
            epoch_loss += loss;
        }
        final_loss = epoch_loss / all_x_data.len() as f64;
    }
    
    // Calculate accuracy
    let mut correct = 0;
    for i in 0..all_x_data.len() {
        let (output, _) = model.forward(&all_x_data[i]);
        let prediction = if output > 0.5 { 1.0 } else { 0.0 };
        if (prediction - all_y_data[i]).abs() < 0.01 {
            correct += 1;
        }
    }
    let accuracy = (correct * 100) / all_x_data.len() as u64;
    
    // Encrypt and upload trained model
    let model_bytes = model.serialize();
    let model_blob_id = upload_encrypted_to_walrus(&model_bytes, &private_key, &walrus_publisher).await?;
    
    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;
    
    let response = MLTrainingResponse {
        model_blob_id,
        accuracy,
        final_loss: (final_loss * 10000.0) as u64,
        num_samples: all_x_data.len() as u64,
        model_hash: model.get_weights_hash(),
    };
    
    Ok(Json(to_signed_response(
        &state.eph_kp,
        response,
        timestamp_ms,
        IntentScope::ProcessData,
    )))
}