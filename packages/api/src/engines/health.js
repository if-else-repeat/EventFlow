const { query } = require('../db/pool');
const { emitToEvent } = require('../websocket/server');
const { HEALTH_SCORE, HEALTH_THRESHOLDS, EVENT_HEALTH, WS_EVENTS } = require('@eventflow/shared');

let healthInterval = null;

function initHealth() {
  healthInterval = setInterval(async () => {
    try {
      const result = await query(`SELECT id FROM events WHERE status = 'active'`);
      for (const row of result.rows) await recalculateHealth(row.id);
    } catch (err) {
      console.error('[Health] Background job error:', err.message);
    }
  }, HEALTH_SCORE.RECALCULATE_INTERVAL_MS);
}

async function recalculateHealth(eventId) {
  try {
    const result = await query(
      `SELECT severity, assigned_team, created_at FROM incidents
       WHERE event_id = $1 AND status NOT IN ('resolved','closed')`,
      [eventId]);
    const score  = calculateScore(result.rows);
    const health = scoreToHealth(score);
    await query(
      `UPDATE events SET health=$1, health_score=$2, updated_at=NOW() WHERE id=$3`,
      [health, score, eventId]);
    emitToEvent(eventId, WS_EVENTS.HEALTH_UPDATED, { health, score });
    return { health, score };
  } catch (err) {
    console.error('[Health] Error:', err.message);
  }
}

function calculateScore(incidents) {
  return incidents.reduce((total, inc) => {
    const age  = (Date.now() - new Date(inc.created_at).getTime()) / 60000;
    const base = HEALTH_SCORE.SEVERITY_WEIGHTS[inc.severity] || 1;
    const ageM = HEALTH_SCORE.AGE_MULTIPLIERS.find(m => age < m.maxMinutes)?.multiplier || 3.0;
    const unassigned = inc.assigned_team ? 1.0 : HEALTH_SCORE.UNASSIGNED_MULTIPLIER;
    return total + base * ageM * unassigned;
  }, 0);
}

function scoreToHealth(score) {
  if (score <= HEALTH_THRESHOLDS.GREEN)  return EVENT_HEALTH.GREEN;
  if (score <= HEALTH_THRESHOLDS.YELLOW) return EVENT_HEALTH.YELLOW;
  if (score <= HEALTH_THRESHOLDS.ORANGE) return EVENT_HEALTH.ORANGE;
  return EVENT_HEALTH.RED;
}

module.exports = { initHealth, recalculateHealth, calculateScore };
