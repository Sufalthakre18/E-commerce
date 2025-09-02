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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="text-center mb-6">
          <h1 className="text-xl font-medium mb-2">Verify OTP</h1>
          <p className="text-gray-600 text-sm">Sent to {email}</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              {...register('otp')}
              placeholder="Enter 6-digit code"
              className="w-full px-3 py-2 border-b border-gray-300 focus:border-black outline-none text-center text-lg tracking-widest"
              maxLength={6}
            />
            {errors.otp && (
              <p className="text-xs text-red-500 mt-1 text-center">{errors.otp.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 text-sm hover:bg-gray-800 transition-colors disabled:opacity-70"
          >
            {loading ? <LucideLoader2 className="animate-spin h-4 w-4 mx-auto" /> : 'Verify'}
          </button>
        </form>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}