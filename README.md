# SmartHome IoT Platform

<div align="center">

**A scalable, multi-tenant smart home automation platform built on AWS IoT Core**

[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)](https://kit.svelte.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS IoT](https://img.shields.io/badge/AWS_IoT-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/iot/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Control all your ESP32-powered smart devices from anywhere. Built for makers, scalable for the future.

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Roadmap](#-roadmap)

</div>

A production-ready smart home platform that lets you control ESP32 devices (switches, sensors, lights, locks, etc.) through a beautiful web interface. Built with:

- **Multi-tenancy**: Multiple users, multiple homes, unlimited devices
- **Role-based access**: Share homes with family/roommates with granular permissions
- **AWS IoT Core**: Enterprise-grade MQTT messaging with global availability
- **Real-time control**: Sub-second response times for device commands
- **Progressive Web App**: Install on any device, works offline

Originally built to remotely power on a PC, now evolved into a full smart home hub.

---

## ✨ Features

### Current Capabilities

- 🏘️ **Multi-Home Management** - Organize devices by location (home, office, vacation property)
- 👥 **User & Access Control** - Invite members with Owner/Admin/Member roles
- 🔐 **Private Devices** - Keep personal devices separate from shared homes
- ⚡ **Real-time MQTT Control** - Send commands and receive acknowledgments instantly
- 📱 **Responsive PWA** - Works on desktop, tablet, and mobile
- 🌙 **Dark Mode** - Easy on the eyes, day or night
- 🔒 **Secure by Default** - JWT auth, bcrypt passwords, HTTPS required

### Supported Device Types

- **Power Switches** - Remote PC power control, outlet switches
- **Lights** - Smart bulbs, LED strips
- **Locks** - Door locks, smart deadbolts
- **Thermostats** - Temperature control
- **Cameras** - Security camera triggers
- **Custom** - Easily extendable for any ESP32 project

---

## 🚀 Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL database (or Supabase free tier)
- AWS Account (IoT Core free tier is generous)
- ESP32 device

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/smarthome-iot-platform.git
cd smarthome-iot-platform/svelte-app
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Auth (generate with: openssl rand -base64 32)
AUTH_SECRET=your-secret-key

# AWS IoT Core
AWS_IOT_ENDPOINT=xxxxx.iot.region.amazonaws.com
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### 3. Setup Database

```bash
npm run db:push  # Create tables
npm run db:seed  # Optional: seed with example data
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` and create your account!

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     SvelteKit App                       │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │   UI Layer  │  │  API Routes  │  │ Auth/Hooks    │   │
│  │  (Svelte 5) │  │ (TypeScript) │  │  (Auth.js)    │   │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘   │
│         │                │                  │           │
│         └────────────────┴──────────────────┘           │
│                          │                              │
│                          ▼                              │
│              ┌───────────────────────┐                  │
│              │   Drizzle ORM Layer   │                  │
│              └───────────┬───────────┘                  │
└──────────────────────────┼──────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                 │
          ▼                                 ▼
   ┌─────────────┐                  ┌─────────────┐
   │ PostgreSQL  │                  │  AWS IoT    │
   │  Database   │                  │    Core     │
   └─────────────┘                  └──────┬──────┘
                                           │
                                           │ MQTT/WSS
                                           │
                                    ┌──────▼──────┐
                                    │ESP32 Devices│
                                    └─────────────┘
```

### Key Components

- **Frontend**: SvelteKit with Svelte 5 Runes (modern React-like DX)
- **Backend**: SvelteKit API routes (type-safe, collocated with UI)
- **Database**: PostgreSQL with Drizzle ORM (type-safe queries)
- **Auth**: Auth.js (JWT sessions, bcrypt passwords)
- **IoT**: MQTT over WebSockets to AWS IoT Core
- **Hosting**: Deploy anywhere (Vercel, Netlify, Cloudflare, VPS)

---

## 🛠️ ESP32 Firmware

Basic example for a power button device:

```cpp
// See esp32-firmware/ directory for complete examples
#include <WiFi.h>
#include <PubSubClient.h>

const char* mqttServer = "xxxxx.iot.amazonaws.com";
const char* cmdTopic = "home/device/cmd";
const char* ackTopic = "home/device/ack";

void callback(char* topic, byte* payload, unsigned int length) {
  // Parse JSON command
  // Execute action (toggle relay, etc.)
  // Publish acknowledgment
}

void setup() {
  // Connect WiFi & MQTT
  // Subscribe to command topic
}
```

Full examples included for:

- Power switches
- Smart outlets
- Door locks
- Temperature sensors

---

## 🗺️ Roadmap

### Phase 1: Core Platform ✅

- [x] Multi-tenant architecture
- [x] Role-based access control
- [x] Real-time device control
- [x] Responsive PWA

### Next Steps

- [ ] **Automations & Schedules** - Time-based and trigger-based rules
- [ ] **Device Groups** - Control multiple devices simultaneously
- [ ] **Scenes** - Save and recall device states
- [ ] **Device Health Monitoring** - Uptime tracking, offline alerts
- [ ] **Mobile Apps** - Native iOS/Android apps (Capacitor)

### Future Considerations

- **Home Assistant Integration** - MQTT discovery for HA users
- **Voice Control** - Alexa/Google Home (via HA or direct)
- **Local MQTT Option** - Self-hosted alternative to AWS IoT
- **Advanced Analytics** - Energy monitoring, usage patterns
- **Ecosystem Expansion** - Plugin system, community integrations

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with amazing open-source tools:

- [SvelteKit](https://kit.svelte.dev/) - The web framework
- [Drizzle ORM](https://orm.drizzle.team/) - Database toolkit
- [Auth.js](https://authjs.dev/) - Authentication
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [AWS IoT Core](https://aws.amazon.com/iot-core/) - MQTT infrastructure
