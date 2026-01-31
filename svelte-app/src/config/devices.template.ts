import { env } from '$env/dynamic/private';

/**
 * TEMPLATE - Device configuration
 * Copy this to src/config/devices.ts and customize
 * Or run: npm run config
 */

export interface DeviceConfig {
  id: string;
  name: string;
  type: 'power_button' | 'gate' | 'lock' | 'generic_switch';
  mqtt: {
    endpoint: string;
    region: string;
    cmdTopic: string;
    ackTopic: string;
    statusTopic?: string;
  };
  pulseDurationMs?: number;
}

export const DEVICES: DeviceConfig[] = [
  {
    id: 'pc-power',
    name: 'PC Power Button',
    type: 'power_button',
    mqtt: {
      endpoint: env.AWS_IOT_ENDPOINT || '',
      region: env.AWS_REGION || 'ap-southeast-1',
      cmdTopic: env.MQTT_CMD_TOPIC || 'home/pc/cmd',
      ackTopic: env.MQTT_ACK_TOPIC || 'home/pc/ack',
      statusTopic: env.MQTT_STATUS_TOPIC || 'home/pc/status'
    }
  },
  {
    id: 'door-lock',
    name: 'Door Lock',
    type: 'lock',
    mqtt: {
      endpoint: env.AWS_IOT_ENDPOINT || '',
      region: env.AWS_REGION || 'ap-southeast-1',
      cmdTopic: 'home/door/cmd',
      ackTopic: 'home/door/ack',
      statusTopic: 'home/door/status'
    },
    pulseDurationMs: 1000
  }
];

export function getDevicesForUser(userId: string): DeviceConfig[] {
  const { getUserById } = require('./users');
  const user = getUserById(userId);
  if (!user) return [];
  if (user.deviceAccess.includes('*')) return DEVICES;
  return DEVICES.filter((d) => user.deviceAccess.includes(d.id));
}

export function getDeviceById(deviceId: string): DeviceConfig | undefined {
  return DEVICES.find((d) => d.id === deviceId);
}

export function canAccessDevice(userId: string, deviceId: string): boolean {
  const { userHasDeviceAccess } = require('./users');
  return userHasDeviceAccess(userId, deviceId);
}
