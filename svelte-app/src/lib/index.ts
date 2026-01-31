// place files you want to import through the `$lib` alias in this folder.

import { env } from "$env/dynamic/private";
import mqtt from "mqtt";
import { getSignedIoTWebSocketUrl } from "./aws-iot-signer";

export async function createMqttClient(mqttConfig: any): Promise<mqtt.MqttClient> {
  const accessKey = env.AWS_ACCESS_KEY_ID;
  const secretKey = env.AWS_SECRET_ACCESS_KEY;

  if (!accessKey || !secretKey) {
    throw new Error('Missing AWS credentials');
  }

  const signedUrl = await getSignedIoTWebSocketUrl({
    endpoint: mqttConfig.endpoint,
    region: mqttConfig.region,
    accessKeyId: accessKey,
    secretAccessKey: secretKey
  });

  return mqtt.connect(signedUrl, {
    protocol: 'wss',
    keepalive: 30,
    reconnectPeriod: 0
  });
}