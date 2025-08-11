import { DefaultSession, DefaultUser, DefaultJWT } from 'next-auth';
import { JWT } from 'next-auth/jwt';

// This declares the global next-auth module
declare module 'next-auth' {
  // Extend the Session type
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
    } & DefaultSession['user'];
  }

  // Extend the User type
  interface User extends DefaultUser {
    role: string;
    accessToken?: string; // Add accessToken here
  }
}

// This declares the next-auth/jwt module
declare module 'next-auth/jwt' {
  // Extend the JWT type
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    accessToken?: string; // Add accessToken here
  }
}