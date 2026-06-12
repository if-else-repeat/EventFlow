const express = require('express');
const { query } = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const router = express.Router();

function genCode() {
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({length:6},()=>c[Math.floor(Math.random()*c.length)]).join('');
}

router.post('/', async (req, res) => {
  const { name, venue, event_date, capacity } = req.body;
  if (!name || !event_date)
    return res.status(400).json({ error: 'name and event_date are required' });
  let code;
  for (let i=0; i<10; i++) {
    const c=genCode();
    const ex=await query(`SELECT id FROM events WHERE event_code=$1`,[c]);
    if (!ex.rows.length) { code=c; break; }
  }
  if (!code) return res.status(500).json({ error: 'Could not generate event code' });
  try {
    const r = await query(
      `INSERT INTO events (name,venue,event_date,capacity,event_code) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name.trim(), venue?.trim()||null, new Date(event_date), capacity||null, code]);
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create event' }); }
});

router.get('/:id', requireAuth, async (req, res) => {
  if (req.operator.event_id!==req.params.id)
    return res.status(403).json({ error: 'Access denied' });
  try {
    const r = await query(
      `SELECT e.*,
         (SELECT COUNT(*) FROM zones WHERE event_id=e.id) AS zone_count,
         (SELECT COUNT(*) FROM operators WHERE event_id=e.id AND is_active=true) AS operator_count,
         (SELECT COUNT(*) FROM incidents WHERE event_id=e.id AND status NOT IN ('resolved','closed')) AS active_incidents
       FROM events e WHERE e.id=$1`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to fetch event' }); }
});

router.patch('/:id/status', requireAuth, requireRole('command'), async (req, res) => {
  const { status } = req.body;
  if (!['pre_event','active','emergency','post_event'].includes(status))
    return res.status(400).json({ error: 'Invalid status' });
  if (req.operator.event_id!==req.params.id)
    return res.status(403).json({ error: 'Access denied' });
  try {
    const r = await query(
      `UPDATE events SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *`, [status, req.params.id]);
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to update status' }); }
});

module.exports = router;
