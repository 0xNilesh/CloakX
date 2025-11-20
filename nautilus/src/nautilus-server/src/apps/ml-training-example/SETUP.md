# ML Training with Walrus Blobs - Complete Setup Guide

This guide shows how to:
1. Upload training data to Walrus blob storage
2. Deploy the ML training enclave on AWS EC2
3. Configure AWS credentials
4. Run training on Walrus blob data

## Prerequisites

- AWS Account with Nitro Enclave support (use instances from the `c5`, `m5`, `r5`, `t3`, `t4g`, `u-` families or newer)
- Walrus setup (public aggregator available, no auth needed for read)
- Sui CLI installed
- Rust toolchain 1.80+
- Docker installed

## Step 1: Upload Training Data to Walrus

### Create CSV Training Data

Create a CSV file with training samples (4 features + 1 label):

**training_data.csv:**
```csv
# Sample training data - 4 features + binary label
0.1,0.2,0.3,0.4,0
0.5,0.6,0.7,0.8,1
0.2,0.3,0.4,0.5,0
0.7,0.8,0.9,1.0,1
0.15,0.25,0.35,0.45,0
0.55,0.65,0.75,0.85,1
0.12,0.22,0.32,0.42,0
0.52,0.62,0.72,0.82,1
0.18,0.28,0.38,0.48,0
0.58,0.68,0.78,0.88,1
```

### Upload to Walrus

Using Walrus CLI:

```bash
# Install walrus-cli
cargo install walrus-cli

# Upload blob (no authentication needed for testnet)
walrus blob store training_data.csv --network testnet

# Output:
# Blob ID: a7e4d8c9f2b3a1c5d6e7f8a9b0c1d2e3f4
```

**Save this Blob ID!** You'll need it for requests.

### Alternative: Use Public Walrus Aggregator API

```bash
# Check blob availability
curl https://aggregator-testnet.walrus.space/v1/blobs/a7e4d8c9f2b3a1c5d6e7f8a9b0c1d2e3f4
```

---

## Step 2: AWS Setup - Where to Put Credentials

### Option A: EC2 Instance Role (Recommended)

**Best practice - no credentials needed in enclave:**

1. Create IAM Role with Nitro Enclave permissions:

```bash
# Create role policy document
cat > nitro-role-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeNitroEnclaveImageState"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name NitroEnclaveRole \
  --assume-role-policy-document file://assume-role-policy.json
```

2. Launch EC2 instance with this role:

```bash
aws ec2 run-instances \
  --image-id ami-0123456789abcdef0 \
  --instance-type m5.large \
  --iam-instance-profile Name=NitroEnclaveRole \
  --enclave-options 'Description=ML-Training,SupportsIPv6=false'
```

### Option B: Environment Variables (For Local Testing)

Create `.env` file in `src/nautilus-server/`:

```bash
# src/nautilus-server/.env
API_KEY=dummy_key_for_testing
WALRUS_AGGREGATOR=https://aggregator-testnet.walrus.space
```

**DO NOT commit this file!** Add to `.gitignore`:

```bash
echo ".env" >> .gitignore
```

### Option C: AWS Secrets Manager (Production)

Store secrets in AWS Secrets Manager:

```bash
# Create secret
aws secretsmanager create-secret \
  --name ml-training/config \
  --secret-string '{
    "walrus_aggregator": "https://aggregator-mainnet.walrus.space"
  }'

# Retrieve in enclave code
let secret = aws_secretsmanager::get_secret("ml-training/config");
```

---

## Step 3: Configure and Build Enclave

### Clone Repository

```bash
git clone https://github.com/MystenLabs/nautilus.git
cd nautilus
```

### Configure Enclave

```bash
# This script updates PCR values and configures endpoints
sh configure_enclave.sh ml-training-example

# Answer prompts:
# - Do you want to use a secret? → n (for this demo)
# - Enclave app: ml-training-example
```

This generates:
- `src/nautilus-server/src/apps/ml-training-example/allowed_endpoints.yaml` (updated with Walrus domains)
- PCR measurements for attestation

### Build Enclave Image File (EIF)

```bash
# Set the enclave app
export ENCLAVE_APP=ml-training-example

# Build Docker image and EIF
make

# Output: out/nitro.eif
```

---

## Step 4: Deploy and Run Enclave

### On AWS EC2 with Nitro Enclave Support

```bash
# Copy EIF to EC2 instance
scp out/nitro.eif ec2-user@<EC2_IP>:/home/ec2-user/

# SSH into EC2
ssh ec2-user@<EC2_IP>

# Load enclave image
sudo nitro-cli build-enclave --docker-uri nautilus-server:latest \
  --output-file /home/ec2-user/nitro.eif

# Start enclave
sudo nitro-cli run-enclave \
  --cpu-count 2 \
  --memory 512M \
  --eif-path /home/ec2-user/nitro.eif \
  --enclave-cid 42

# Output:
# Enclave started successfully
# Enclave CID: 42
# Memory: 512 MiB
# CPU IDs: 1-2
```

### Expose Enclave Port (from parent EC2)

```bash
# In EC2 instance, run vsock-proxy to expose port 3000
socat -T15 TCP-LISTEN:3000,reuseaddr,fork VSOCK-CONNECT:42:3000 &

# Or use the expose script
sh expose_enclave.sh
```

### Verify Enclave is Running

```bash
# Health check
curl http://localhost:3000/health_check

# Get attestation
curl http://localhost:3000/get_attestation
```

---

## Step 5: Train on Walrus Data

### Create Training Request

