import { json, type RequestEvent } from '@sveltejs/kit';
import mqtt from 'mqtt';
import { getSignedIoTWebSocketUrl } from '$lib/aws-iot-signer';
import { env } from '$env/dynamic/private';

// Store last acknowledgment (for POST)
let lastAck: { status: string; timestamp: number } | null = null;

async function createMqttClient(): Promise<mqtt.MqttClient> {
  const endpoint = env.AWS_IOT_ENDPOINT;
  const region = env.AWS_REGION || 'ap-southeast-1';
  const accessKey = env.AWS_ACCESS_KEY_ID;
  const secretKey = env.AWS_SECRET_ACCESS_KEY;

  if (!endpoint || !accessKey || !secretKey || !region) {
    throw new Error('Missing AWS configuration');
  }

  const signedUrl = await getSignedIoTWebSocketUrl({
    endpoint,
    region,
    accessKeyId: accessKey,
    secretAccessKey: secretKey
  });

  return mqtt.connect(signedUrl, {
    protocol: 'wss',
    keepalive: 30,
    reconnectPeriod: 0
  });
}

export async function POST({ request, locals }: RequestEvent) {
  let client: mqtt.MqttClient | null = null;

  try {
    const session = await locals.auth?.();
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, duration } = await request.json();

    if (!['quick', 'press', 'release'].includes(action)) {
      return json({ error: 'Invalid action' }, { status: 400 });
    }

    // Create temporary client for this command only
    client = await createMqttClient();

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      client!.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      client!.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Subscribe to ack topic
    const ackTopic = env.MQTT_ACK_TOPIC || 'home/pc/ack';
    await new Promise<void>((resolve, reject) => {
      client!.subscribe(ackTopic, { qos: 1 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Listen for acknowledgment
    lastAck = null;
    client.on('message', (topic, payload) => {
      if (topic === ackTopic) {
        try {
          const message = JSON.parse(payload.toString());
          lastAck = {
            status: message.status,
            timestamp: Date.now()
          };
        } catch (parseErr) {
          console.error('Message parse error:', parseErr);
        }
      }
    });

    // Publish command
    const cmdTopic = env.MQTT_CMD_TOPIC || 'home/pc/cmd';
    const cmdPayload = JSON.stringify({
      cmd: action,
      duration: duration || 200
    });

    await new Promise<void>((resolve, reject) => {
      client!.publish(cmdTopic, cmdPayload, { qos: 1 }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const ackTimeout = action === 'quick' ? (duration || 200) + 1000 : 2000;
    const ack = await new Promise<{ status: string } | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), ackTimeout);

      const checkAck = setInterval(() => {
        if (lastAck) {
          clearTimeout(timeout);
          clearInterval(checkAck);
          resolve(lastAck);
        }
      }, 25);
    });

    return json({
      success: true,
      ack: ack?.status || 'timeout',
      duration: action === 'quick' ? duration : undefined
    });
  } catch (error) {
    console.error('MQTT error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    // Always disconnect to save AWS minutes
    if (client) {
      client.end(true);
    }
  }
}

// GET endpoint - reads retained LWT status
export async function GET({ locals }: RequestEvent) {
  let client: mqtt.MqttClient | null = null;

  try {
    const session = await locals.auth?.();
    if (!session?.user) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create temporary client to read retained status
    client = await createMqttClient();

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
      client!.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });
      client!.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Subscribe to status topic (will receive retained message)
    const statusTopic = env.MQTT_STATUS_TOPIC || 'home/pc/status';

    const status = await new Promise<'online' | 'offline'>((resolve) => {
      const timeout = setTimeout(() => resolve('offline'), 2000);

      client!.on('message', (topic, payload) => {
        if (topic === statusTopic) {
          try {
            const message = JSON.parse(payload.toString());
            clearTimeout(timeout);
            resolve(message.status === 'online' ? 'online' : 'offline');
          } catch {
            clearTimeout(timeout);
            resolve('offline');
          }
        }
      });

      client!.subscribe(statusTopic, { qos: 1 }, (err) => {
        if (err) {
          clearTimeout(timeout);
          resolve('offline');
        }
      });
    });

    return json({
      connected: true,
      deviceStatus: status
    });
  } catch (error) {
    return json({
      connected: false,
      deviceStatus: 'offline'
    });
  } finally {
    // Always disconnect to save AWS minutes
    if (client) {
      client.end(true);
    }
  }
}
