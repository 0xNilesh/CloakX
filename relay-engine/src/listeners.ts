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
  const { data, hasNextPage, nextCursor } = await client.queryEvents({
    query: tracker.filter,
    cursor,
    order: 'ascending',
  });

  if (data.length > 0) {
    await tracker.callback(data);
  }

  if (nextCursor && data.length > 0) {
    await saveLatestCursor(tracker, nextCursor);
  }

  return { cursor: nextCursor, hasNextPage };
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

  for (const event of EVENTS_TO_TRACK) {
    runEventJob(client, event, await getLatestCursor(event));
  }
};
