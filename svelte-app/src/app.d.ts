// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: Session | null;
      user: User | null;
      userId?: string;
    }
    interface PageData {
      session: Session | null;
    }
    // interface PageState {}
    // interface Platform {}
  }
}

import type { Session, User } from '@auth/sveltekit';

declare module '@auth/core/types' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      scope?: 'family' | 'personal';
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    scope?: 'family' | 'personal';
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    scope?: 'family' | 'personal';
  }
}

export {};
