// Test script to manually query events from the blockchain
import 'dotenv/config';
import { SuiClient } from '@mysten/sui/client';
import { CONFIG } from '../src/config';

async function testEvents() {
  console.log('🔍 Testing event query...\n');
  console.log('Configuration:');
  console.log(`  Network: ${CONFIG.NETWORK}`);
  console.log(`  Package ID: ${CONFIG.CLOAKX.packageId}`);
  console.log(`  Module: ${CONFIG.CLOAKX.module}\n`);

  const client = new SuiClient({
    url: CONFIG.NETWORK === 'mainnet'
      ? 'https://fullnode.mainnet.sui.io'
      : 'https://fullnode.testnet.sui.io',
  });

  console.log('📡 Querying events...\n');

  try {
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

    console.log(`✅ Found ${result.data.length} events (showing last 10):\n`);

    if (result.data.length === 0) {
      console.log('⚠️  No events found. This could mean:');
      console.log('   1. No jobs have been created yet');
      console.log('   2. Package ID or module name is incorrect');
      console.log('   3. Wrong network (check CONFIG.NETWORK)');
      return;
    }

    result.data.forEach((event, i) => {
      console.log(`${i + 1}. Event Type: ${event.type}`);
      console.log(`   Transaction: ${event.id.txDigest}`);
      console.log(`   Event Seq: ${event.id.eventSeq}`);
      console.log(`   Timestamp: ${event.timestampMs ? new Date(parseInt(event.timestampMs)).toISOString() : 'N/A'}`);
      console.log(`   Data:`, JSON.stringify(event.parsedJson, null, 2));
      console.log('');
    });

    console.log('\n✅ Event query successful!');
    console.log('   If you see JobCreated events above, the relay engine should detect them.');
    console.log('   If not, check the package ID and module name in config.ts');

  } catch (error: any) {
    console.error('❌ Error querying events:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  - Check network connection');
    console.error('  - Verify package ID is correct');
    console.error('  - Ensure module name matches contract');
  }
}

testEvents()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
