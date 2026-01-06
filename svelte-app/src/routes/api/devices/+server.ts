import { json, type RequestEvent } from '@sveltejs/kit';
import { getDevicesForUser } from '$config/devices';

/**
 * GET /api/devices
 * Returns devices accessible to the current user based on their deviceAccess list
 */
export async function GET(event: RequestEvent) {
  try {
    const session = event.locals.session;
    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const devices = getDevicesForUser(userId);

    return json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
