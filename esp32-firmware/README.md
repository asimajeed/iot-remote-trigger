# ESP32 Firmware (PlatformIO + Arduino)

ESP32 firmware for AWS IoT connected power button controller using PlatformIO and Arduino framework.

## Prerequisites

- [PlatformIO](https://platformio.org/) installed
- ESP32 development board
- USB cable

## Quick Start

### 1. Install PlatformIO

```bash
# Using pip
pip install platformio

# Or install VS Code extension
# Search for "PlatformIO IDE" in VS Code extensions
```

### 2. Configure WiFi and AWS

Edit `include/config.h`:

```cpp
#define WIFI_SSID "YourSSID"
#define WIFI_PASSWORD "YourPassword"
#define AWS_IOT_ENDPOINT "xxxxx.iot.us-east-1.amazonaws.com"
```

### 3. Add Certificates

Copy your AWS IoT certificates to `certs/`:

```bash
cd certs
cp ~/Downloads/xxxxx-certificate.pem.crt device_cert.pem
cp ~/Downloads/xxxxx-private.pem.key device_key.pem
wget https://www.amazontrust.com/repository/AmazonRootCA1.pem -O root_ca.pem
```

### 4. Build and Upload

```bash
# Build
pio run

# Upload to ESP32
pio run --target upload

# Monitor serial output
pio device monitor
```

Or use VS Code PlatformIO extension buttons.

## Configuration

All settings in `include/config.h`:

- **WiFi**: SSID and password
- **AWS IoT**: Endpoint, port, thing name
- **MQTT Topics**: Command, status, acknowledgement
- **GPIO**: Power button pin (default: GPIO 2)
- **Heartbeat**: Interval in milliseconds (default: 5 minutes)

## Hardware Setup

Connect optocoupler to GPIO 2:

```
ESP32 GPIO 2 ──┬── 220Ω ──┬── LED+ (optocoupler)
               │          │
               └── GND ───┴── LED- (optocoupler)

PC Power Button ──── Collector/Emitter (optocoupler)
```

## Troubleshooting

**Build errors:**
```bash
pio pkg update
pio run --target clean
pio run
```

**Upload failed:**
- Check USB cable and port
- Press BOOT button on ESP32 during upload
- Try different baud rate in platformio.ini

**WiFi not connecting:**
- Verify SSID and password in config.h
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)

**MQTT connection failed:**
- Check certificates are correct
- Verify AWS IoT endpoint
- Ensure IoT policy is attached to certificate

## Serial Output

Expected output:
```
AWS IoT Power Button Starting...
GPIO initialized
Connecting to WiFi....
WiFi connected
IP: 192.168.1.100
Connecting to AWS IoT...connected
Published status: {"status":"online"}
Initialization complete
```

## Dependencies

- PubSubClient (MQTT client)
- ArduinoJson (JSON parsing)
- WiFiClientSecure (TLS support)

All dependencies are automatically installed by PlatformIO.
