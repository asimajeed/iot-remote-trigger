# Config-Driven Smart Home Control

PWA for controlling smart home devices via MQTT with config-based permissions.

## 🚀 Quick Start

```bash
npm install
npm run config  # Interactive config manager
npm run dev
```

## 📋 Features

✅ Zero database - fully config-driven  
✅ User-based device permissions  
✅ Interactive config management script  
✅ PC power button with press/hold
✅ Pulse devices (gates, locks, etc.)  
✅ PWA with offline support  
✅ AWS IoT MQTT integration

## 🔧 Configuration

### Interactive Manager

```bash
npm run config
```

This launches an interactive CLI to:

- Add/edit/delete users
- Add/delete devices
- Manage device access per user
- Change passwords

### Manual Configuration

Edit `src/config/devices.ts` and `src/config/users.ts` directly.

**Note**: Config files are in `.gitignore` and will be auto-generated from templates on `npm install`.

## 👤 Default Accounts

| Email                  | Password      | Access           |
| ---------------------- | ------------- | ---------------- |
| `family@house.local`   | `family123`   | Main Gate only   |
| `personal@house.local` | `personal123` | All devices (\*) |

Change via `npm run config` or regenerate password hash:

```bash
node -e "console.log(require('bcryptjs').hashSync('new-password', 10))"
```

## 📱 Permission Model

Users have a `deviceAccess` array:

- `['*']` - Access to all devices
- `['device-id-1', 'device-id-2']` - Specific devices
- `[]` - No access

## 🌐 Deployment

### Vercel / Netlify / Cloudflare

1. Push to Git (configs are excluded)
2. Connect your repo
3. Set environment variables (see `.env.example`)
4. Deploy! Configs will auto-generate from templates

### Environment Variables

Required in `.env` (or deployment platform):

```bash
AUTH_SECRET=                    # openssl rand -base64 32
AWS_IOT_ENDPOINT=               # your-endpoint.iot.region.amazonaws.com
AWS_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
MQTT_CMD_TOPIC=home/pc/cmd
MQTT_STATUS_TOPIC=home/pc/status
MQTT_ACK_TOPIC=home/pc/ack
```

## 📝 Adding Devices

### Via Interactive Config

```bash
npm run config
# Choose option 6: Add device
```

### Manually

Add to `src/config/devices.ts`:

```typescript
{
  id: 'garage',
  name: 'Garage Door',
  type: 'gate',
  mqtt: {
    endpoint: env.AWS_IOT_ENDPOINT,
    region: env.AWS_REGION,
    cmdTopic: 'home/garage/cmd',
    ackTopic: 'home/garage/ack'
  },
  pulseDurationMs: 2000
}
```

Then grant access to users in `npm run config` or edit `deviceAccess` array.

## 🛠️ Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview build
npm run config       # Interactive config manager
npm run format       # Format code
npm run lint         # Lint code
```

## 🔐 Security

- Passwords stored as bcrypt hashes
- JWT sessions (30 days)
- AWS IoT SigV4 authentication
- Config files excluded from git

## 📦 Project Structure

```
src/
├── config/
│   ├── devices.template.ts    # Template (in git)
│   ├── users.template.ts      # Template (in git)
│   ├── devices.ts            # Actual config (gitignored)
│   └── users.ts              # Actual config (gitignored)
├── lib/
│   ├── auth.ts               # Authentication
│   ├── components/           # UI components
│   └── aws-iot-signer.ts     # MQTT signing
└── routes/
    ├── api/
    │   ├── devices/          # Device list API
    │   └── mqtt/             # MQTT control API
    └── +page.svelte          # Main UI

scripts/
├── config-manager.js         # Interactive config tool
└── setup-configs.sh          # Auto-generates configs
```

## 🎯 Migration from Multi-Tenant

See [walkthrough.md](../.gemini/antigravity/brain/56333b5c-418d-4b7a-8748-043ede8736a7/walkthrough.md) for complete migration documentation.

Git stash created: `git stash list` to view backup.
