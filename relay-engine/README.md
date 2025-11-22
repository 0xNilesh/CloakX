# CloakX Relay Engine

The relay engine is a Node.js service that bridges the Sui blockchain with the Nautilus secure enclave for confidential ML training jobs.

## Overview

The relay engine:
1. **Listens** for `JobCreated` events on the Sui blockchain
2. **Fetches** pool data and contributor information
3. **Orchestrates** ML training by calling the Nautilus enclave
4. **Submits** results back to the blockchain

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│             │ Events  │              │  HTTP   │             │
│ Sui         ├────────►│ Relay        ├────────►│  Nautilus   │
│ Blockchain  │         │ Engine       │         │  Enclave    │
│             │◄────────┤              │◄────────┤             │
└─────────────┘ Results └──────────────┘ Response└─────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Sui testnet access
- Nautilus enclave endpoint

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your values
nano .env

# Setup database
npm run prisma:generate
npm run prisma:migrate

# Start the relay engine
npm run dev
```

### Environment Variables

Required variables in `.env`:

```env
# Sui admin private key (base64 encoded)
ADMIN_PRIVATE_KEY=your_base64_key

# Nautilus enclave URL
NAUTILUS_URL=http://localhost:3000

# Database (SQLite for dev, PostgreSQL for prod)
DATABASE_URL="file:./dev.db"
```

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run with ts-node (single run) |
| `npm run watch` | Run with auto-reload on changes |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled production build |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Create/apply database migrations |
| `npm run prisma:studio` | Open visual database editor |

### Project Structure

```
relay-engine/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config.ts                # Configuration constants
│   ├── db.ts                    # Prisma client
│   ├── types.ts                 # TypeScript types
│   ├── listeners.ts             # Event polling system
│   ├── sui-utils.ts             # Sui client utilities
│   ├── handlers/
│   │   └── job-created-handler.ts   # JobCreated event handler
│   ├── pipeline/
│   │   └── training.pipeline.ts     # ML training orchestration
│   ├── nautilus/
│   │   └── nautilus-client.ts       # Nautilus HTTP client
│   ├── sui/
│   │   ├── sui-client.ts            # Sui transaction signing
│   │   └── complete-job.ts          # Submit job results
│   └── lib/
│       ├── jobQueries.ts            # Query jobs from chain
│       ├── poolQueries.ts           # Query pools from chain
│       ├── userQueries.ts           # Query user/contributor data
│       ├── contractConstants.ts     # Contract addresses & IDs
│       └── suiContract.ts           # Sui client instance
├── prisma/
│   └── schema.prisma            # Database schema
├── package.json
├── tsconfig.json
└── .env
```

## How It Works

### 1. Event Listening

The relay engine polls the Sui blockchain every 5 seconds for new `JobCreated` events:

```typescript
// From listeners.ts
const POLLING_INTERVAL_MS = 5_000;
```

Events are tracked using cursors stored in the database to avoid reprocessing.

### 2. Job Processing Pipeline

When a job is created:

```typescript
// From training.pipeline.ts
1. Update job status to IN_PROGRESS
2. Fetch pool contributors from blockchain
3. Fetch data blob IDs from pool_data table
4. Validate data availability
5. Call Nautilus enclave with training request
6. Wait for encrypted training results
7. Submit results to blockchain (complete_job)
8. Update job status to COMPLETED
```

### 3. Nautilus Integration

The relay engine sends training requests to Nautilus:

```typescript
{
  data_blob_ids: ["blob1", "blob2"],      // Walrus blob IDs
  model_config_blob_id: "config_blob",    // Model configuration
  key_id: "0x123...",                     // Buyer address
  learning_rate: 1000,                    // Training params
  epochs: 10
}
```

Nautilus returns:
```typescript
{
  response: {
    payload: {
      model_blob_id: "result_blob",       // Trained model
      accuracy: 95,
      final_loss: 0.05,
      num_samples: 1000,
      model_hash: [...]                   // Verification hash
    },
    timestamp_ms: 1234567890
  },
  signature: "0xabc..."                   // Enclave signature
}
```

### 4. On-Chain Completion

Results are submitted back to Sui using the `complete_job` function with:
- BCS-encoded training results
- Enclave signature for verification
- Job ID and timestamp

## Database Schema

### Job Table
| Field | Type | Description |
|-------|------|-------------|
| id | BigInt | Auto-increment ID |
| creator | String | Sui address of job creator |
| poolId | BigInt | Pool ID used for training |
| price | BigInt | Job price in MIST |
| buyerPublicKey | String | Buyer's public key |
| status | Enum | PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED |
| epochs | BigInt | Training epochs |
| learningRate | BigInt | Learning rate parameter |
| modelConfigBlobId | String? | Optional model config blob |
| createdAt | DateTime | Job creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Cursor Table
Tracks event processing positions to avoid reprocessing events.

## Error Handling

The pipeline includes comprehensive error handling:

- **Network errors**: Retries with exponential backoff
- **Missing data**: Job marked as FAILED with descriptive error
- **Enclave failures**: Error logged, job status updated
- **Blockchain errors**: Transaction failures caught and logged

All errors are logged with context and job status is properly updated.

## Monitoring

Check relay engine health:

```bash
# View logs
npm run dev

# Check database
npm run prisma:studio
```

Key indicators:
- ✅ "CloakX Relay Engine Started" - Service running
- ✅ "Job Created: {id}" - Events detected
- ✅ "Job {id} completed successfully" - Pipeline working
- ❌ "Error in training pipeline" - Check logs

## Production Deployment

### Using PostgreSQL

1. Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Update `.env`:
```env
DATABASE_URL="postgresql://user:pass@host:5432/cloakx"
```

3. Run migrations:
```bash
npm run prisma:migrate
```

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment Setup

For production, ensure:
- ✅ Valid `ADMIN_PRIVATE_KEY` with sufficient balance
- ✅ Correct `NAUTILUS_URL` pointing to production enclave
- ✅ Database connection is stable and backed up
- ✅ Monitoring and alerting configured

## Troubleshooting

### Common Issues

**Problem**: Prisma client not initialized
```bash
Solution: Run npm run prisma:generate
```

**Problem**: Events not being caught
```bash
Solution:
1. Verify package ID in config.ts matches deployed contract
2. Reset cursors: npm run reset-cursors
3. Test events exist: npm run test-events
```

**Problem**: Job stuck in PENDING
```bash
Solution: Check if relay engine is running and monitoring logs
```

**Problem**: "Model config blob ID not set"
```bash
Solution: Ensure job was created with model_wid parameter
```

**Problem**: "No data blobs found for pool"
```bash
Solution: Users need to register data using register_user_data
```

**Problem**: Nautilus connection refused
```bash
Solution: Verify NAUTILUS_URL and enclave is running
```

**Problem**: Transaction failures
```bash
Solution: Check admin account has sufficient SUI balance
```

### Utility Commands

```bash
# Reset event cursors (start from beginning)
npm run reset-cursors

# Test if events exist on blockchain
npm run test-events

# View database
npm run prisma:studio
```

## Contributing

When making changes:
1. Update TypeScript types in `src/types.ts`
2. Run `npm run build` to check for errors
3. Test with `npm run dev`
4. Update this README if adding features

## License

ISC

## Support

For issues and questions, see the main CloakX repository.
