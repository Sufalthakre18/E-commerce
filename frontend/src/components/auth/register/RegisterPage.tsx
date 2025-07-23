'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import * as z from 'zod';
import { useState } from 'react';
import { register as registerUser } from '@/lib/api/auth';
import { setAuthToken } from '@/lib/utils/auth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError('');
    try {
      const result = await registerUser(data);
      setAuthToken(result.token);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input {...register('name')} placeholder="Full Name" className="input w-full" />
        <input {...register('email')} placeholder="Email" className="input w-full" />
        <input
          {...register('password')}
          type="password"
          placeholder="Password"
          className="input w-full"
        />

        {formState.errors.name && <p className="text-sm text-red-500">{formState.errors.name.message}</p>}
        {formState.errors.email && <p className="text-sm text-red-500">{formState.errors.email.message}</p>}
        {formState.errors.password && <p className="text-sm text-red-500">{formState.errors.password.message}</p>}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm">
        Already have an account?{' '}
        <a href={`/login?redirect=${redirect}`} className="underline text-blue-600">
          Login here
        </a>
      </p>
    </div>
  );
}
