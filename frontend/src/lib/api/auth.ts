export async function login(data: { email: string; password: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  // Only call res.json() ONCE
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result?.message || 'Login failed');
  }

  return result;
}

// ===========================================================
// lib/api/auth.ts

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

// lib/api/auth.ts

export async function register(payload: { name: string; email: string; password: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  // Get raw response text first
  const text = await res.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON:', text);
    throw new Error('Server returned invalid JSON');
  }

  if (!res.ok || data.success === false) {
    const message = data?.message || 'Registration failed';
    throw new Error(message);
  }

  return data;
}

