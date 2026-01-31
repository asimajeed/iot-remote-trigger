// src/routes/path/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, setHeaders }) => {
  setHeaders({
    'Cache-Control': 'private, max-age=604800'
  });
  try {
    const devicesRes = await fetch('/api/devices');

    if (devicesRes.ok) {
      const devices = await devicesRes.json();

      const devicesWithStatus = await Promise.all(
        devices.map(async (device: any) => {
          try {
            const statusRes = await fetch(`/api/mqtt?deviceId=${device.id}`);
            if (statusRes.ok) {
              const status = await statusRes.json();
              return { ...device, status };
            }
          } catch (error) {
            console.error(`Failed to fetch status for device ${device.id}:`, error);
          }
          // Default status if fetch fails
          return {
            ...device,
            status: { connected: false, deviceStatus: 'unknown' }
          };
        })
      );

      return { devices: devicesWithStatus };
    } else {
      const error = await devicesRes.text();
      console.error('Failed to load devices:', error);
    }
  } catch (error) {
    console.error('Failed to load devices:', error);
  }
  return { devices: [] };
};
