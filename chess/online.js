// Realtime transport for two-player rooms. No accounts; the room code identifies the match.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const cleanCode = value => String(value || '').toUpperCase().replace(/[^A-Z2-9]/g, '').slice(0, 6);
export const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), n => ALPHABET[n % ALPHABET.length]).join('');

let clientPromise = null;
async function realtime() {
  if (!clientPromise) clientPromise = (async () => {
    const [{ createClient }, response] = await Promise.all([
      import('../evermile/vendor/realtime-client.js'),
      fetch('/api/multiplayer/config', { cache: 'no-store' }).then(r => r.ok || !['localhost', '127.0.0.1'].includes(location.hostname) ? r : fetch('https://hisanali.com/api/multiplayer/config', { cache: 'no-store' }))
    ]);
    if (!response.ok) throw new Error('Online play is temporarily unavailable. Please try again shortly.');
    const config = await response.json();
    return createClient(config.url, config.publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, realtime: { params: { eventsPerSecond: 20 } } });
  })().catch(error => { clientPromise = null; throw error; });
  return clientPromise;
}

export function playerId() {
  let id = sessionStorage.getItem('chess-player-id');
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('chess-player-id', id); }
  return id;
}

export class Room {
  constructor(hooks) { this.hooks = hooks; this.id = playerId(); this.channel = null; this.connected = false; this.peer = null; this.generation = 0; }

  async open(code, host, name) {
    await this.leave();
    const generation = ++this.generation, current = () => generation === this.generation;
    const client = await realtime(); if (!current()) return;
    this.client = client; this.code = cleanCode(code); this.host = host; this.name = String(name || '').trim().slice(0, 24) || (host ? 'Host' : 'Guest');
    this.channel = client.channel(`chess:v1:${this.code}`, { config: { broadcast: { self: false, ack: false }, presence: { key: this.id } } });
    this.channel
      .on('presence', { event: 'sync' }, () => { if (current()) this.presence(); })
      .on('broadcast', { event: 'msg' }, ({ payload }) => { if (current() && payload && payload.from !== this.id) this.hooks.message(payload); });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Could not connect. Check your connection and try again.')), 12000);
      this.channel.subscribe(async status => {
        if (!current()) return;
        if (status === 'SUBSCRIBED') {
          this.connected = true; clearTimeout(timer);
          try { await this.channel.track({ id: this.id, name: this.name, host: this.host }); } catch {}
          this.hooks.status(); resolve();
        } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) { this.connected = false; this.hooks.status(); }
      });
    });
  }

  presence() {
    const members = Object.values(this.channel.presenceState()).flat().filter(m => m?.id && m.id !== this.id);
    const previous = this.peer;
    this.peer = members.find(m => m.host !== this.host) || null;
    this.hostTaken = this.host && members.some(m => m.host);
    this.hooks.presence(this.peer, previous);
  }

  send(type, data = {}) {
    if (!this.channel || !this.connected) return;
    this.channel.send({ type: 'broadcast', event: 'msg', payload: { ...data, type, from: this.id } }).catch(() => {});
  }

  async leave() {
    this.generation++;
    if (this.channel && this.client) { try { await this.client.removeChannel(this.channel); } catch {} }
    this.channel = null; this.connected = false; this.peer = null; this.code = '';
  }
}
