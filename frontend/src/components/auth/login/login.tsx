'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Toaster, toast } from 'sonner';
import { LucideMail, LucideLock, LucideLoader2 } from 'lucide-react';
import { login } from '@/lib/api/auth';
import { setAuthToken } from '@/lib/utils/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await login(data);
      if (result.token) {
        await setAuthToken(result.token);
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        if (signInResult?.error) {
          throw new Error(signInResult.error);
        }
        toast.success('Login successful');
        router.push(redirect);
      } else {
        throw new Error('No token received');
      }
    } catch (err: any) {
      console.error('Login error:', err.message);
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setOtpLoading(true);
    try {
      const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement | null;
      const email = emailInput?.value;
      if (!email || !z.string().email().safeParse(email).success) {
        toast.error('Please enter a valid email');
        setOtpLoading(false);
        return;
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      toast.success('OTP sent to your email');
      router.push(`/otp?email=${encodeURIComponent(email)}&redirect=${redirect}`);
    } catch (err: any) {
      console.error('OTP error:', err.message);
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signIn('google', { callbackUrl: redirect });
    } catch (err: any) {
      console.error('Google login error:', err.message);
      toast.error('Google login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <LucideMail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input
            {...register('email')}
            placeholder="Email"
            className="input w-full pl-10 border rounded-md"
          />
        </div>
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        <div className="relative">
          <LucideLock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input
            {...register('password')}
            placeholder="Password"
            type="password"
            className="input w-full pl-10 border rounded-md"
          />
        </div>
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center"
        >
          {loading ? <LucideLoader2 className="animate-spin h-5 w-5" /> : 'Login'}
        </button>
      </form>
      <button
        onClick={handleOtpLogin}
        disabled={otpLoading}
        className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md flex items-center justify-center"
      >
        {otpLoading ? <LucideLoader2 className="animate-spin h-5 w-5" /> : 'Login with OTP'}
      </button>
      <button
        onClick={handleGoogleLogin}
        className="w-full mt-4 bg-gray-100 text-black py-2 rounded-md flex items-center justify-center gap-2"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.02.68-2.32 1.09-3.71 1.09-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C4.01 20.07 7.56 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.56 1 4.01 3.93 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Sign in with Google
      </button>
      <p className="mt-4 text-sm text-center">
        Don&apos;t have an account?{' '}
        <a href={`/register?redirect=${redirect}`} className="text-blue-600 underline">
          Register here
        </a>
      </p>
      <Toaster />
    </div>
  );
}