import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) throw new Error('Missing public Supabase configuration.');

const room = `tic-test-${Date.now()}`;
const first = createClient(url, key, { auth: { persistSession: false } });
const second = createClient(url, key, { auth: { persistSession: false } });
let firstChannel;
let secondChannel;

const waitForSubscription = (channel) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Realtime subscription timed out.')), 12_000);
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      clearTimeout(timer);
      resolve();
    } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
      clearTimeout(timer);
      reject(new Error(`Realtime subscription failed: ${status}`));
    }
  });
});

try {
  let resolveMove;
  const receivedMove = new Promise((resolve, reject) => {
    resolveMove = resolve;
    setTimeout(() => reject(new Error('Broadcast move was not received.')), 12_000);
  });

  firstChannel = first.channel(room, {
    config: { broadcast: { ack: true }, presence: { key: 'test-host' }, private: false }
  })
    .on('presence', { event: 'sync' }, () => {})
    .on('broadcast', { event: 'test-move' }, ({ payload }) => {
      if (payload?.index === 4) resolveMove();
    });

  secondChannel = second.channel(room, {
    config: { broadcast: { ack: true }, presence: { key: 'test-guest' }, private: false }
  }).on('presence', { event: 'sync' }, () => {});

  await Promise.all([waitForSubscription(firstChannel), waitForSubscription(secondChannel)]);
  await Promise.all([
    firstChannel.track({ clientId: 'test-host', role: 'X' }),
    secondChannel.track({ clientId: 'test-guest', role: 'O' })
  ]);
  await secondChannel.send({ type: 'broadcast', event: 'test-move', payload: { index: 4 } });
  await receivedMove;

  const presenceDeadline = Date.now() + 5_000;
  while (Date.now() < presenceDeadline) {
    const people = Object.values(firstChannel.presenceState()).flat();
    if (people.some((person) => person.role === 'X') && people.some((person) => person.role === 'O')) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const people = Object.values(firstChannel.presenceState()).flat();
  if (!people.some((person) => person.role === 'X') || !people.some((person) => person.role === 'O')) {
    throw new Error('Presence did not synchronize both players.');
  }

  console.log('Realtime room verified: two players, presence, and move broadcast.');
} finally {
  if (firstChannel) await first.removeChannel(firstChannel);
  if (secondChannel) await second.removeChannel(secondChannel);
  first.realtime.disconnect();
  second.realtime.disconnect();
}
