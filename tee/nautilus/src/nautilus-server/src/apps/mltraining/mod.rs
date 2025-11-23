// src/apps/ml_training/mod.rs
use crate::common::{
    IntentMessage, to_signed_response, IntentScope, ProcessDataRequest, ProcessedDataResponse,
};
use crate::AppState;
use crate::EnclaveError;
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::fs;

// === REAL KEYPAIR (generated once at startup) ===
use once_cell::sync::Lazy;
use ed25519_dalek::{Keypair, PublicKey};
use rand::rngs::OsRng;

static KEYPAIR: Lazy<Keypair> = Lazy::new(|| {
    let mut csprng = OsRng;
    Keypair::generate(&mut csprng)
});

static PUBLIC_KEY_B64: Lazy<String> = Lazy::new(|| {
    base64::encode(KEYPAIR.public.as_bytes())
});

// === PUBLIC KEY ENDPOINT===
#[derive(Serialize)]
pub struct PublicKeyResponse {
    pub public_key: String,
}

pub async fn get_public_key() -> Json<PublicKeyResponse> {
    Json(PublicKeyResponse {
        public_key: PUBLIC_KEY_B64.clone(),
    })
}

// === REQUEST ===
#[derive(Deserialize, Debug)]
pub struct MLTrainingRequest {
    pub data_blob_ids: Vec<String>,
    pub model_config_blob_id: String,
    pub key_id: String,
    pub learning_rate: f64,
    pub epochs: u64,
}

// === MODEL CONFIG ===
#[derive(Deserialize, Debug)]
pub struct LayerConfig {
    pub neurons: usize,
    pub activation: String,
    pub dropout: Option<f32>,
}

#[derive(Deserialize, Debug)]
pub struct ModelConfig {
    pub input_size: usize,
    pub output_size: usize,
    pub layers: Vec<LayerConfig>,
}

// === RESPONSE ===
#[derive(Serialize, Clone, Debug)]
pub struct MLTrainingResponse {
    pub model_blob_id: String,
    pub accuracy: String,
    pub final_loss: String,
    pub num_samples: String,
}

// === BURN IMPORTS ===
use burn::{
    module::{Module, Param},
    tensor::{backend::AutodiffBackend, Tensor, Device},
    nn::{
        Linear, LinearConfig, ReLU, Sigmoid, Tanh, LeakyReLU,
        Dropout, DropoutConfig, Initializer,
    },
    data::dataloader::DataLoaderBuilder,
    train::{TrainerBuilder, LearnerBuilder, TrainStep},
    record::BinBytesRecorder,
};
use burn::backend::{NdArray, NdArrayDevice};
use burn::tensor::backend::Backend;

type Backend = NdArray;
type Autodiff = AutodiffBackend<Backend>;
type Device = NdArrayDevice;

// === DYNAMIC MODEL ===
#[derive(Module, Debug)]
pub struct DynamicNet<B: Backend> {
    layers: Vec<Box<dyn Module<B>>>,
    output: Linear<B>,
}

impl<B: Backend> DynamicNet<B> {
    pub fn forward(&self, x: Tensor<B, 2>) -> Tensor<B, 2> {
        let mut x = x;
        for layer in &self.layers {
            x = layer.forward(x);
        }
        self.output.forward(x)
    }
}

