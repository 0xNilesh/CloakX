# Relay Engine Troubleshooting Guide

## Problem: Events Not Being Caught

### Issue Fixed ✅
The relay engine wasn't catching JobCreated events due to:
1. **Package ID mismatch** - config.ts had old package ID
2. **Missing debug logging** - Hard to see what was happening
3. **Cursor issues** - Old cursors might skip new events

### Solution Applied

#### 1. Updated Package IDs
**File:** `src/config.ts`

Changed from old package ID to match `contractConstants.ts`:
```typescript
packageId: '0x4ed393ca28d4e62d864c49375d2981ab0d0d89f4b9ecc139c804fe008cea7d85'
```

Also updated:
- POOL_REGISTRY
- JOB_REGISTRY
- ADMIN_CAP
- UPGRADE_CAP

#### 2. Added Debug Logging
**File:** `src/listeners.ts`

Now shows:
- Network and polling interval
- Package ID and module being monitored
- Number of events found in each poll
- Cursor position
- Event processing status

Example output:
```
📡 Setting up event listeners...
   Network: testnet
   Polling Interval: 5000ms
   Package ID: 0x4ed393ca...
   Module: jobs
   Events to track: JobCreated

🔍 Polling for JobCreated events...
   Package: 0x4ed393ca...
   Module: jobs
   Cursor: null
   Found 0 events
```

#### 3. Added Cursor Reset Tool
**Command:** `npm run reset-cursors`

Deletes all stored cursors so the relay engine starts from the beginning.

## How to Verify It's Working

### Step 1: Reset Cursors (if needed)
```bash
cd relay-engine
npm run reset-cursors
```

### Step 2: Start Relay Engine
```bash
npm run dev
```

You should see:
```
🚀 CloakX Relay Engine Started

📡 Setting up event listeners...
   Network: testnet
   Polling Interval: 5000ms
   Package ID: 0x4ed393ca28d4e62d864c49375d2981ab0d0d89f4b9ecc139c804fe008cea7d85
   Module: jobs
   Events to track: JobCreated

   Starting JobCreated from beginning
✅ Event listeners started
```

### Step 3: Create a Test Job On-Chain

Create a job using your frontend or CLI.

### Step 4: Watch for Detection

Within 5 seconds, you should see:
```
🔍 Polling for JobCreated events...
   Package: 0x4ed393ca...
   Module: jobs
   Cursor: null
   Found 1 events
✅ Processing 1 JobCreated events
Job Created: 123
🚀 Starting training pipeline for job 123
```

## Common Issues & Solutions

### Issue: "Found 0 events" every time

**Cause:** Package ID doesn't match deployed contract

**Solution:**
1. Check what package ID your job was created with
2. Update `src/config.ts` with correct package ID
3. Restart relay engine

**How to find correct package ID:**
- Look at the transaction that created the job
- Check the event emitter package
- Or look in your deployment logs

### Issue: Events found but not processing

**Cause:** Event structure mismatch

**Solution:**
1. Check the `JobCreatedEvent` type in `src/types.ts`
2. Compare with actual event structure on-chain
3. Update the type definition if needed

### Issue: Old events being skipped

**Cause:** Cursor is stored from previous run

**Solution:**
```bash
npm run reset-cursors
```

This will make the relay engine process all events from the beginning.

### Issue: Database errors

**Cause:** Prisma schema out of sync

**Solution:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Issue: TypeScript errors on startup

**Cause:** Dependencies or types need rebuilding

**Solution:**
```bash
rm -rf node_modules
npm install
npm run prisma:generate
```

## Debugging Checklist

When events aren't being caught:

- [ ] Relay engine is running (`npm run dev`)
- [ ] Package ID in config.ts matches your contract
- [ ] Network is set to correct network (testnet/mainnet)
- [ ] Job Registry ID is correct
- [ ] Events are actually being emitted (check explorer)
- [ ] No errors in relay engine logs
- [ ] Cursor isn't blocking new events (try reset)

## Manual Event Query

Test if events exist with this script:

```typescript
// test-events.ts
import 'dotenv/config';
import { SuiClient } from '@mysten/sui/client';
import { CONFIG } from './src/config';

async function testEvents() {
  const client = new SuiClient({
    url: 'https://fullnode.testnet.sui.io',
  });

  const result = await client.queryEvents({
    query: {
      MoveEventModule: {
        package: CONFIG.CLOAKX.packageId,
        module: CONFIG.CLOAKX.module,
      },
    },
    order: 'descending',
    limit: 10,
  });

  console.log(`Found ${result.data.length} events:`);
  result.data.forEach((event, i) => {
    console.log(`\n${i + 1}. ${event.type}`);
    console.log(`   Transaction: ${event.id.txDigest}`);
    console.log(`   Data:`, event.parsedJson);
  });
}

testEvents();
```

Run with:
```bash
ts-node test-events.ts
```

## Expected Behavior

### Normal Operation
```
🔍 Polling for JobCreated events...
   Found 0 events
[wait 5 seconds]
🔍 Polling for JobCreated events...
   Found 0 events
[wait 5 seconds]
🔍 Polling for JobCreated events...
   Found 1 events
✅ Processing 1 JobCreated events
Job Created: 123
```

### When Job is Processed
```
🚀 Starting training pipeline for job 123
Found 3 contributors for pool 1
Retrieved 3 data blob IDs
📤 Sending training request to Nautilus enclave
✅ Training completed, submitting results to blockchain
✅ Job Completed Onchain!
Digest: 0xabc...
Status: success
✅ Job 123 completed successfully
```

## Still Having Issues?

1. **Check logs** - Look for error messages
2. **Verify contract addresses** - All IDs in config.ts must be correct
3. **Test manually** - Use the test-events.ts script above
4. **Check Sui Explorer** - Verify events are being emitted
5. **Reset everything**:
   ```bash
   npm run reset-cursors
   rm dev.db
   npm run prisma:migrate
   npm run dev
   ```

## Recent Changes Summary

| File | Change | Why |
|------|--------|-----|
| `config.ts` | Updated package ID and object IDs | Was using old deployment addresses |
| `listeners.ts` | Added debug logging | To see what's being polled |
| `listeners.ts` | Added error handling | Prevent crashes on network errors |
| `listeners.ts` | Added startup info | Show configuration on start |
| `scripts/reset-cursors.ts` | New file | Allow resetting event cursors |

---

**Last Updated:** 2025-11-21
**Status:** Events now being detected ✅
