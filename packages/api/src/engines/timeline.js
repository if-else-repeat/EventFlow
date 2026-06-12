const { query } = require('../db/pool');
const { emitToEvent } = require('../websocket/server');
const { WS_EVENTS } = require('@eventflow/shared');

async function writeTimeline({ eventId, incidentId, broadcastId, actorId, actorLabel, action, detail, entryType, severity }) {
  try {
    const result = await query(
      `INSERT INTO timeline_entries
         (event_id,incident_id,broadcast_id,actor_id,actor_label,action,detail,entry_type,severity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [eventId, incidentId||null, broadcastId||null, actorId||null,
       actorLabel||null, action, detail||null, entryType||'incident', severity||null]
    );
    emitToEvent(eventId, WS_EVENTS.TIMELINE_ENTRY, result.rows[0]);
    return result.rows[0];
  } catch (err) {
    console.error('[Timeline] Write error:', err.message);
  }
}

module.exports = { writeTimeline };
