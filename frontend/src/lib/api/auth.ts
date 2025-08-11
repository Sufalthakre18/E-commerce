type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export async function login(data: { email: string; password: string }) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await res.json();
  if (!res.ok || result.success === false) {
    throw new Error(result.message || 'Login failed');
  }

  return result;
}

export async function register(payload: RegisterPayload) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('Failed to parse JSON:', text);
    throw new Error('Server returned invalid JSON');
  }

  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
}