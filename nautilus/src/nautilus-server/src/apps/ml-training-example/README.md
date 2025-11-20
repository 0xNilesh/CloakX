# ML Training Example - Nautilus Use Case

This example demonstrates how to use Nautilus to train machine learning models securely on AWS Nitro Enclaves with cryptographic attestation on the Sui blockchain.

## Overview

The ML Training example shows how to:

1. **Train models in a secure enclave** - A simple 2-layer neural network trained inside an AWS Nitro Enclave
2. **Attest training results on-chain** - Training metadata and model hash are verified and stored on Sui
3. **Maintain model confidentiality** - Model weights remain encrypted in the enclave; only attestation is public
4. **Enable reproducible ML** - Training uses deterministic initialization based on blob ID

## Architecture

### Enclave Side (Rust)

```
Client Request
    ↓
┌─────────────────────────────────────┐
│  ML Training Enclave                │
├─────────────────────────────────────┤
│ 1. Load training data from blob_id  │
│ 2. Initialize neural network        │
│ 3. Run SGD training loop            │
│ 4. Calculate accuracy metrics       │
│ 5. Hash trained weights             │
│ 6. Sign results with ephemeral key  │
└─────────────────────────────────────┘
    ↓
Signed Response + Weights Hash
```

### On-Chain Side (Move)

```
Signed Response
    ↓
┌─────────────────────────────────────┐
│  Sui Smart Contract                 │
├─────────────────────────────────────┤
│ 1. Verify enclave signature         │
│ 2. Verify accuracy in valid range   │
│ 3. Create TrainedModel NFT          │
│ 4. Store model metadata on-chain    │
│ 5. Enable inference requests        │
└─────────────────────────────────────┘
    ↓
TrainedModel Object
```

## Request Format

```json
{
  "payload": {
    "blob_id": "dataset_v1_2024",
    "hidden_layer_size": 16,
    "learning_rate": 100,
    "epochs": 100
  }
}
```

### Request Parameters

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `blob_id` | String | - | Reference to training data (used to fetch dataset) |
| `hidden_layer_size` | u64 | 2-128 | Number of neurons in middle layer |
| `learning_rate` | u64 | 1-10000 | Learning rate in fixed point (100 = 0.01) |
| `epochs` | u64 | 1-1000 | Number of training iterations |

## Response Format

```json
{
  "response": {
    "data": {
      "blob_id": "dataset_v1_2024",
      "final_loss": 5000,
      "accuracy": 85,
      "model_hash": "0xabcdef..."
    },
    "intent_message": {
      "data": {
        "blob_id": "dataset_v1_2024",
        "final_loss": 5000,
        "accuracy": 85,
        "model_hash": "0xabcdef..."
      },
      "intent_scope": 0,
      "timestamp": 1744038900000
    },
    "signature": "0x..."
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `blob_id` | String | The dataset reference that was trained on |
| `final_loss` | u64 | Binary cross-entropy loss (stored as fixed point * 10000) |
| `accuracy` | u64 | Accuracy percentage (0-100) |
| `model_hash` | Vec<u8> | SHA256 hash of trained weights |

## Model Architecture

The enclave implements a simple 2-layer feedforward neural network:

```
Input Layer (4 features)
    ↓
Hidden Layer (ReLU activation)
    ↓
Output Layer (Sigmoid activation)
    ↓
Binary Classification
```

### Training Details

- **Loss Function**: Binary Cross-Entropy
- **Optimizer**: Stochastic Gradient Descent (SGD)
- **Activation Functions**:
  - Hidden: ReLU
  - Output: Sigmoid
- **Training Data**: Synthetic dataset generated from blob_id hash

## Use Cases

### 1. Register Trained Model

```move
let model = register_trained_model(
    blob_id,
    final_loss,
    accuracy,
    model_hash,
    timestamp_ms,
    &signature,
    &enclave,
    ctx,
);
```

Creates a TrainedModel NFT on-chain that serves as proof of training.

### 2. Request Inference

```move
let request = request_inference(&model, input_data, ctx);
```

Create an inference request that can be executed in the enclave using the trained model.

### 3. Verify Model Integrity

```move
let is_valid = verify_model_integrity(&model, &expected_hash);
```

Verify that a model's weights match the expected hash (ensures no tampering).

### 4. Get Model Statistics

```move
let (loss, accuracy, timestamp) = get_model_stats(&model);
```

Retrieve training metrics stored on-chain.

## Building and Running

### Build Enclave

```bash
# Build with ml-training-example feature
cd src/nautilus-server
cargo build --release --features ml-training-example
```

### Configure Enclave

```bash
# Update allowed endpoints and PCR values
cd /path/to/nautilus
sh configure_enclave.sh ml-training-example
```

### Test Training

```bash
# Start the enclave server
make run ENCLAVE_APP=ml-training-example

# In another terminal, test training
curl -X POST http://localhost:3000/process_data \
  -H 'Content-Type: application/json' \
  -d '{
    "payload": {
      "blob_id": "test_dataset_2024",
      "hidden_layer_size": 8,
      "learning_rate": 100,
      "epochs": 50
    }
  }'
```

### Deploy Move Contract

```bash
# Build Move contract
cd move/ml-training-example
sui move build

# Publish on-chain
sui client publish --gas-budget 500000000 --json
```

## Real-World Extensions

### 1. Data Integration

Replace synthetic data with real datasets:
- Fetch from Sui blob storage (SuiNS)
- Connect to IPFS via gateway
- Query AWS S3 (add to allowed_endpoints.yaml)

### 2. Advanced Models

Extend beyond 2-layer networks:
- Add batch normalization
- Implement CNNs for images
- Support transformers for NLP

### 3. Federated Learning

- Train multiple models on different datasets
- Aggregate weights on-chain
- Prove fairness through attestation

### 4. Confidential Inference

- Accept encrypted inputs
- Perform inference in enclave
- Return encrypted predictions
- Store prediction proof on-chain

### 5. Model Versioning

- Track model versions with merkle trees
- Enable A/B testing
- Audit model evolution on-chain

## Security Considerations

### Threats Mitigated

1. **Untrusted Training**: Enclave ensures training logic hasn't been modified (PCR validation)
2. **Model Theft**: Weights remain encrypted in enclave; only hash is public
3. **Data Privacy**: Training data never leaves the enclave
4. **Result Tampering**: Signature verification ensures results from actual enclave
5. **Replay Attacks**: Timestamp in signature prevents replay

### Trust Model

- **AWS Nitro Enclaves**: Provides hardware-isolated execution environment
- **Reproducible Builds**: Source code is public; binary matches PCR values
- **Sui Blockchain**: Immutable record of training events
- **Attestation**: AWS certificate chain validates enclave authenticity

## Testing

Run the included tests:

```bash
# Test serialization and encoding
cargo test --features ml-training-example test_serde

# Test neural network functionality
cargo test --features ml-training-example test_neural_network

# Test training convergence
cargo test --features ml-training-example test_training_convergence

# Test full training flow
cargo test --features ml-training-example test_ml_training
```

## References

- [Nautilus Framework](https://docs.sui.io/concepts/cryptography/nautilus)
- [AWS Nitro Enclaves](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html)
- [Sui Move Language](https://docs.sui.io/concepts/sui-move-concepts)
- [TEE Security](https://en.wikipedia.org/wiki/Trusted_execution_environment)

## Support

For issues or questions:
1. Check Nautilus examples in `src/apps/`
2. Review Move contract patterns in `move/enclave/`
3. Consult AWS Nitro Enclave documentation
4. Open an issue on GitHub

## License

Apache License 2.0 - See LICENSE file
