const express = require('express');
const { query } = require('../db/pool');
const { signToken, requireAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { phone, event_code } = req.body;
  if (!phone || !event_code)
    return res.status(400).json({ error: 'phone and event_code are required' });

  try {
    const evRes = await query(
      `SELECT id, name, status FROM events WHERE event_code = $1`,
      [event_code.trim().toUpperCase()]);
    if (!evRes.rows.length)
      return res.status(401).json({ error: 'Invalid event code' });
    const event = evRes.rows[0];

    const opRes = await query(
      `SELECT o.id,o.name,o.role,o.zone_id,z.label AS zone_label,z.name AS zone_name
       FROM operators o LEFT JOIN zones z ON z.id=o.zone_id
       WHERE o.event_id=$1 AND o.phone=$2 AND o.is_active=true`,
      [event.id, phone.trim()]);
    if (!opRes.rows.length)
      return res.status(401).json({ error: 'Phone not registered for this event. Contact your supervisor.' });

    const op = opRes.rows[0];
    await query(`UPDATE operators SET last_seen=NOW() WHERE id=$1`, [op.id]);

    const token = signToken({ id:op.id, event_id:event.id, role:op.role, zone_id:op.zone_id });
    res.json({
      token,
      operator: { id:op.id, name:op.name, role:op.role, zone_id:op.zone_id, zone_label:op.zone_label, zone_name:op.zone_name },
      event:    { id:event.id, name:event.name, status:event.status },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const r = await query(
      `SELECT o.id,o.name,o.role,o.zone_id,o.last_seen,
              z.label AS zone_label, z.name AS zone_name,
              e.id AS event_id,e.name AS event_name,e.status AS event_status,e.health
       FROM operators o
       JOIN events e ON e.id=o.event_id
       LEFT JOIN zones z ON z.id=o.zone_id
       WHERE o.id=$1`, [req.operator.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    await query(`UPDATE operators SET last_seen=NOW() WHERE id=$1`, [req.operator.id]);
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch operator info' });
  }
});

module.exports = router;
