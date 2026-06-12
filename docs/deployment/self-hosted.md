# Self-Hosted Deployment Guide

## Requirements

- Ubuntu 22.04 LTS VPS (minimum 2 vCPU, 2GB RAM, 20GB SSD)
- Domain name pointing to your server
- Twilio account (free tier works)

---

## Step 1: Server Setup

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt install nginx certbot python3-certbot-nginx -y
```

Log out and back in for docker group to take effect.

---

## Step 2: Clone and Configure

```bash
git clone https://github.com/YOUR_USERNAME/eventflow
cd eventflow
cp .env.example .env
nano .env
```

Fill in: `JWT_SECRET` (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`), your Twilio credentials, and `PUBLIC_URL=https://yourdomain.com`.

---

## Step 3: Deploy

```bash
docker compose up -d
docker compose exec api npm run db:migrate
docker compose ps   # all services should show "Up"
curl http://localhost:3000/health   # should return {"status":"ok"}
```

---

## Step 4: Nginx Config

```nginx
# /etc/nginx/sites-available/eventflow
server {
    server_name yourdomain.com;

    location /api       { proxy_pass http://localhost:3000; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
    location /socket.io { proxy_pass http://localhost:3000; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
    location /webhooks  { proxy_pass http://localhost:3000; }
    location /op        { proxy_pass http://localhost:4001; }
    location /          { proxy_pass http://localhost:4000; }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/eventflow /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 5: Configure Twilio Webhook

In Twilio console: set SMS webhook URL to `https://yourdomain.com/webhooks/sms-inbound`, method POST.

---

## Step 6: Create Your First Event

```bash
curl -X POST https://yourdomain.com/api/events \
  -H "Content-Type: application/json" \
  -d '{"name":"My Event","venue":"Venue Name","event_date":"2025-12-01T09:00:00Z","capacity":10000}'
```

Returns an event code. Share it with your operators.

---

## Pre-Event Verification Checklist

- [ ] `curl https://yourdomain.com/health` returns `{"status":"ok"}`
- [ ] Login works on operator phone: open `https://yourdomain.com/op`, enter phone + event code
- [ ] Submit a test incident: appears in command dashboard within 3 seconds
- [ ] Send test broadcast: appears in operator app and public feed
- [ ] Test SMS: send `EF GATE-N OTHER LOW` from operator phone, appears in dashboard
- [ ] Disable WiFi on one operator device, submit report, re-enable WiFi, verify sync
