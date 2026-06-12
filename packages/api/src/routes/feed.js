const express = require('express');
const { query } = require('../db/pool');
const router = express.Router();

router.get('/', async (req, res) => {
  const { event_id } = req.query;
  if (!event_id) return res.status(400).json({ error: 'event_id required' });
  try {
    const ev = await query(`SELECT id,name,venue,status,health FROM events WHERE id=$1`, [event_id]);
    if (!ev.rows.length) return res.status(404).json({ error: 'Event not found' });
    const br = await query(
      `SELECT id,message,priority,created_at FROM broadcasts
       WHERE event_id=$1 AND audience IN ('attendees','all')
       ORDER BY created_at DESC LIMIT 10`,
      [event_id]);
    res.set('Cache-Control','public, max-age=30');
    res.json({ event:ev.rows[0], updates:br.rows, generated_at:new Date().toISOString() });
  } catch { res.status(500).json({ error: 'Failed to load feed' }); }
});

module.exports = router;
