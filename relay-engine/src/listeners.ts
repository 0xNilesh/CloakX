import { EventId, SuiClient, SuiEvent, SuiEventFilter } from '@mysten/sui/client';
import { CONFIG } from './config';
import { prisma } from './db';
import { getClient } from './sui-utils';
import { handleJobCreated } from './handlers/job-created-handler';

type SuiEventsCursor = EventId | null | undefined;

type EventTracker = {
  type: string;
  filter: SuiEventFilter;
  callback: (events: SuiEvent[]) => any;
};

const EVENTS_TO_TRACK: EventTracker[] = [
  {
    type: 'JobCreated',
    filter: {
      MoveEventModule: {
        package: CONFIG.CLOAKX.packageId,
        module: CONFIG.CLOAKX.module,
      },
    },
    callback: handleJobCreated,
  },
];

const executeEventJob = async (
  client: SuiClient,
  tracker: EventTracker,
  cursor: SuiEventsCursor,
) => {
  try {
    console.log(`🔍 Polling for ${tracker.type} events...`);

    // Safe access to MoveEventModule
    const filterAny = tracker.filter as any;
    if (filterAny.MoveEventModule) {
      console.log(`   Package: ${filterAny.MoveEventModule.package}`);
      console.log(`   Module: ${filterAny.MoveEventModule.module}`);
    }
    console.log(`   Cursor: ${cursor ? JSON.stringify(cursor) : 'null'}`);

    const { data, hasNextPage, nextCursor } = await client.queryEvents({
      query: tracker.filter,
      cursor,
      order: 'ascending',
    });

    console.log(`   Found ${data.length} events`);

    if (data.length > 0) {
      console.log(`✅ Processing ${data.length} ${tracker.type} events`);
      await tracker.callback(data);
    }

    if (nextCursor && data.length > 0) {
      await saveLatestCursor(tracker, nextCursor);
    }

    return { cursor: nextCursor, hasNextPage };
  } catch (error: any) {
    console.error(`❌ Error polling ${tracker.type}:`, error.message);
    return { cursor, hasNextPage: false };
  }
};

const runEventJob = async (
  client: SuiClient,
  tracker: EventTracker,
  cursor: SuiEventsCursor,
) => {
  const result = await executeEventJob(client, tracker, cursor);

  setTimeout(
    () => runEventJob(client, tracker, result.cursor),
    result.hasNextPage ? 0 : CONFIG.POLLING_INTERVAL_MS,
  );
};

const getLatestCursor = async (tracker: EventTracker) => {
  return prisma.cursor.findUnique({
    where: { id: tracker.type },
  });
};

const saveLatestCursor = async (tracker: EventTracker, cursor: EventId) => {
  return prisma.cursor.upsert({
    where: { id: tracker.type },
    update: cursor,
    create: { id: tracker.type, ...cursor },
  });
};

export const setupListeners = async () => {
  const client = getClient(CONFIG.NETWORK);

  console.log('\n📡 Setting up event listeners...');
  console.log(`   Network: ${CONFIG.NETWORK}`);
  console.log(`   Polling Interval: ${CONFIG.POLLING_INTERVAL_MS}ms`);
  console.log(`   Package ID: ${CONFIG.CLOAKX.packageId}`);
  console.log(`   Module: ${CONFIG.CLOAKX.module}`);
  console.log(`   Events to track: ${EVENTS_TO_TRACK.map(e => e.type).join(', ')}\n`);

  for (const event of EVENTS_TO_TRACK) {
    const cursor = await getLatestCursor(event);
    if (cursor) {
      console.log(`   Resuming ${event.type} from cursor: ${JSON.stringify(cursor)}`);
    } else {
      console.log(`   Starting ${event.type} from beginning`);
    }
    runEventJob(client, event, cursor);
  }

  console.log('✅ Event listeners started\n');
};
