# Quick Fix: Events Not Being Caught

## What Was Fixed ✅

### 1. Wrong Package ID
**Problem:** config.ts had old package ID that didn't match deployed contract

**Fixed:** Updated to correct package ID from contractConstants.ts
```
0x4ed393ca28d4e62d864c49375d2981ab0d0d89f4b9ecc139c804fe008cea7d85
```

### 2. No Debug Output
**Problem:** Couldn't see if events were being polled

**Fixed:** Added comprehensive logging showing:
- Package ID and module being monitored
- Number of events found
- Event processing status

### 3. Old Cursors
**Problem:** Database might have old cursor skipping new events

**Fixed:** Added `npm run reset-cursors` command

## How to Use Right Now

### Step 1: Reset Event Cursors
```bash
cd relay-engine
npm run reset-cursors
```

### Step 2: Test Event Query (Optional)
```bash
npm run test-events
```

This shows if events exist on-chain.

### Step 3: Start Relay Engine
```bash
npm run dev
```

Watch for:
```
📡 Setting up event listeners...
   Package ID: 0x4ed393ca...
   Module: jobs
✅ Event listeners started

🔍 Polling for JobCreated events...
   Found X events
```

### Step 4: Create a Job

Use your frontend or CLI to create a test job.

### Step 5: Verify Detection

Within 5 seconds you should see:
```
🔍 Polling for JobCreated events...
   Found 1 events
✅ Processing 1 JobCreated events
Job Created: 123
🚀 Starting training pipeline for job 123
```

## Useful Commands

```bash
# Reset cursors (start from beginning)
npm run reset-cursors

# Test if events exist on-chain
npm run test-events

# Run relay engine
npm run dev

# View database
npm run prisma:studio
```

## Still Not Working?

1. **Verify package ID:**
   - Check `src/config.ts` line 7
   - Should match your deployed contract package ID
   - Compare with `src/lib/contractConstants.ts` line 8

2. **Check network:**
   - `src/config.ts` line 2
   - Should be 'testnet' (or your network)

3. **Verify job was created:**
   - Check Sui explorer
   - Look for JobCreated event in transaction

4. **Run test script:**
   ```bash
   npm run test-events
   ```
   If this shows 0 events, the package ID is wrong.

## Files Changed

- `src/config.ts` - Updated package ID and object IDs
- `src/listeners.ts` - Added debug logging and error handling
- `scripts/reset-cursors.ts` - New script to reset cursors
- `scripts/test-events.ts` - New script to test event queries
- `package.json` - Added new commands

---

**Status:** ✅ Ready to catch events!

**Try it:** `npm run reset-cursors && npm run dev`
