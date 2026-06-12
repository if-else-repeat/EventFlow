const express = require('express');
const { query } = require('../db/pool');
const { writeTimeline } = require('../engines/timeline');
const { emitToEvent } = require('../websocket/server');
const { recalculateHealth } = require('../engines/health');
const { sendSMS } = require('../services/sms');
const { SMS_SEVERITY_MAP, SMS_CATEGORY_MAP, WS_EVENTS } = require('@eventflow/shared');
const router = express.Router();

// POST /webhooks/sms-inbound
// Format: EF {ZONE_CODE} {CATEGORY} {SEVERITY}
router.post('/sms-inbound', async (req, res) => {
  res.set('Content-Type','text/xml');
  const { From:from, Body:body } = req.body;
  if (!from||!body) return res.send('<Response></Response>');

  const text  = body.trim().toUpperCase();
  const parts = text.split(/\s+/);

  if (!text.startsWith('EF ') || parts.length < 4) {
    await sendSMS(from,'EventFlow: Format is: EF ZONE CATEGORY SEVERITY\nE.g.: EF GATE-N CONGESTION HIGH').catch(()=>{});
    return res.send('<Response></Response>');
  }

  const [,zoneCode,categoryRaw,severityRaw] = parts;
  try {
    const opRes = await query(
      `SELECT o.id,o.event_id,o.name FROM operators o
       JOIN events e ON e.id=o.event_id
       WHERE o.phone=$1 AND o.is_active=true AND e.status='active' LIMIT 1`,
      [from]);
    if (!opRes.rows.length) {
      await sendSMS(from,'EventFlow: Your number is not registered for an active event.').catch(()=>{});
      return res.send('<Response></Response>');
    }
    const op = opRes.rows[0];
    const zRes = await query(
      `SELECT id,name FROM zones WHERE label=$1 AND event_id=$2`, [zoneCode, op.event_id]);
    if (!zRes.rows.length) {
      await sendSMS(from,`EventFlow: Zone "${zoneCode}" not found.`).catch(()=>{});
      return res.send('<Response></Response>');
    }
    const zone     = zRes.rows[0];
    const category = SMS_CATEGORY_MAP[categoryRaw]  || 'other';
    const severity = SMS_SEVERITY_MAP[severityRaw]  || 2;
    const inc = await query(
      `INSERT INTO incidents (event_id,zone_id,reporter_id,category,severity,status,title,source,confidence,report_count)
       VALUES ($1,$2,$3,$4,$5,'new',$6,'sms','low',1) RETURNING *`,
      [op.event_id,zone.id,op.id,category,severity,`SMS: ${categoryRaw} at ${zoneCode}`]);
    const incident = inc.rows[0];
    await writeTimeline({
      eventId:op.event_id, incidentId:incident.id, actorId:op.id,
      actorLabel:`${op.name} (SMS)`,
      action:`SMS report: ${categoryRaw} at ${zoneCode}`,
      detail:`Severity: ${severity} · SMS fallback`,
      entryType:'incident', severity,
    });
    emitToEvent(op.event_id, WS_EVENTS.INCIDENT_CREATED, { incident, zone, source:'sms' });
    await recalculateHealth(op.event_id);
    await sendSMS(from,`EventFlow ✓ Report received: ${categoryRaw} at ${zoneCode} (Sev ${severity}). Zone manager notified.`).catch(()=>{});
    res.send('<Response></Response>');
  } catch (err) {
    console.error('SMS webhook error:', err);
    res.send('<Response></Response>');
  }
});

module.exports = router;
