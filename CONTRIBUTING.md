# Contributing to EventFlow

EventFlow is not a portfolio project. It is coordination infrastructure for large public gatherings — environments where information failures have caused real injuries and deaths. Every contribution should be evaluated against one question: **does this make the system more useful to an event operator under stress on a cheap Android phone?**

---

## Ways to Contribute

**Code** — bug fixes, feature implementations, test coverage, SMS provider integrations, performance improvements, accessibility improvements.

**Field research** — deployment reports, operator feedback, documentation of how events currently coordinate without EventFlow. This is as valuable as code.

**Documentation** — translations (Hindi, Swahili, Portuguese, Arabic, French are priorities), deployment guides for specific environments, operator briefing materials adapted for specific event types.

**Honest criticism** — if you see a design decision that would fail under real event conditions, open an issue and explain why.

---

## Code Standards

**Readability over cleverness.** This codebase will be read by developers under time pressure during active deployments.

**Test what matters.** Write tests for: incident correlation, escalation rules, health score calculation, offline sync conflict resolution. Don't write tests for trivial CRUD or UI appearance.

**Error messages must be actionable.** "Something went wrong" is not acceptable. The message must tell the user what to do next.

**No external runtime dependencies in the critical path.** SMS, WhatsApp, and push integrations must fail gracefully and log the failure without crashing the server.

---

## Development Setup

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

Seed login: phone `+917001000001`, event code `TEST01` (Command role)

---

## Pull Request Requirements

- Clear description of what changed and why
- Tests for any new logic
- Documentation updated if behavior changed
- Tested on a real mobile device if the change affects the operator PWA

---

## Opening Issues

A good issue: "During our dry run with 15 operators, the incident feed had no visual distinction between Level 3 and Level 4 incidents. Under pressure, the command team missed a Level 4 incident for 4 minutes. Proposed fix: distinct visual treatment for Level 4."

A bad issue: "The dashboard should be better."

---

## License

MIT. All contributions are made under the same license.
