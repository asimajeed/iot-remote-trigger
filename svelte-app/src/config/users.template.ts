/**
 * TEMPLATE - User configuration
 * Copy this to src/config/users.ts and customize
 * Or run: npm run config
 */

export interface UserConfig {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  deviceAccess: string[];
}

export const USERS: UserConfig[] = [
  {
    id: 'family-user',
    email: 'family@house.local',
    name: 'Family Account',
    passwordHash: '$2b$10$Q0ogaqs5vMzBf2hVNynANeuZXA.VLVBSVwTsso2qFMwf8KXxIO/tG', // family123
    deviceAccess: ['door-lock']
  },
  {
    id: 'personal-user',
    email: 'personal@house.local',
    name: 'Personal Account',
    passwordHash: '$2b$10$STdEgIvz5ayW1KnOW4411.dAGbtffYTkE1mzIKDHlhWabj/.BbSI.', // personal123
    deviceAccess: ['*']
  }
];

export function getUserByEmail(email: string): UserConfig | undefined {
  return USERS.find((u) => u.email === email);
}

export function getUserById(id: string): UserConfig | undefined {
  return USERS.find((u) => u.id === id);
}

export function userHasDeviceAccess(userId: string, deviceId: string): boolean {
  const user = getUserById(userId);
  if (!user) return false;
  return user.deviceAccess.includes(deviceId) || user.deviceAccess.includes('*');
}
