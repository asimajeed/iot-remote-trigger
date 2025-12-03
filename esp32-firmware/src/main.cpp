#include <WiFiManager.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "config.h"

extern const char root_ca[] asm("_binary_certs_root_ca_pem_start");
extern const char device_cert[] asm("_binary_certs_device_cert_pem_start");
extern const char device_key[] asm("_binary_certs_device_key_pem_start");

WiFiClientSecure wifiClient;
PubSubClient mqttClient(wifiClient);

WiFiManager wm;

unsigned long lastHeartbeat = 0;

// ------------------------------
// GPIO
// ------------------------------
void setupGPIO() {
  pinMode(POWER_BUTTON_GPIO, OUTPUT);
  digitalWrite(POWER_BUTTON_GPIO, LOW);
  Serial.println("GPIO initialized");
}

void togglePowerButton(uint32_t duration) {
  Serial.printf("Toggling power button for %lu ms\n", duration);
  digitalWrite(POWER_BUTTON_GPIO, HIGH);
  delay(duration);
  digitalWrite(POWER_BUTTON_GPIO, LOW);
  Serial.println("Power button toggle complete");
}

// ------------------------------
// WiFi Setup (WiFiManager)
// ------------------------------
void setupWiFi() {
  Serial.println("Starting WiFiManager...");

  // Optional: custom AP name
  wm.setConfigPortalTimeout(180);  // auto-close after 3 min

  if (!wm.autoConnect("PowerBtnConfigAP")) {
    Serial.println("WiFiManager failed. Restarting...");
    delay(3000);
    ESP.restart();
  }

  Serial.println("WiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
}

// ------------------------------
// MQTT
// ------------------------------
void publishStatus(const char* message) {
  mqttClient.publish(MQTT_STATUS_TOPIC, message, true);
  Serial.printf("Published status: %s\n", message);
}

void publishAck(const char* message) {
  mqttClient.publish(MQTT_ACK_TOPIC, message);
  Serial.printf("Published ack: %s\n", message);
}

void handleCommand(const char* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.println("JSON parse error");
    publishAck("{\"status\":\"invalid_command\"}");
    return;
  }
  
  const char* cmd = doc["cmd"];
  uint32_t duration = doc["duration"] | 200;
  
  if (cmd && strcmp(cmd, "power") == 0) {
    togglePowerButton(duration);
    publishAck("{\"status\":\"executed\"}");
  } else {
    publishAck("{\"status\":\"invalid_command\"}");
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.printf("Message on %s: ", topic);
  Serial.write(payload, length);
  Serial.println();
  
  if (strcmp(topic, MQTT_CMD_TOPIC) == 0) {
    handleCommand((const char*)payload, length);
  }
}

void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to AWS IoT...");
    
    String lwt = "{\"status\":\"offline\"}";
    if (mqttClient.connect(THING_NAME, NULL, NULL, MQTT_STATUS_TOPIC, 1, true, lwt.c_str())) {
      Serial.println("connected");
      mqttClient.subscribe(MQTT_CMD_TOPIC, 1);
      publishStatus("{\"status\":\"online\"}");
    } else {
      Serial.printf("failed, rc=%d, retrying in 5s\n", mqttClient.state());
      delay(5000);
    }
  }
}
void setupMQTT() {
  wifiClient.setCACert(root_ca);
  wifiClient.setCertificate(device_cert);
  wifiClient.setPrivateKey(device_key);
  
  mqttClient.setServer(AWS_IOT_ENDPOINT, AWS_IOT_PORT);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(512);
  
  connectMQTT();
}

// ------------------------------
// SETUP & LOOP
// ------------------------------
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\nAWS IoT Power Button Starting...");

  setupGPIO();
  setupWiFi();
  setupMQTT();

  Serial.println("Initialization complete");
}

void loop() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }

  mqttClient.loop();
  
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
    publishStatus("{\"status\":\"heartbeat\"}");
    lastHeartbeat = millis();
  }
}
