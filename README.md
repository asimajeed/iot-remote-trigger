# AWS ESP32 Power Button

Remote PC power control system using ESP32, AWS IoT Core, and Android app.

## Overview

Control your PC's power button remotely from anywhere using:
- **ESP32** device with PlatformIO + Arduino framework
- **AWS IoT Core** as secure MQTT broker
- **Android app** for remote control

## Features

✅ Secure communication (TLS encryption)  
✅ No port forwarding required  
✅ Simple one-button interface  
✅ Automatic reconnection  
✅ Heartbeat monitoring  
✅ Minimal configuration  

## Quick Start

### 1. AWS IoT Setup
Follow [AWS Setup Guide](docs/AWS_SETUP.md) to:
- Create IoT Thing
- Generate certificates
- Configure policies

### 2. ESP32 Firmware
Follow [ESP32 Setup Guide](docs/ESP32_SETUP.md) to:
- Install PlatformIO
- Configure WiFi and AWS settings
- Flash firmware to ESP32
- Connect optocoupler to PC

### 3. Android App
Follow [Android Setup Guide](docs/ANDROID_SETUP.md) to:
- Configure AWS credentials
- Build and install APK
- Control your PC remotely

## Hardware Requirements

- ESP32 development board
- Optocoupler (PC817 or similar)
- 220Ω resistor
- Jumper wires
- USB cable for programming

## Project Structure

```
.
├── esp32-firmware/          # PlatformIO project
│   ├── src/                # Source code (main.cpp)
│   ├── include/            # Headers (config.h)
│   ├── certs/              # AWS IoT certificates
│   └── platformio.ini      # PlatformIO config
├── android-app/            # Android Studio project
│   └── app/
│       └── src/main/
│           └── java/       # Kotlin source
└── README.md
```

## Architecture

```
Android App ←→ AWS IoT Core ←→ ESP32 Device
  (MQTT/WSS)    (MQTT Broker)    (MQTT/TLS)
```

See [Architecture Documentation](docs/ARCHITECTURE.md) for details.

## MQTT Topics

- `home/pc/cmd` - Commands from app to ESP32
- `home/pc/status` - Status and heartbeat from ESP32
- `home/pc/ack` - Command acknowledgements from ESP32

## Example Messages

**Power Command:**
```json
{"cmd":"power","duration":200}
```

**Status:**
```json
{"status":"online"}
```

## Security

- ESP32: X.509 certificate authentication
- Android: AWS IAM credentials
- All traffic encrypted with TLS
- No public IP exposure

## License

MIT License - feel free to modify and use for your projects.

## Contributing

This is a personal project, but suggestions and improvements are welcome!
