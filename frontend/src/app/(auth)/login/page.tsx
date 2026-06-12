'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pill, Mail, Lock, Phone } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const emailSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

const otpSchema = z.object({
  phone: z.string().min(10, 'Valid phone number required'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

type EmailForm = z.infer<typeof emailSchema>;
type OtpForm = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const [mode, setMode] = useState<'email' | 'otp'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, sendOTP, verifyOTP } = useAuth();
  const router = useRouter();

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const handleEmailLogin = async (data: EmailForm) => {
    setLoading(true);
    const result = await login({ email: data.email, password: data.password });
    setLoading(false);
    if (result.success) router.push('/search');
  };

  const handleSendOTP = async () => {
    const phone = otpForm.getValues('phone');
    if (!phone || phone.length < 10) {
      toast.error('Enter a valid phone number');
      return;
    }
    setLoading(true);
    const result = await sendOTP(phone);
    setLoading(false);
    if (result.success) setOtpSent(true);
  };

  const handleVerifyOTP = async (data: OtpForm) => {
    if (!data.otp) { toast.error('Enter the OTP'); return; }
    setLoading(true);
    const result = await verifyOTP(data.phone, data.otp);
    setLoading(false);
    if (result.success) router.push('/search');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white mb-4">
            <Pill className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Sign in to your account</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 mb-6">
            <button
              onClick={() => setMode('email')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${mode === 'email' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setMode('otp')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${mode === 'otp' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
            >
              Phone OTP
            </button>
          </div>

          {mode === 'email' ? (
            <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                leftIcon={<Mail className="h-4 w-4" />}
                {...emailForm.register('email')}
                error={emailForm.formState.errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                {...emailForm.register('password')}
                error={emailForm.formState.errors.password?.message}
              />
              <Button type="submit" fullWidth loading={loading}>Sign In</Button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+91 9876543210"
                    leftIcon={<Phone className="h-4 w-4" />}
                    {...otpForm.register('phone')}
                    error={otpForm.formState.errors.phone?.message}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="button" variant="outline" onClick={handleSendOTP} loading={loading && !otpSent}>
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </Button>
                </div>
              </div>
              {otpSent && (
                <Input
                  label="Enter OTP"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...otpForm.register('otp')}
                  error={otpForm.formState.errors.otp?.message}
                />
              )}
              {otpSent && <Button type="submit" fullWidth loading={loading}>Verify & Sign In</Button>}
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
