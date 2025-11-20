# ML Training with Walrus - Quick Start

**TL;DR:** Train ML models in AWS Nitro Enclave using Walrus blob data with on-chain attestation.

---

## 1. Prepare Data (5 min)

```bash
# Create training data CSV (4 features + label)
cat > training_data.csv << 'EOF'
0.1,0.2,0.3,0.4,0
0.5,0.6,0.7,0.8,1
0.2,0.3,0.4,0.5,0
0.7,0.8,0.9,1.0,1
EOF

# Upload to Walrus
walrus blob store training_data.csv --network testnet
# Output: Blob ID: a7e4d8c9f2b3a1c5d6e7f8a9b0c1d2e3f4
```

---

## 2. AWS Credentials (Choose One)

### Option 1: IAM Role (Recommended - No Keys in Enclave)
```bash
# AWS creates role with EC2 permissions
# No manual credential setup needed!
aws ec2 run-instances --iam-instance-profile Name=NitroEnclaveRole ...
```

### Option 2: Environment Variables (Testing Only)
```bash
# In src/nautilus-server/.env
WALRUS_AGGREGATOR=https://aggregator-testnet.walrus.space
API_KEY=test_key
```

### Option 3: AWS Secrets Manager (Production)
```bash
aws secretsmanager create-secret --name ml-training/config \
  --secret-string '{"walrus_aggregator":"https://aggregator-mainnet.walrus.space"}'
```

---

## 3. Build & Run (10 min)

```bash
# Configure
sh configure_enclave.sh ml-training-example

# Build
make ENCLAVE_APP=ml-training-example

# Run locally for testing
cd src/nautilus-server
export WALRUS_AGGREGATOR=https://aggregator-testnet.walrus.space
cargo run --features ml-training-example

# Or run on EC2 with Nitro
sudo nitro-cli run-enclave --cpu-count 2 --memory 512M --eif-path out/nitro.eif
```

---

## 4. Train (Send Request)

```bash
curl -X POST http://localhost:3000/process_data \
  -H 'Content-Type: application/json' \
  -d '{
    "payload": {
      "blob_id": "a7e4d8c9f2b3a1c5d6e7f8a9b0c1d2e3f4",
      "hidden_layer_size": 16,
      "learning_rate": 100,
      "epochs": 100
    }
  }'
```

---

## 5. Verify On-Chain

```bash
# Publish contract
cd move/ml-training-example
sui move build
sui client publish --gas-budget 500000000

# Register model
sui client call --package <PKG_ID> --module ml_training \
  --function register_trained_model --args <blob_id> <loss> <accuracy> <hash> <timestamp> <signature>
```

---

## Key Points

| What | Where | Why |
|------|-------|-----|
| **Blob ID** | Walrus storage | Training data location |
| **AWS Credentials** | IAM Role (not in code) | Enclave security |
| **WALRUS_AGGREGATOR** | `.env` or EC2 user-data | Blob fetch endpoint |
| **Enclave PCR** | Move contract | Verify authentic enclave |
| **Model Hash** | On-chain NFT | Proof of training |

---

## What Happens

```
Request with Blob ID
    ↓
Enclave fetches from Walrus
    ↓
Trains 2-layer neural network
    ↓
Signs result with ephemeral key
    ↓
On-chain verification
    ↓
TrainedModel NFT minted
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Failed to fetch Walrus blob` | Check blob ID and aggregator URL |
| `CSV must have 5 columns` | Format: feature1,feature2,feature3,feature4,label |
| `Enclave can't reach Walrus` | Allow HTTPS (port 443) in EC2 security group |
| `Signature verification fails` | Update contract PCR values from enclave |

---

## Files Reference

```
src/nautilus-server/src/apps/ml-training-example/
├── mod.rs                    # Enclave logic (Walrus fetch + training)
├── allowed_endpoints.yaml    # Walrus aggregator domains
├── README.md                 # Full documentation
├── SETUP.md                  # Detailed setup guide
└── QUICK_START.md            # This file

move/ml-training-example/
├── Move.toml
└── sources/ml_training.move  # On-chain verification
```

---

## Next Steps

1. Read `SETUP.md` for complete AWS setup
2. Read `README.md` for architecture details
3. Check `mod.rs` for code details
4. Run tests: `cargo test --features ml-training-example`

---

## Resources

- Walrus API: https://docs.wal.app/usage/web-api.html
- AWS Nitro: https://docs.aws.amazon.com/enclaves/
- Nautilus: https://docs.sui.io/concepts/cryptography/nautilus