```bash
# Store your Walrus blob ID
BLOB_ID="a7e4d8c9f2b3a1c5d6e7f8a9b0c1d2e3f4"

# Create request
curl -X POST http://localhost:3000/process_data \
  -H 'Content-Type: application/json' \
  -d "{
    \"payload\": {
      \"blob_id\": \"$BLOB_ID\",
      \"hidden_layer_size\": 16,
      \"learning_rate\": 100,
      \"epochs\": 100
    }
  }"
```

### Response Format

```json
{
  "response": {
    "data": {
      "blob_id": "a7e4d8c9f2b3a1c5d6e7f8a9b0c1d2e3f4",
      "final_loss": 2354,
      "accuracy": 90,
      "model_hash": "0xabcd..."
    },
    "intent_message": {
      "data": { ... },
      "timestamp": 1704067200000
    },
    "signature": "0x..."
  }
}
```

---

## Step 6: Register Model On-Chain

### Publish Move Contract

```bash
cd move/ml-training-example

# Build contract
sui move build

# Publish to Sui
sui client publish --gas-budget 500000000 \
  --json > publish.json

# Save package ID
PACKAGE_ID=$(cat publish.json | jq '.result.packageId' -r)
echo "Package ID: $PACKAGE_ID"
```

### Register Training Result

```bash
# Create a Move transaction to register the model
sui client call \
  --package $PACKAGE_ID \
  --module ml_training \
  --function register_trained_model \
  --args \
    '"a7e4d8c9f2b3a1c5d6e7f8a9b0c1d2e3f4"' \
    '2354' \
    '90' \
    '0xabcd...' \
    '1704067200000' \
    '0x<signature>' \
    '@enclave' \
  --gas-budget 200000000
```

---

## Environment Variables Summary

| Variable | Purpose | Where to Set | Example |
|----------|---------|--------------|---------|
| `WALRUS_AGGREGATOR` | Walrus blob aggregator URL | `.env` or EC2 user data | `https://aggregator-testnet.walrus.space` |
| `API_KEY` | Generic API key (unused in ML app) | `.env` or Secrets Manager | `dummy_key` |
| `AWS_REGION` | AWS region | EC2 environment | `us-east-1` |
| `RUST_LOG` | Logging level | EC2 user data | `info,nautilus_server=debug` |

### Setting Environment Variables on EC2

Create `user-data.sh` for EC2 launch:

```bash
#!/bin/bash
export WALRUS_AGGREGATOR=https://aggregator-mainnet.walrus.space
export RUST_LOG=info
export API_KEY=default_key

# Start enclave with environment
cd /home/ec2-user/nautilus
make run ENCLAVE_APP=ml-training-example
```

Pass to EC2:

```bash
aws ec2 run-instances \
  --image-id ami-0123456789abcdef0 \
  --user-data file://user-data.sh \
  ...
```

---

## Testing Locally (Before EC2)

### Run Enclave Server Locally

```bash
cd src/nautilus-server

# Set environment
export WALRUS_AGGREGATOR=https://aggregator-testnet.walrus.space
export API_KEY=test_key
export RUST_LOG=debug

# Run with feature
cargo run --features ml-training-example
```

### Test Training Locally

```bash
# Upload test data to Walrus testnet
walrus blob store training_data.csv --network testnet

# Get blob ID
BLOB_ID=$(walrus blob show <blob-id> --network testnet | grep "Blob ID")

# Send training request
curl -X POST http://localhost:3000/process_data \
  -H 'Content-Type: application/json' \
  -d "{
    \"payload\": {
      \"blob_id\": \"$BLOB_ID\",
      \"hidden_layer_size\": 8,
      \"learning_rate\": 100,
      \"epochs\": 50
    }
  }"
```

---

## Troubleshooting

### Enclave Can't Access Walrus

**Problem**: `Failed to fetch Walrus blob`

**Solution**:
1. Verify `allowed_endpoints.yaml` includes aggregator domain
2. Check EC2 security group allows outbound HTTPS (port 443)
3. Verify blob ID is correct
4. Test with curl from EC2 parent instance

```bash
# From EC2 instance
curl https://aggregator-testnet.walrus.space/v1/blobs/BLOB_ID
```

### Invalid CSV Format

**Problem**: `CSV must have at least 5 columns`

**Solution**: Ensure CSV has exactly 5 columns:
- Columns 1-4: Features (floats)
- Column 5: Label (0 or 1)

```bash
# Validate CSV
head training_data.csv | awk -F',' '{print NF}'  # Should print 5
```

### Signature Verification Fails

**Problem**: `EInvalidSignature` on-chain

**Solution**:
1. Ensure enclave PCR values match contract configuration
2. Verify timestamp in response
3. Check signature format matches Move contract

---

## Complete Workflow Summary

```
1. Create training data (CSV)
   ↓
2. Upload to Walrus blob storage (get blob_id)
   ↓
3. Configure AWS EC2 instance
   ↓
4. Build Nautilus ML training enclave
   ↓
5. Deploy enclave on EC2 with Nitro
   ↓
6. Send training request with blob_id
   ↓
7. Enclave fetches from Walrus, trains model
   ↓
8. Sign results and return response
   ↓
9. Verify signature on-chain
   ↓
10. Register TrainedModel NFT on Sui
```

---

## Security Notes

- **No credentials needed for Walrus reads** - Walrus blob API is public
- **AWS credentials only for EC2** - Use IAM roles, not hardcoded keys
- **Enclave runs in TEE** - Model weights never leave hardware security perimeter
- **Attestation proves authenticity** - PCR values ensure unmodified binary
- **On-chain verification** - Signature prevents tampering

---

## References

- [Walrus Documentation](https://docs.wal.app/)
- [AWS Nitro Enclaves](https://docs.aws.amazon.com/enclaves/)
- [Nautilus Framework](https://docs.sui.io/concepts/cryptography/nautilus)
- [Sui Move](https://docs.sui.io/concepts/sui-move-concepts)
