const { query } = require('../db/pool');
const { emitToEvent, emitToRole } = require('../websocket/server');
const { writeTimeline } = require('./timeline');
const { ESCALATION, WS_EVENTS } = require('@eventflow/shared');

const escalationTimers = new Map();

async function processEscalation(incident, eventId, zone) {
  const { id, severity, confidence } = incident;
  if (severity === 4) {
    emitToEvent(eventId, WS_EVENTS.INCIDENT_CREATED, { incident, zone, emergency: true,
      message: `🚨 EMERGENCY: ${incident.title} — ${zone?.name}` });
    return;
  }
  if (severity === 3) {
    emitToRole(eventId, 'manager', WS_EVENTS.INCIDENT_CREATED, { incident, zone });
    emitToRole(eventId, 'command', WS_EVENTS.INCIDENT_CREATED, { incident, zone, urgency: 'high' });
    startTimer(id, eventId, incident, zone, ESCALATION.ZONE_MANAGER_TIMEOUT_SECONDS);
    return;
  }
  if (confidence === 'high') {
    emitToRole(eventId, 'manager', WS_EVENTS.INCIDENT_CREATED, { incident, zone });
    startTimer(id, eventId, incident, zone, ESCALATION.HIGH_CONFIDENCE_TIMEOUT_SECONDS);
    return;
  }
  emitToRole(eventId, 'manager', WS_EVENTS.INCIDENT_CREATED, { incident, zone });
}

function startTimer(incidentId, eventId, incident, zone, seconds) {
  cancelTimer(incidentId);
  const handle = setTimeout(async () => {
    try {
      const r = await query(`SELECT status FROM incidents WHERE id=$1`, [incidentId]);
      if (!r.rows[0]) return;
      if (['new','under_review'].includes(r.rows[0].status)) {
        await query(
          `UPDATE incidents SET status='auto_escalated', updated_at=NOW() WHERE id=$1`,
          [incidentId]);
        await writeTimeline({
          eventId, incidentId, actorLabel:'System',
          action:`Auto-escalated: no Zone Manager response after ${seconds}s`,
          entryType:'system', severity:incident.severity,
        });
        emitToRole(eventId, 'command', WS_EVENTS.INCIDENT_UPDATED, {
          incident:{ ...incident, status:'auto_escalated' }, zone, urgent:true,
          message:`UNACKNOWLEDGED: ${incident.title} — ${zone?.name} (${seconds}s timeout)`,
        });
      }
    } catch (err) {
      console.error('[Escalation] Timer error:', err.message);
    } finally {
      escalationTimers.delete(incidentId);
    }
  }, seconds * 1000);
  escalationTimers.set(incidentId, handle);
}

function cancelTimer(incidentId) {
  const h = escalationTimers.get(incidentId);
  if (h) { clearTimeout(h); escalationTimers.delete(incidentId); }
}

module.exports = { processEscalation, cancelTimer };
