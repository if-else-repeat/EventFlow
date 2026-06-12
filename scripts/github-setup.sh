#!/bin/bash
# EventFlow — GitHub Setup Script
# Run this once from the eventflow/ directory
# Requires: git, gh (GitHub CLI)

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  EventFlow — GitHub Repository Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check prerequisites
if ! command -v git &>/dev/null; then echo "✗ git not found. Install git first."; exit 1; fi
if ! command -v gh  &>/dev/null; then echo "✗ gh not found. Install GitHub CLI: https://cli.github.com"; exit 1; fi

# Check auth
if ! gh auth status &>/dev/null; then
  echo "Authenticating with GitHub..."
  gh auth login
fi

USERNAME=$(gh api user --jq .login)
echo "✓ Authenticated as: $USERNAME"

# Initialize git
if [ ! -d ".git" ]; then
  git init
  echo "✓ Git initialized"
fi

# Create .gitignore if missing
if [ ! -f ".gitignore" ]; then
  echo "node_modules/\n.env\ndist/\nbuild/\n.DS_Store\n*.log\ncoverage/" > .gitignore
fi

# Initial commit
git add .
git commit -m "feat: initial EventFlow implementation

- Complete API with incidents, broadcasts, zones, timeline, feed
- Escalation engine with auto-escalation timers
- Health score algorithm (severity × age × assignment)
- WebSocket real-time layer via Socket.io
- Operator PWA (React, offline-capable)
- Command Dashboard (React, real-time)
- SMS inbound parser (Twilio webhook)
- PostgreSQL schema with full indexing
- Docker Compose for development and production
- Seed data for local testing

See README.md for setup instructions."

# Create GitHub repo
echo ""
echo "Creating GitHub repository..."
gh repo create eventflow \
  --public \
  --description "An open-source coordination operating system for temporary high-density environments" \
  --homepage "" \
  --push \
  --source=. \
  --remote=origin

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Repository created successfully"
echo "  → https://github.com/$USERNAME/eventflow"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "  1. Add topics on GitHub: event-management, crowd-safety, open-source, nodejs, react, pwa"
echo "  2. Add a description screenshot (run the app, screenshot the dashboard)"
echo "  3. Pin the repo on your GitHub profile"
echo "  4. Open the 10 seed issues (see IMPLEMENTATION_PLAN.md)"
echo ""
