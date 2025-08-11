'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Toaster, toast } from 'sonner';
import { LucideLoader2 } from 'lucide-react';

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

type OtpForm = z.infer<typeof otpSchema>;

export default function OtpPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
  });
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') || '';
  const redirect = params.get('redirect') || '/';
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: OtpForm) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email,
        otp: data.otp,
        redirect: false,
      });
      if (result?.error) {
        throw new Error(result.error);
      }
      toast.success('Verification successful');
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Verify OTP</h1>
      <p className="mb-4">OTP sent to {email}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input
          {...register('otp')}
          placeholder="Enter 6-digit OTP"
          className="input w-full border rounded-md"
        />
        {errors.otp && <p className="text-sm text-red-500">{errors.otp.message}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded-md flex items-center justify-center"
        >
          {loading ? <LucideLoader2 className="animate-spin h-5 w-5" /> : 'Verify'}
        </button>
      </form>
      <Toaster />
    </div>
  );
}