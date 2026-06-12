import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const API = '/api';

export function useCommandData(token) {
  const [incidents,  setIncidents]  = useState([]);
  const [zones,      setZones]      = useState([]);
  const [timeline,   setTimeline]   = useState([]);
  const [broadcasts, setBroadcasts] = useState([]);
  const [health,     setHealth]     = useState({ health:'green', score:0 });
  const [event,      setEvent]      = useState(null);
  const [connected,  setConnected]  = useState(false);
  const [loading,    setLoading]    = useState(true);
  const socketRef = useRef(null);

  const headers = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  // Initial data load
  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [incRes, zoneRes, tlRes, brRes, evRes] = await Promise.all([
        fetch(`${API}/incidents?limit=50`,    { headers: headers() }),
        fetch(`${API}/zones`,                  { headers: headers() }),
        fetch(`${API}/timeline?limit=80`,      { headers: headers() }),
        fetch(`${API}/broadcasts?limit=20`,    { headers: headers() }),
        fetch(`${API}/events/${JSON.parse(atob(token.split('.')[1])).event_id}`, { headers: headers() }),
      ]);
      const [incData, zoneData, tlData, brData, evData] = await Promise.all([
        incRes.json(), zoneRes.json(), tlRes.json(), brRes.json(), evRes.json(),
      ]);
      if (incData.incidents)  setIncidents(incData.incidents);
      if (zoneData.zones)     setZones(zoneData.zones);
      if (tlData.entries)     setTimeline(tlData.entries);
      if (brData.broadcasts)  setBroadcasts(brData.broadcasts);
      if (evData.id)          { setEvent(evData); setHealth({ health: evData.health, score: evData.health_score }); }
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, headers]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // WebSocket
  useEffect(() => {
    if (!token) return;
    const socket = io('', {
      auth: { token },
      transports: ['websocket','polling'],
      reconnection: true,
    });
    socketRef.current = socket;
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('incident:created', ({ incident, zone }) => {
      setIncidents(prev => {
        const exists = prev.find(i => i.id === incident.id);
        if (exists) return prev.map(i => i.id === incident.id ? { ...i, ...incident, zone_name: zone?.name } : i);
        return [{ ...incident, zone_name: zone?.name }, ...prev];
      });
    });
    socket.on('incident:updated', ({ incident, zone }) => {
      setIncidents(prev => prev.map(i => i.id === incident.id ? { ...i, ...incident, zone_name: zone?.name || i.zone_name } : i));
    });
    socket.on('broadcast:sent', ({ broadcast }) => {
      setBroadcasts(prev => [broadcast, ...prev]);
    });
    socket.on('zone:status_changed', ({ zone_id, status }) => {
      setZones(prev => prev.map(z => z.id === zone_id ? { ...z, status } : z));
    });
    socket.on('health:updated', ({ health, score }) => {
      setHealth({ health, score });
    });
    socket.on('timeline:entry', (entry) => {
      setTimeline(prev => [entry, ...prev.slice(0, 99)]);
    });

    return () => socket.disconnect();
  }, [token]);

  // Actions
  const updateIncident = useCallback(async (id, patch) => {
    const res  = await fetch(`${API}/incidents/${id}`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) setIncidents(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
    return res.ok;
  }, [headers]);

  const sendBroadcast = useCallback(async (payload) => {
    const res  = await fetch(`${API}/broadcasts`, {
      method: 'POST', headers: headers(), body: JSON.stringify(payload),
    });
    return res.ok ? await res.json() : null;
  }, [headers]);

  const updateZoneStatus = useCallback(async (zoneId, status) => {
    const res = await fetch(`${API}/zones/${zoneId}/status`, {
      method: 'PATCH', headers: headers(), body: JSON.stringify({ status }),
    });
    return res.ok;
  }, [headers]);

  return {
    incidents, zones, timeline, broadcasts, health, event,
    connected, loading, updateIncident, sendBroadcast, updateZoneStatus, reload: loadAll,
  };
}
