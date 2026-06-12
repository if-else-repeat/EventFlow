const express = require('express');
const { query } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const { since, limit=100 } = req.query;
  const conds=['t.event_id=$1']; const params=[req.operator.event_id]; let idx=2;
  if (since) { conds.push(`t.created_at>$${idx++}`); params.push(new Date(since)); }
  try {
    const r = await query(
      `SELECT t.*, i.title AS incident_title, i.category, z.name AS zone_name
       FROM timeline_entries t
       LEFT JOIN incidents i ON i.id=t.incident_id
       LEFT JOIN zones z ON z.id=i.zone_id
       WHERE ${conds.join(' AND ')} ORDER BY t.created_at DESC LIMIT $${idx}`,
      [...params, parseInt(limit)]);
    res.json({ entries:r.rows });
  } catch { res.status(500).json({ error: 'Failed to fetch timeline' }); }
});

module.exports = router;
