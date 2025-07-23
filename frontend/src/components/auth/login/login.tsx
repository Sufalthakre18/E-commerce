'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { setAuthToken } from '@/lib/utils/auth';
import { login } from '@/lib/api/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { register: formRegister, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const result = await login(data);
      setAuthToken(result.token);

      // ✅ Check if user is admin and store it
      const isAdmin = result.user?.role?.name === 'ADMIN';
      localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');

      router.push(redirect);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          {...formRegister('email')}
          placeholder="Email"
          className="input w-full"
        />
        <input
          {...formRegister('password')}
          placeholder="Password"
          type="password"
          className="input w-full"
        />

        {formState.errors.email && (
          <p className="text-sm text-red-500">{formState.errors.email.message}</p>
        )}
        {formState.errors.password && (
          <p className="text-sm text-red-500">{formState.errors.password.message}</p>
        )}

        {errorMessage && (
          <p className="text-sm text-red-600 text-center mt-2">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-sm text-center">
        Don't have an account?{' '}
        <a
          href={`/register?redirect=${redirect}`}
          className="text-blue-600 underline"
        >
          Register here
        </a>
      </p>
    </div>
  );
}
