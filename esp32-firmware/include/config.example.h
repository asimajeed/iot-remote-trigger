#ifndef CONFIG_H
#define CONFIG_H

// ------------------------------
// Device Type Configuration
// ------------------------------
// Uncomment ONE of the following:
#define DEVICE_TYPE_POWER_BUTTON    // PC Power Button (momentary press)
// #define DEVICE_TYPE_DOOR_LOCK    // Door Lock (pulse to unlock)

// ------------------------------
// AWS IoT Configuration
// ------------------------------
#define AWS_IOT_ENDPOINT "xxxxx.iot.us-east-1.amazonaws.com"
#define AWS_IOT_PORT 8883

// ------------------------------
// Device-Specific Settings
// ------------------------------
#ifdef DEVICE_TYPE_POWER_BUTTON
  #define THING_NAME "ESP32_PowerButton"
  #define MQTT_CMD_TOPIC "home/pc/cmd"
  #define MQTT_STATUS_TOPIC "home/pc/status"
  #define MQTT_ACK_TOPIC "home/pc/ack"
  #define CONTROL_GPIO 23
  #define DEFAULT_PULSE_MS 200
  // Power button uses OUTPUT HIGH for pressed, OUTPUT LOW for released
  #undef USE_FLOATING_INPUT
#endif

#ifdef DEVICE_TYPE_DOOR_LOCK
  #define THING_NAME "ESP32_DoorLock"
  #define MQTT_CMD_TOPIC "home/door/cmd"
  #define MQTT_STATUS_TOPIC "home/door/status"
  #define MQTT_ACK_TOPIC "home/door/ack"
  #define CONTROL_GPIO 23
  #define DEFAULT_PULSE_MS 500
  // Door lock uses INPUT (floating/Hi-Z) for ON, OUTPUT LOW for OFF
  #define USE_FLOATING_INPUT
#endif

// Backward compatibility
#define POWER_BUTTON_GPIO CONTROL_GPIO

#endif
