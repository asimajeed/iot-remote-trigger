import { json, type RequestEvent } from '@sveltejs/kit';
import mqtt from 'mqtt';
import { getDeviceById, canAccessDevice } from '$config/devices';
import { createMqttClient } from '$lib';

// Store last acknowledgment (for POST)
let lastAck: { status: string; timestamp: number } | null = null;

export async function POST(event: RequestEvent) {
  let client: mqtt.MqttClient | null = null;

  try {
    const session = await event.locals.auth?.();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { deviceId, action, duration } = await event.request.json();

    if (!deviceId) {
      return json({ error: 'Device ID is required' }, { status: 400 });
    }

    if (!['quick', 'press', 'release', 'pulse'].includes(action)) {
      return json({ error: 'Invalid action' }, { status: 400 });
    }

    // Check device access using userId
    if (!canAccessDevice(userId, deviceId)) {
      return json({ error: 'Access denied to this device' }, { status: 403 });
    }

    // Get device config
    const device = getDeviceById(deviceId);

    if (!device) {
      return json({ error: 'Device not found' }, { status: 404 });
    }

    // Create temporary client for this command only
    client = await createMqttClient(device.mqtt);

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
    const ackTopic = device.mqtt.ackTopic;
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
    const cmdTopic = device.mqtt.cmdTopic;
    const cmdPayload = JSON.stringify({
      cmd: action,
      duration: duration || device.pulseDurationMs || 200
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
export async function GET(event: RequestEvent) {
  let client: mqtt.MqttClient | null = null;

  try {
    const session = await event.locals.auth?.();
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const deviceId = event.url.searchParams.get('deviceId');

    if (!deviceId) {
      return json({ error: 'Device ID is required' }, { status: 400 });
    }

    // Check device access using userId
    if (!canAccessDevice(userId, deviceId)) {
      return json({ error: 'Access denied to this device' }, { status: 403 });
    }

    // Get device config
    const device = getDeviceById(deviceId);

    if (!device) {
      return json({ error: 'Device not found' }, { status: 404 });
    }
    // Create temporary client to read retained status
    client = await createMqttClient(device.mqtt);

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
    const statusTopic = device.mqtt.statusTopic;

    if (!statusTopic) {
      return json({
        connected: true,
        deviceStatus: 'unknown'
      });
    }

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
