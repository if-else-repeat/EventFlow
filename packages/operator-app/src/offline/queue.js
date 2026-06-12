// Offline report queue using localStorage (IndexedDB in production)
const QUEUE_KEY = 'ef_offline_queue';

export function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
  catch { return []; }
}

export function enqueue(report) {
  const q = getQueue();
  const item = { ...report, _id: Date.now(), _retries: 0, _queued_at: new Date().toISOString() };
  q.push(item);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  return item;
}

export function dequeue(id) {
  const q = getQueue().filter(r => r._id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function getQueueLength() { return getQueue().length; }

export async function flushQueue(token) {
  const q = getQueue();
  if (!q.length) return { synced: 0, failed: 0 };
  let synced = 0, failed = 0;
  for (const item of q) {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({ ...item, original_timestamp: item._queued_at }),
      });
      if (res.ok) { dequeue(item._id); synced++; }
      else failed++;
    } catch { failed++; }
  }
  return { synced, failed };
}
