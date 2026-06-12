const express = require('express');
const { query } = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { emitToEvent } = require('../websocket/server');
const { WS_EVENTS } = require('@eventflow/shared');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const r = await query(
      `SELECT z.*,
              COUNT(CASE WHEN i.status NOT IN ('resolved','closed') THEN 1 END) AS active_incidents,
              MAX(CASE WHEN i.status NOT IN ('resolved','closed') THEN i.severity END) AS max_severity
       FROM zones z LEFT JOIN incidents i ON i.zone_id=z.id
       WHERE z.event_id=$1 GROUP BY z.id ORDER BY z.sort_order,z.name`,
      [req.operator.event_id]);
    res.json({ zones:r.rows });
  } catch { res.status(500).json({ error: 'Failed to fetch zones' }); }
});

router.patch('/:id/status', requireAuth, requireRole('command','manager'), async (req, res) => {
  const { status } = req.body;
  if (!['normal','busy','critical','closed'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  try {
    const r = await query(
      `UPDATE zones SET status=$1,updated_at=NOW() WHERE id=$2 AND event_id=$3 RETURNING *`,
      [status, req.params.id, req.operator.event_id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Zone not found' });
    emitToEvent(req.operator.event_id, WS_EVENTS.ZONE_STATUS_CHANGED, { zone_id:req.params.id, status });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to update zone' }); }
});

module.exports = router;
