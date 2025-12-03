#ifndef CONFIG_H
#define CONFIG_H

#define AWS_IOT_ENDPOINT "xxxxx.iot.us-east-1.amazonaws.com"
#define AWS_IOT_PORT 8883
#define THING_NAME "ESP32_PowerButton"

#define MQTT_CMD_TOPIC "home/pc/cmd"
#define MQTT_STATUS_TOPIC "home/pc/status"
#define MQTT_ACK_TOPIC "home/pc/ack"

#define POWER_BUTTON_GPIO 2

#define HEARTBEAT_INTERVAL 300000

#endif
