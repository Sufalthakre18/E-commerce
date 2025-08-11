import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { fetchWrapper } from '@/lib/api/fetchWrapper';
import { generateToken } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error('Email is required');
        }
        try {
          if (credentials?.otp) {
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/auth/otp/verify`, {
              method: 'POST',
              body: JSON.stringify({
                email: credentials.email,
                otp: credentials.otp,
              }),
            });
            if (!response.success) {
              throw new Error(response.message || 'OTP verification failed');
            }
            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              role: response.user.roleId === '4954a96d-6b18-47af-802d-1f76ba029441' ? 'CUSTOMER' : 'ADMIN',
              accessToken: response.token,
            };
          } else if (credentials?.password) {
            const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
              method: 'POST',
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            });
            if (!response.success) {
              throw new Error(response.message || 'Login failed');
            }
            return {
              id: response.user.id,
              email: response.user.email,
              name: response.user.name,
              role: response.user.roleId === '4954a96d-6b18-47af-802d-1f76ba029441' ? 'CUSTOMER' : 'ADMIN',
              accessToken: response.token,
            };
          } else {
            throw new Error('Password or OTP required');
          }
        } catch (error: any) {
          console.error('Authorize error:', error.message);
          throw new Error(error.message || 'Authentication failed');
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 1 day
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
        token.accessToken = user.accessToken || generateToken({
          id: user.id,
          email: user.email ?? '',
          role: user.role,
        });
      }
      if (account?.provider === 'google') {
        try {
          const response = await fetchWrapper(`${process.env.NEXT_PUBLIC_API_URL}/auth/google`, {
            method: 'POST',
            body: JSON.stringify({
              email: token.email,
              name: token.name,
              googleId: account.providerAccountId,
            }),
          });
          if (response.success) {
            token.id = response.user.id;
            token.role = response.user.roleId === '4954a96d-6b18-47af-802d-1f76ba029441' ? 'CUSTOMER' : 'ADMIN';
            token.accessToken = response.token || generateToken({
              id: response.user.id,
              email: token.email ?? '',
              role: token.role ?? 'CUSTOMER',
            });
          }
        } catch (error: any) {
          console.error('Google OAuth error:', error.message);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.role = token.role as string;
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };