
import { getSession } from 'next-auth/react';

export async function setAuthToken(token: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    console.log('Token set in localStorage:', token);
  } else {
    console.warn('setAuthToken: Window is undefined (server-side call)');
  }
}

export async function getAuthToken(): Promise<string | null> {
  const session = await getSession();
  if (session?.accessToken) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', session.accessToken);
      console.log('Token from session stored in localStorage:', session.accessToken);
    }
    console.log('Returning token from session:', session.accessToken);
    return session.accessToken;
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('Returning token from localStorage:', token);
    return token;
  }
  console.warn('getAuthToken: No token found (window undefined or no session)');
  return null;
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    console.log('Token removed from localStorage');
  }
}