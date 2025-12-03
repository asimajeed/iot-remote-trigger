# PlatformIO Quick Reference

## Build Commands

```bash
# Build project
pio run

# Upload to ESP32
pio run --target upload

# Serial monitor
pio device monitor

# Build + Upload + Monitor
pio run --target upload && pio device monitor

# Clean build
pio run --target clean
```

## VS Code Shortcuts

- **Build**: Click ✓ (checkmark) in bottom toolbar
- **Upload**: Click → (arrow) in bottom toolbar
- **Monitor**: Click 🔌 (plug) in bottom toolbar
- **Clean**: Click 🗑️ (trash) in bottom toolbar

## Project Structure

```
esp32-firmware/
├── platformio.ini       # Project configuration
├── src/
│   └── main.cpp        # Main application (130 lines)
├── include/
│   └── config.h        # WiFi & AWS settings
└── certs/
    ├── root_ca.pem     # Amazon Root CA
    ├── device_cert.pem # Device certificate
    └── device_key.pem  # Private key
```

## Configuration Files

### platformio.ini
- Board type (esp32dev)
- Libraries (PubSubClient, ArduinoJson)
- Certificate embedding
- Serial monitor speed

### include/config.h
- WiFi credentials
- AWS IoT endpoint
- MQTT topics
- GPIO pin
- Heartbeat interval

## Dependencies

Auto-installed by PlatformIO:
- **PubSubClient** - MQTT client library
- **ArduinoJson** - JSON parsing
- **WiFiClientSecure** - Built-in TLS support

## Advantages over ESP-IDF

✅ Simpler setup (no ESP-IDF installation)  
✅ Familiar Arduino framework  
✅ VS Code integration  
✅ Automatic dependency management  
✅ Single main.cpp file (~130 lines)  
✅ Easy configuration (config.h)  
✅ Cross-platform (Windows, Mac, Linux)  

## First Time Setup

1. Install PlatformIO
2. Edit `include/config.h` with WiFi/AWS settings
3. Copy certificates to `certs/`
4. Run `pio run --target upload`
5. Done!
