const express = require('express');
const { query } = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { processEscalation } = require('../engines/escalation');
const { recalculateHealth } = require('../engines/health');
const { emitToEvent } = require('../websocket/server');
const { writeTimeline } = require('../engines/timeline');
const { ESCALATION, WS_EVENTS } = require('@eventflow/shared');
const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { zone_id, category, severity, title, notes, photo, lat, lng, original_timestamp } = req.body;
  if (!zone_id || !category || !severity || !title)
    return res.status(400).json({ error: 'zone_id, category, severity, and title are required' });
  const sev = parseInt(severity);
  if (isNaN(sev) || sev < 1 || sev > 4)
    return res.status(400).json({ error: 'severity must be 1-4' });

  const eventId = req.operator.event_id;
  try {
    const zoneCheck = await query(
      `SELECT id,name,label FROM zones WHERE id=$1 AND event_id=$2`, [zone_id, eventId]);
    if (!zoneCheck.rows.length)
      return res.status(400).json({ error: 'Zone not found for this event' });
    const zone = zoneCheck.rows[0];

    // Correlation window
    const existing = await query(
      `SELECT id,report_count,severity,confidence FROM incidents
       WHERE event_id=$1 AND zone_id=$2 AND category=$3
         AND status NOT IN ('resolved','closed')
         AND created_at > NOW() - INTERVAL '${ESCALATION.CORRELATION_WINDOW_MINUTES} minutes'
       ORDER BY created_at DESC LIMIT 1`,
      [eventId, zone_id, category]);

    let incident, wasMerged = false;
    if (existing.rows.length) {
      const prev = existing.rows[0];
      const newCount = prev.report_count + 1;
      let confidence = prev.confidence;
      let newSev = prev.severity;
      if (newCount >= ESCALATION.HIGH_CONFIDENCE_THRESHOLD) { confidence='high'; newSev=Math.min(4,newSev+1); }
      else if (newCount >= ESCALATION.MEDIUM_CONFIDENCE_THRESHOLD) confidence='medium';
      const u = await query(
        `UPDATE incidents SET report_count=$1,confidence=$2,severity=$3,updated_at=NOW()
         WHERE id=$4 RETURNING *`,
        [newCount, confidence, newSev, prev.id]);
      incident = u.rows[0]; wasMerged = true;
    } else {
      const photoUrl = photo ? (photo.startsWith('data:') ? photo : `data:image/jpeg;base64,${photo}`) : null;
      const c = await query(
        `INSERT INTO incidents (event_id,zone_id,reporter_id,category,severity,status,title,notes,photo_url,lat,lng,source,confidence,report_count)
         VALUES ($1,$2,$3,$4,$5,'new',$6,$7,$8,$9,$10,'app','low',1) RETURNING *`,
        [eventId,zone_id,req.operator.id,category,sev,title,notes||null,photoUrl,lat||null,lng||null]);
      incident = c.rows[0];
      if (original_timestamp) {
        const delay = Math.round((Date.now()-new Date(original_timestamp).getTime())/1000);
        await query(
          `INSERT INTO sync_log (incident_id,operator_id,original_ts,delay_seconds) VALUES ($1,$2,$3,$4)`,
          [incident.id, req.operator.id, new Date(original_timestamp), delay]);
      }
    }

    const opQ = await query(
      `SELECT o.name,z.name AS zone_name FROM operators o LEFT JOIN zones z ON z.id=o.zone_id WHERE o.id=$1`,
      [req.operator.id]);
    const op = opQ.rows[0];
    await writeTimeline({
      eventId, incidentId:incident.id, actorId:req.operator.id,
      actorLabel:`${op.name} — ${op.zone_name||'Unassigned'}`,
      action: wasMerged ? `Additional report: ${title}` : `Reported: ${title}`,
      detail: wasMerged
        ? `Report #${incident.report_count} · Confidence: ${incident.confidence}`
        : `Zone: ${zone.name} · Severity: ${sev} · Category: ${category}`,
      entryType:'incident', severity:incident.severity,
    });

    emitToEvent(eventId, wasMerged ? WS_EVENTS.INCIDENT_UPDATED : WS_EVENTS.INCIDENT_CREATED,
      { incident, zone, merged:wasMerged });
    await processEscalation(incident, eventId, zone);
    await recalculateHealth(eventId);

    res.status(wasMerged?200:201).json({
      incident_id:incident.id, status:'received', merged:wasMerged, confidence:incident.confidence,
    });
  } catch (err) {
    console.error('Incident submission error:', err);
    res.status(500).json({ error: 'Failed to submit incident. Please try again.' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const { status, zone_id, severity_min, limit=50, offset=0 } = req.query;
  const conds = ['i.event_id=$1']; const params = [req.operator.event_id]; let idx=2;
  if (status)       { conds.push(`i.status=$${idx++}`);        params.push(status); }
  if (zone_id)      { conds.push(`i.zone_id=$${idx++}`);       params.push(zone_id); }
  if (severity_min) { conds.push(`i.severity>=$${idx++}`);     params.push(parseInt(severity_min)); }
  try {
    const r = await query(
      `SELECT i.*,z.name AS zone_name,z.label AS zone_label,o.name AS reporter_name
       FROM incidents i
       LEFT JOIN zones z ON z.id=i.zone_id
       LEFT JOIN operators o ON o.id=i.reporter_id
       WHERE ${conds.join(' AND ')}
       ORDER BY i.severity DESC, i.created_at DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, parseInt(limit), parseInt(offset)]);
    res.json({ incidents: r.rows });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch incidents' }); }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const r = await query(
      `SELECT i.*,z.name AS zone_name,z.label AS zone_label,o.name AS reporter_name
       FROM incidents i LEFT JOIN zones z ON z.id=i.zone_id LEFT JOIN operators o ON o.id=i.reporter_id
       WHERE i.id=$1 AND i.event_id=$2`,
      [req.params.id, req.operator.event_id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch { res.status(500).json({ error: 'Failed to fetch incident' }); }
});

router.patch('/:id', requireAuth, requireRole('command','manager'), async (req, res) => {
  const { status, assigned_team, notes, severity } = req.body;
  try {
    const cur = await query(
      `SELECT i.*,z.name AS zone_name FROM incidents i LEFT JOIN zones z ON z.id=i.zone_id
       WHERE i.id=$1 AND i.event_id=$2`,
      [req.params.id, req.operator.event_id]);
    if (!cur.rows.length) return res.status(404).json({ error: 'Not found' });
    const prev = cur.rows[0];
    const sets=[]; const vals=[]; let idx=1;
    if (status && status!==prev.status) {
      sets.push(`status=$${idx++}`); vals.push(status);
      if (status==='resolved') sets.push(`resolved_at=NOW()`);
    }
    if (assigned_team!==undefined) { sets.push(`assigned_team=$${idx++}`); vals.push(assigned_team); }
    if (notes!==undefined)         { sets.push(`notes=$${idx++}`);         vals.push(notes); }
    if (severity)                  { sets.push(`severity=$${idx++}`);      vals.push(parseInt(severity)); }
    if (!sets.length) return res.status(400).json({ error: 'Nothing to update' });
    vals.push(req.params.id);
    const u = await query(
      `UPDATE incidents SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${idx} RETURNING *`, vals);
    const inc = u.rows[0];

    const opQ = await query(`SELECT name FROM operators WHERE id=$1`, [req.operator.id]);
    let action = assigned_team && assigned_team!==prev.assigned_team
      ? `Assigned to: ${assigned_team}`
      : status && status!==prev.status
        ? `Status: ${prev.status} → ${status}`
        : 'Updated incident';
    await writeTimeline({
      eventId:req.operator.event_id, incidentId:inc.id, actorId:req.operator.id,
      actorLabel:opQ.rows[0]?.name||'Staff', action, detail:prev.title,
      entryType:'incident', severity:inc.severity,
    });

    emitToEvent(req.operator.event_id, WS_EVENTS.INCIDENT_UPDATED,
      { incident:inc, zone:{name:prev.zone_name} });
    await recalculateHealth(req.operator.event_id);

    if (status==='resolved'||status==='closed') {
      // Recalculate zone status
      const zRes = await query(
        `SELECT MAX(severity) AS ms FROM incidents
         WHERE zone_id=$1 AND event_id=$2 AND status NOT IN ('resolved','closed')`,
        [inc.zone_id, req.operator.event_id]);
      const ms = zRes.rows[0]?.ms;
      const zStatus = ms>=3?'critical':ms>=2?'busy':'normal';
      await query(`UPDATE zones SET status=$1,updated_at=NOW() WHERE id=$2`, [zStatus, inc.zone_id]);
    }
    res.json(inc);
  } catch (err) {
    console.error('Update incident error:', err);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

module.exports = router;
