// // utils/auth.ts
// import Cookies from 'js-cookie';

// // Get token (returns string or undefined)
// export function getAuthToken(): string | undefined {
//   return Cookies.get('token');
// }

// // Set token with expiry (7 days)
// export function setAuthToken(token: string): void {
//   Cookies.set('token', token, { 
//     expires: 7,          // Expires in 7 days
//     secure: true,        // Send only over HTTPS
//     sameSite: 'strict',  // CSRF protection
//     path: '/'            // Available across entire site
//   });
// }

// // Remove token
// export function removeAuthToken(): void {
//   Cookies.remove('token', { path: '/' });
// }


// ========================================================


// utils/auth.ts

// utils/auth.ts

// Store token
export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
}

// Get token
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// Remove token
export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}