// === MAIN TRAINING  ===
pub async fn process_data(
    State(_state): State<Arc<AppState>>,
    Json(req): Json<ProcessDataRequest<MLTrainingRequest>>,
) -> Result<Json<ProcessedDataResponse<IntentMessage<MLTrainingResponse>>>, EnclaveError> {
    let payload = &req.payload;
    let device = Device::Cpu;

    // 1. Download and save model config
    let config_bytes = download_blob(&payload.model_config_blob_id).await?;
    fs::create_dir_all("assets")?;
    fs::write("assets/model_config.json", &config_bytes)?;
    let config: ModelConfig = serde_json::from_slice(&config_bytes)
        .map_err(|e| EnclaveError::InvalidInput(e.to_string()))?;

    // 2. Download and parse all data
    let mut inputs = vec![];
    let mut targets = vec![];
    for blob_id in &payload.data_blob_ids {
        let data = download_blob(blob_id).await?;
        let batch: Vec<(Vec<f32>, usize)> = serde_json::from_slice(&data)
            .map_err(|e| EnclaveError::InvalidInput(e.to_string()))?;
        for (input, label) in batch {
            inputs.push(input);
            targets.push(label);
        }
    }
    let num_samples = inputs.len();

    // 3. Build REAL dynamic network
    let mut layers = vec![];
    let mut in_features = config.input_size;

    for layer in config.layers {
        let linear = LinearConfig::new(in_features, layer.neurons)
            .with_initializer(Initializer::XavierUniform { gain: 1.0 })
            .init(&device);
        layers.push(Box::new(linear) as Box<dyn Module<Backend>>);

        let activation: Box<dyn Module<Backend>> = match layer.activation.as_str() {
            "relu" => Box::new(ReLU::new()),
            "sigmoid" => Box::new(Sigmoid::new()),
            "tanh" => Box::new(Tanh::new()),
            "leaky_relu" => Box::new(LeakyReLU::new(0.01)),
            _ => Box::new(ReLU::new()),
        };
        layers.push(activation);

        if let Some(p) = layer.dropout {
            if p > 0.0 {
                let dropout = DropoutConfig::new(p).init();
                layers.push(Box::new(dropout));
            }
        }
        in_features = layer.neurons;
    }

    let output = LinearConfig::new(in_features, config.output_size)
        .with_initializer(Initializer::XavierUniform { gain: 1.0 })
        .init(&device);

    let model = DynamicNet { layers, output };

    // 4. Trai model
    let mut trainer = LearnerBuilder::new()
        .devices(vec![device.clone()])
        .num_epochs(payload.epochs as usize)
        .build(model, payload.learning_rate as f32, device);

    for epoch in 1..=payload.epochs {
        let mut correct = 0;
        let mut total = 0;
        for (input, target) in inputs.iter().zip(targets.iter()) {
            let input_tensor = Tensor::<Autodiff, 2>::from_data(
                input.as_slice().into(),
                &device,
            ).reshape([1, config.input_size]);

            let target_tensor = Tensor::<Autodiff, 1>::from_data(
                vec![*target as f32],
                &device,
            ).reshape([1]);

            let output = trainer.forward(input_tensor.clone());
            let pred = output.argmax(1).int().to_data().value[0] as usize;
            if pred == *target { correct += 1; }
            total += 1;

            trainer.backward_step(&output, &target_tensor);
            trainer.update();
        }
        if epoch % 10 == 0 || epoch == payload.epochs {
            println!("Epoch {}: Accuracy = {:.2}%", epoch, (correct as f32 / total as f32) * 100.0);
        }
    }

    // 5. Save trained model
    let recorder = BinBytesRecorder::<burn::record::FullPrecisionSettings>::new();
    let model_bytes = trainer.model()
        .save_with_recorder(recorder)
        .expect("Failed to serialize model");
    fs::write("assets/trained_model.pkl", &model_bytes)?;

    // 6. Upload to Walrus
    let model_blob_id = upload_blob(&model_bytes).await?;

    // 7. Final evaluation 
    let final_model = trainer.model();
    let mut correct = 0;
    let mut total_loss = 0.0;
    for (input, target) in inputs.iter().zip(targets.iter()) {
        let input_tensor = Tensor::<Backend, 2>::from_data(input.as_slice().into(), &device)
            .reshape([1, config.input_size]);
        let output = final_model.forward(input_tensor);
        let pred = output.argmax(1).int().to_data().value[0] as usize;
        if pred == *target { correct += 1; }
        total_loss += (pred as f32 - *target as f32).powi(2);
    }

    let accuracy = (correct as f32 / inputs.len() as f32) * 100.0;
    let final_loss = total_loss / inputs.len() as f32;

    // 8. Return signed result
    let response = MLTrainingResponse {
        model_blob_id,
        accuracy: format!("{:.6}", accuracy),
        final_loss: format!("{:.6}", final_loss),
        num_samples: num_samples.to_string(),
    };

    let timestamp_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as u64;

    Ok(Json(to_signed_response(
        &KEYPAIR,
        response,
        timestamp_ms,
        IntentScope::ProcessData,
    )))
}

// === WALRUS HELPERS  ===
async fn download_blob(blob_id: &str) -> Result<Vec<u8>, EnclaveError> {
    let url = format!("https://aggregator.walrus-testnet.walrus.space/v1/{}", blob_id);
    reqwest::get(&url).await.map_err(|e| EnclaveError::Network(e.to_string()))?
        .bytes().await.map(|b| b.to_vec()).map_err(|e| EnclaveError::Network(e.to_string()))
}

async fn upload_blob(data: &[u8]) -> Result<String, EnclaveError> {
    let resp = reqwest::Client::new()
        .put("https://publisher.walrus-testnet.walrus.space/v1/store")
        .body(data.to_vec())
        .header("Content-Type", "application/octet-stream")
        .send()
        .await
        .map_err(|e| EnclaveError::Network(e.to_string()))?;

    let json: serde_json::Value = resp.json().await.map_err(|e| EnclaveError::Network(e.to_string()))?;
    Ok(json["newlyCreated"]["blobObject"]["blobId"].as_str().unwrap_or("unknown").to_string())
}