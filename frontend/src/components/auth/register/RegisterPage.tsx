'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import * as z from 'zod';
import { useState } from 'react';
import { register as registerUser } from '@/lib/api/auth';
import { Toaster, toast } from 'sonner';
import { LucideUser, LucideMail, LucideLock, LucideLoader2 } from 'lucide-react';
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
      // Validate email existence using email-validator
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
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <LucideUser className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          <input
            {...register('name')}
            placeholder="Full Name"
            className="input w-full pl-10 border rounded-md"
          />
        </div>
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
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
            type="password"
            placeholder="Password"
            className="input w-full pl-10 border rounded-md"
          />
        </div>
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center"
        >
          {loading ? <LucideLoader2 className="animate-spin h-5 w-5" /> : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-sm text-center">
        Already have an account?{' '}
        <a href={`/login?redirect=${redirect}`} className="text-blue-600 underline">
          Login here
        </a>
      </p>
      <Toaster />
    </div>
  );
}