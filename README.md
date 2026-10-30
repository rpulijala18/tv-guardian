# TV GUARDIAN
> **"Smart Screen Time. Safer Childhood."**

A private, production-quality smart-home parental control application tailored for **Sony Bravia Smart TVs** (Android TV / Google TV). TV Guardian allows parents to enforce daily screen-time limits, schedule internet blackouts (morning school prep, evening homework, bedtime), and manually block or unblock television access with **hardware-level verification**.

---

## 🚀 Live Application Links

- **Local Live Web Dashboard**: [http://localhost:5173/](http://localhost:5173/)
- **Network Mobile Access**: `http://<your-lan-ip>:5173/` (e.g. `http://192.168.0.4:5173/`)
- **Backend API & WebSocket Server**: [http://localhost:3001/](http://localhost:3001/) (Health: [http://localhost:3001/health](http://localhost:3001/health))
- **Local Network Controller**: Connected via Outbound WebSocket (`ws://localhost:3001/agent-ws`)

---

## 🛡️ Architecture & Security Model

```
 ┌────────────────────────────────────────────────────────┐
 │       TV GUARDIAN CLOUD / VERCEL DASHBOARD            │
 │   React 18 + Vite + Tailwind + Recharts + Supabase Auth│
 └─────────────────────────┬──────────────────────────────┘
                           │ Authenticated REST / JWT
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │           TV GUARDIAN API & SCHEDULER SERVER           │
 │      Node.js + Express + TypeScript + PostgreSQL RLS   │
 └─────────────────────────▲──────────────────────────────┘
                           │
             Outbound WebSocket Channel (Port 3001 / WSS)
             No inbound router ports required!
                           │
 ┌─────────────────────────┴──────────────────────────────┐
 │     HOME LOCAL NETWORK CONTROLLER (AGENT)              │
 │  Runs on Raspberry Pi / Home Server / Windows PC       │
 └─────────────┬──────────────────────────┬───────────────┘
               │                          │
   Hardware Router API / SSH   Sony Bravia REST / IP Control
 (OpenWrt / AsusWRT / UniFi)      (JSON-RPC / PSK Header)
               │                          │
               ▼                          ▼
 ┌───────────────────────────┐ ┌──────────────────────────┐
 │  HOME ROUTER FIREWALL     │ │  SONY BRAVIA SMART TV    │
 │  Targeted MAC Packet Drop │ │  Power Telemetry & App   │
 └───────────────────────────┘ └──────────────────────────┘
```

### Zero-Simulation Guarantee
A frontend button never simulates blocking. TV Guardian requires two-way verification:
1. Administrator requests a block or schedule triggers cutoff.
2. Cloud dispatches the action to the Home Local Controller via secure WebSocket.
3. Controller instructs the router hardware adapter to enforce a MAC-address forward drop.
4. Controller executes active network probes (ICMP ping & firewall table inspection).
5. Only when verification returns `BLOCKED`, the status is confirmed on the dashboard.

---

## 📺 Features

1. **Dashboard**:
   - Real-time TV Device Status (IP, MAC, Online/Offline, Power Active vs Standby).
   - Screen Time Today circular progress with countdown to limit.
   - Quick Controls: Instant Block, Instant Unblock, Pause 30m, Pause 1h, Grant +30m.
   - Recharts Analytics: 7-day daily bar chart, hourly peak activity heat map.
   - Live Controller Status badge and connection telemetry.

2. **Device Management**:
   - Add and configure Sony Bravia Smart TVs.
   - Local Subnet ARP & SSDP Discovery to auto-detect Sony TVs.
   - Sony Bravia Pre-Shared Key (PSK) authentication.
   - One-click Sony Bravia REST API capability tester.

3. **Daily Screen Time Quotas**:
   - Presets: 30m, 1h, 1.5h, 2h (Default), 3h, 4h, and custom duration slider.
   - Rollover and resets at midnight in **Asia/Kolkata (IST)**.
   - Reliable activity measurement: TV power state + router throughput (&gt;50kbps).

4. **Automated Weekly Schedules**:
   - Independent timetable for all 7 weekdays.
   - School Week and Strict Exam presets.
   - Morning restrictions (06:00 – 09:00).
   - Evening study restrictions (17:00 – 18:30).
   - Bedtime curfew (21:00 default).

5. **Analytics & Audits**:
   - Daily, Weekly, and Monthly viewing duration breakdown.
   - Violation counter and automatic hardware block counter.
   - CSV export formatted with Asia/Kolkata timestamps.

6. **In-App Notifications**:
   - Alerts for 75% screen time warnings, 100% cutoff, block verification, and agent status.

---

## 🔌 Hardware Router Adapters

The local agent features an extensible adapter architecture:

| Adapter | Description | Mechanism |
|---|---|---|
| **Mock Router** | Development & Testing | Simulates network latency & verified packet drop |
| **OpenWrt / LEDE** | OpenWrt Linux Routers | `nftables` / `iptables -I FORWARD -m mac --mac-source <MAC> -j DROP` |
| **AsusWRT / Merlin** | Asus Home Gateways | NVRAM Parental Control Filter & iptables forward chain |
| **Ubiquiti UniFi** | UniFi Dream Machine / APs | UniFi Network Controller REST Client Block API |
| **TP-Link** | Omada & Wireless Routers | Access Control & IP/MAC Deny Binding |
| **ARP Guard** | Generic ISP Locked Gateways | Autonomous LAN gateway isolation without router admin login |

---

## 🛠️ Local Agent Installation Guide

The local agent runs 24/7 on your home network on a Raspberry Pi, mini PC, or Windows machine.

### Windows Setup
```powershell
# 1. Clone repository
git clone <your-repo>
cd tv-guardian/agent

# 2. Configure environment
copy .env.example .env
# Set BACKEND_WS_URL, AGENT_AUTH_TOKEN, TARGET_TV_MAC, and ROUTER_ADAPTER_TYPE in .env

# 3. Install & Start
pnpm install
pnpm build
node dist/agent.js
```

### Linux / Raspberry Pi Systemd Service
```bash
# 1. Install Node.js 20+
sudo apt update && sudo apt install -y nodejs npm
sudo npm install -g pnpm

# 2. Install agent dependencies
cd /opt/tv-guardian/agent
pnpm install && pnpm build

# 3. Create systemd service
sudo nano /etc/systemd/system/tv-guardian-agent.service
```

```ini
[Unit]
Description=TV Guardian Local Network Controller
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/opt/tv-guardian/agent
ExecStart=/usr/bin/node /opt/tv-guardian/agent/dist/agent.js
Restart=always
RestartSec=10
EnvironmentFile=/opt/tv-guardian/agent/.env

[Install]
WantedBy=multi-user.target
```

```bash
# 4. Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable --now tv-guardian-agent
sudo journalctl -u tv-guardian-agent -f
```

---

## ☁️ Vercel Deployment

1. Fork or push this repository to GitHub.
2. In Vercel, click **Add New Project** and select the repository.
3. Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
4. Set Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key
5. Click **Deploy**. Vercel will output your production live URL.

---

## 🔒 Security & Privacy Documentation

- **Single Owner Policy**: Registration is closed by default. Only the authorized parent administrator can provision devices.
- **Supabase Row Level Security (RLS)**: Enforced on all tables (`profiles`, `devices`, `screen_time`, `parental_settings`, `schedules`, `device_actions`, `notifications`).
- **Encrypted Local Storage**: Pre-Shared Keys and passwords are never displayed in frontend logs.
- **Outbound Agent Security**: The local agent only opens outbound connections to the cloud backend. No inbound ports need to be opened on your home router.

