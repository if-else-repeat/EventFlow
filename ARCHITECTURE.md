# EventFlow Architecture

## Core Principle

EventFlow is designed around three hard constraints that override everything else:

1. **Works in bad conditions** — low bandwidth, cheap devices, stressed users, partial connectivity
2. **Understandable** — any Node.js developer should be able to read the codebase in a day
3. **Self-hostable** — deployable on a $10/month VPS with Docker

---

## System Layers

```
┌─────────────────────────────────────────────────┐
│  FIELD OPERATORS            SMS FALLBACK        │
│  Operator PWA (React)       Feature phones       │
└──────────────┬──────────────────────────────────┘
               │ HTTPS / WebSocket
┌──────────────▼──────────────────────────────────┐
│  COMMAND DASHBOARD          PUBLIC FEED         │
│  React (desktop)            Static HTML          │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  EVENTFLOW API                                   │
│  Node.js · Express · Socket.io                   │
│                                                  │
│  ┌─────────────┐  ┌──────────────────────────┐  │
│  │  Escalation │  │  Health Score Engine     │  │
│  │  Engine     │  │  (60s background job)    │  │
│  └─────────────┘  └──────────────────────────┘  │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  PostgreSQL 15          Redis 7                  │
│  Primary store          Pub/Sub + Cache           │
└─────────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│  Twilio (SMS)    WhatsApp Business    Web Push   │
└─────────────────────────────────────────────────┘
```

---

## Information Flow

```
Field Operator taps "REPORT INCIDENT"
  → POST /api/incidents
  → Correlation check (same zone + category + 5 min window)
  → If duplicate: increment report_count, elevate confidence
  → If new: create incident
  → Write timeline entry
  → Emit WebSocket event to zone + command
  → Escalation engine processes rules
  → Health score recalculated
  → Dashboard updates in < 1 second
```

---

## Offline Mode

```
Operator submits report while offline
  → Saved to localStorage queue
  → UI shows "Saved Offline"

Connectivity restored
  → Background sync flushes queue
  → Each queued report POST'd with original_timestamp
  → Sync delay logged in sync_log table
  → UI confirms "X reports synced"
```

---

## Escalation Rules

| Trigger | Action |
|---|---|
| Severity 4 (Emergency) | Notify entire event simultaneously, bypass all workflow |
| Severity 3 (Critical) | Notify zone managers + command, start 120s timer |
| 5+ reports same zone/category | Elevate confidence to HIGH, bump severity +1 |
| Zone Manager no response 120s | Auto-escalate to command, log timeline entry |
| High confidence, no action 300s | Re-escalate to command |

---

## Health Score Formula

```
score = Σ ( severity_weight × age_multiplier × unassigned_penalty )

Severity weights: 1→1, 2→3, 3→7, 4→20
Age multipliers:  <5min→1.0, 5-10min→1.5, 10-20min→2.0, 20+min→3.0
Unassigned:       ×2.0 if no team assigned

Green: 0–15  |  Yellow: 16–40  |  Orange: 41–80  |  Red: 81+
```

---

## Data Models

See `packages/api/src/db/schema.sql` for full schema.

Core tables: `events`, `zones`, `operators`, `incidents`, `broadcasts`, `timeline_entries`, `sync_log`

---

## Technology Decisions

**PWA not native app** — Install barrier kills adoption. Volunteers recruited hours before an event won't install an app. A PWA loads from a URL and installs in one tap.

**PostgreSQL not MongoDB** — Event data is relational. Incidents belong to zones belong to events. Relational integrity at the database level is not optional.

**Socket.io not raw WebSockets** — Automatic reconnection, room-based broadcasting per zone, fallback to HTTP long-polling for restrictive venue networks.

**Twilio swappable** — The SMS service layer is abstracted. Replacing Twilio with MSG91 (India), Africa's Talking, or Termii requires only a config change.

---

## Failure Modes

| Failure | Mitigation |
|---|---|
| API server crash | PM2 auto-restart, health check endpoint |
| Database unavailable | Connection retry, operator apps queue offline |
| Redis unavailable | Falls back to direct DB polling every 5s |
| Internet at venue | IndexedDB queue + SMS fallback |
| Zone Manager offline | 120s escalation timer → auto-escalate to command |
| Command Center offline | Zone managers operate independently with last known state |

---

## Scalability

MVP designed for up to 500 concurrent WebSocket connections and 1,000 incidents/hour.
Above this: horizontal API scaling with shared Redis is straightforward but not required for v1.
