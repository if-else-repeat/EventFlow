# EventFlow

**An open-source coordination operating system for temporary cities.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Status: Early Development](https://img.shields.io/badge/Status-Early%20Development-orange.svg)]()

---

> *"Events do not fail because there are too many people.*
> *Events fail because information moves slower than people."*

---

## What Is EventFlow?

EventFlow is coordination infrastructure for large public gatherings — sporting events, concerts, festivals, religious pilgrimages, political rallies, expos, and public celebrations.

It is **not** a ticketing platform. Not a surveillance system. Not an analytics product.

It is the missing coordination layer between the people running an event and the people working it on the ground. Large events are temporary cities. Cities have operating systems. Events usually don't. When they have something, it's usually a WhatsApp group and a lot of shouting. EventFlow changes that.

**The core problem:** During any large event, three groups hold fragments of critical operational information simultaneously — organizers, field operators, and attendees. None of them can see what the others know. A queue builds at Gate A. A volunteer sees it but doesn't know who to tell. The organizer is watching a board that hasn't updated. Attendees keep walking toward the bottleneck. Small problems become large ones not because of the crowd — because of the silence.

---

## The Design Constraints

| Constraint | Practical meaning |
|---|---|
| Infrastructure-light | No cameras, no sensors, no hardware purchases |
| Works on cheap Android phones | Tested on devices under $50 USD |
| Degrades gracefully | Reports queue offline and sync on reconnect |
| Minimal training | Operator submits a report in under 10 seconds |
| Self-hostable | Runs on a $10/month VPS with Docker |
| SMS fallback | Works when the app doesn't |

---

## How It Works

```
EVENT COMMAND          ← Full visibility, broadcast authority
        ↕
ZONE MANAGERS          ← Area responsibility, incident verification  
        ↕
FIELD OPERATORS        ← 3-tap incident reporting from the ground
        ↓
ATTENDEES              ← Receive only actionable public information
```

A field operator sees congestion at Gate A. They tap Report → Congestion → High → Submit. In under 2 seconds, the Zone Manager gets a push notification. If 3 operators report the same thing, confidence elevates automatically. If the Zone Manager doesn't respond in 2 minutes, it escalates to Command. Command sends a broadcast: "Use Gate C." Attendees see it in the public feed and on WhatsApp.

---

## Features (v1.0)

**Incident Reporting** — Three taps. Category, severity, submit. No typing required for a basic report. Works offline, syncs on reconnect.

**Command Dashboard** — Real-time operational view: active incidents by severity, zone status board, event health indicator, live timeline. Built for a laptop at an operations table.

**Broadcast Engine** — Pre-written templates reduce cognitive load under stress. One-click to send "Use Gate C for faster entry" to all attendees via app, SMS, and WhatsApp simultaneously.

**Event Timeline** — Permanent chronological log of every incident, assignment, broadcast, and resolution. Useful during the event. More useful in the debrief.

**Public Information Feed** — Simple, public-facing page accessible via QR code. No accounts, no dashboard, no incident data. Just what attendees can act on.

**Offline Mode** — Reports queue locally when connectivity drops. Sync automatically when the connection returns.

**SMS Fallback** — `EF GATE-A CONGESTION HIGH` sent by text creates an incident in the dashboard.

---

## Who This Is For

EventFlow is designed for events that do not have dedicated operations software — which is most events on earth.

- NGOs and religious organizations running large pilgrimages and gatherings
- College festivals with volunteer operations teams
- Local government managing public celebrations
- Independent promoters in tier-2 and tier-3 cities
- Sports associations running district and state tournaments

If you run an event with more than 5,000 people and your coordination system is a WhatsApp group, EventFlow is for you.

---

## Stack

| Layer | Technology |
|---|---|
| API | Node.js 20, Express 4 |
| Real-time | Socket.io 4 |
| Database | PostgreSQL 15 |
| Cache / Pub-Sub | Redis 7 |
| Operator App | React 18, Vite 5 (PWA) |
| Command Dashboard | React 18, Vite 5 |
| SMS | Twilio (swappable for MSG91, Africa's Talking) |
| Deployment | Docker Compose |

---

## Getting Started

### Prerequisites
Node.js 20+, Docker, Docker Compose

### Setup

```bash
git clone https://github.com/YOUR_USERNAME/eventflow
cd eventflow
npm install
docker compose -f docker-compose.dev.yml up -d
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| Command Dashboard | http://localhost:4000 |
| Operator PWA | http://localhost:4001 |

**Test login:** Phone `+917001000001`, Event code `TEST01` (Command role)
**Operator login:** Phone `+917001000040`, Event code `TEST01`

---

## Documentation

| | |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data models, failure modes |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute |
| [docs/deployment/self-hosted.md](docs/deployment/self-hosted.md) | VPS deployment guide |
| [docs/field-guides/operator-guide.md](docs/field-guides/operator-guide.md) | Printable operator briefing card |

---

## Project Status

**Early development.** Architecture complete. Core API, command dashboard, and operator PWA implemented. Looking for real events to deploy at.

- [x] Database schema and migrations
- [x] REST API (incidents, broadcasts, zones, timeline, feed, auth)
- [x] Escalation engine with auto-escalation timers
- [x] Health score algorithm
- [x] WebSocket real-time layer
- [x] Operator PWA (login, report, offline queue)
- [x] Command Dashboard (incidents, zones, broadcast, timeline)
- [x] SMS inbound parser
- [ ] Web push notifications
- [ ] Post-event debrief report generator
- [ ] Pre-event setup wizard
- [ ] Multi-event analytics

---

## First Deployment

We are looking for a real event to deploy EventFlow at — even small (5,000+ people). If you are organizing one and want to trial this, open an issue or reach out directly.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). The bar for a useful contribution is not "this is technically interesting." It is "this makes the system more useful to an event operator under stress on a cheap Android phone."

---

## Why Open Source?

Event coordination failures have caused real deaths. The 2021 Astroworld incident. The 2022 Itaewon crush. Dozens of smaller incidents every year at festivals, pilgrimages, and political gatherings that never make international news. In almost every case, information failure was a root cause — not crowd size.

The organizations that most need this are the ones that can least afford proprietary software. Open source is not an ideological choice here. It is the only way this tool reaches the people who need it.

---

## License

MIT. Use it, deploy it, build on it. If you improve it, share it back.

---

*EventFlow is built on the belief that events are coordination problems disguised as crowd problems.*
