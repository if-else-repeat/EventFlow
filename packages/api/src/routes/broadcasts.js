const express = require('express');
const { query } = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { emitToEvent, emitToZone } = require('../websocket/server');
const { writeTimeline } = require('../engines/timeline');
const { sendSMS }       = require('../services/sms');
const { sendWhatsApp }  = require('../services/whatsapp');
const { BROADCAST_TEMPLATES, WS_EVENTS } = require('@eventflow/shared');
const router = express.Router();

router.get('/templates', requireAuth, (req, res) => res.json(BROADCAST_TEMPLATES));

router.post('/', requireAuth, requireRole('command','manager'), async (req, res) => {
  const { message, priority='informational', audience, channels=['app'], template_id=null } = req.body;
  if (!message || !audience)
    return res.status(400).json({ error: 'message and audience are required' });
  if (message.trim().length < 5)
    return res.status(400).json({ error: 'Message too short' });
  if (req.operator.role==='manager') {
    const allowed = ['operators', `zone:${req.operator.zone_id}`];
    if (!allowed.includes(audience))
      return res.status(403).json({ error: 'Managers can only broadcast to their zone or operators' });
  }

  const eventId = req.operator.event_id;
  try {
    const r = await query(
      `INSERT INTO broadcasts (event_id,sender_id,message,priority,audience,channels,template_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [eventId, req.operator.id, message.trim(), priority, audience, channels, template_id]);
    const broadcast = r.rows[0];

    const senderQ = await query(`SELECT name FROM operators WHERE id=$1`, [req.operator.id]);
    await writeTimeline({
      eventId, broadcastId:broadcast.id, actorId:req.operator.id,
      actorLabel:senderQ.rows[0]?.name||'Staff',
      action:`Broadcast (${audience}): ${message.trim().substring(0,60)}`,
      entryType:'broadcast',
    });

    // WebSocket delivery
    if (audience.startsWith('zone:')) {
      emitToZone(eventId, audience.split(':')[1], WS_EVENTS.BROADCAST_SENT, { broadcast });
    } else {
      emitToEvent(eventId, WS_EVENTS.BROADCAST_SENT, { broadcast });
    }

    // External delivery
    const delivered = { app:1, sms:0, whatsapp:0 };
    if (channels.includes('sms') && process.env.ENABLE_SMS==='true') {
      const phones = await getPhones(eventId, audience);
      for (const p of phones) {
        try { await sendSMS(p, message); delivered.sms++; }
        catch (e) { console.error(`SMS fail ${p}:`, e.message); }
      }
    }
    if (channels.includes('whatsapp') && process.env.ENABLE_WHATSAPP==='true') {
      try { await sendWhatsApp(message); delivered.whatsapp=1; }
      catch (e) { console.error('WhatsApp fail:', e.message); }
    }
    await query(`UPDATE broadcasts SET delivered=$1 WHERE id=$2`, [JSON.stringify(delivered), broadcast.id]);
    res.status(201).json({ broadcast_id:broadcast.id, delivered });
  } catch (err) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const { limit=30, offset=0 } = req.query;
  try {
    const r = await query(
      `SELECT b.*,o.name AS sender_name FROM broadcasts b LEFT JOIN operators o ON o.id=b.sender_id
       WHERE b.event_id=$1 ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`,
      [req.operator.event_id, parseInt(limit), parseInt(offset)]);
    res.json({ broadcasts:r.rows });
  } catch { res.status(500).json({ error: 'Failed to fetch broadcasts' }); }
});

async function getPhones(eventId, audience) {
  let sql = `SELECT phone FROM operators WHERE event_id=$1 AND phone IS NOT NULL`;
  const params = [eventId];
  if (audience==='operators') sql += ` AND role!='command'`;
  else if (audience.startsWith('zone:')) { sql += ' AND zone_id=$2'; params.push(audience.split(':')[1]); }
  const r = await query(sql, params);
  return r.rows.map(r=>r.phone).filter(Boolean);
}

module.exports = router;
