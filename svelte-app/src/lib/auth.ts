import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import { env } from '$env/dynamic/private';
import { getUserByEmail } from '$config/users';
import bcrypt from 'bcryptjs';

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [
    Credentials({
      name: 'Email Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Get user from static config
        const user = getUserByEmail(credentials.email as string);

        if (!user) {
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      }
    })
  ],
  pages: {
    signIn: '/'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
      }
      return session;
    }
  },
  secret: env.AUTH_SECRET,
  trustHost: true,
  logger: {
    error(code: any) {
      // Only log actual errors, not failed login attempts
      const errorName = code?.name || String(code);
      if (errorName !== 'CredentialsSignin') {
        console.error(code);
      }
    },
    warn() {},
    debug() {}
  }
});
