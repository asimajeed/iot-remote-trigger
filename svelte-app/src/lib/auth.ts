import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import { env } from '$env/dynamic/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
  providers: [
    Credentials({
      name: 'House Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const authEmail = env.AUTH_EMAIL;
        const authPassword = env.AUTH_PASSWORD;

        if (!authEmail || !authPassword) {
          throw new Error('Server configuration error');
        }

        if (credentials?.email === authEmail && credentials?.password === authPassword) {
          return {
            id: 'house-user',
            email: authEmail,
            name: 'House'
          };
        }

        return null;
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  secret: env.AUTH_SECRET,
  trustHost: true
});
