'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import * as z from 'zod';
import { useState } from 'react';
import { register as registerUser } from '@/lib/api/auth';
import { Toaster, toast } from 'sonner';
import { LucideUser, LucideMail, LucideLock, LucideLoader2, LucideArrowRight } from 'lucide-react';
import * as EmailValidator from 'email-validator';

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const isValidEmail = EmailValidator.validate(data.email);
      if (!isValidEmail) {
        toast.error('This email does not exist or is invalid. Please use a valid email.');
        setLoading(false);
        return;
      }

      const result = await registerUser(data);
      toast.success('OTP sent. Verify to complete registration.');
      router.push(`/otp?email=${encodeURIComponent(data.email)}&redirect=${redirect}`);
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Sign up to get started</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="relative">
              <LucideUser className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register('name')}
                placeholder="Full Name"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-black focus:border-transparent outline-none"
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <LucideMail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register('email')}
                placeholder="Email Address"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-black focus:border-transparent outline-none"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
              <LucideLock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                {...register('password')}
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-1 focus:ring-black focus:border-transparent outline-none"
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center font-medium hover:bg-gray-800 transition-colors disabled:opacity-70"
          >
            {loading ? (
              <LucideLoader2 className="animate-spin h-5 w-5" />
            ) : (
              <>
                Create Account
                <LucideArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <a 
            href={`/login?redirect=${redirect}`} 
            className="text-black font-medium hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}