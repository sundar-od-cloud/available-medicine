'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pill, Phone, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function OTPLoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { sendOTP, verifyOTP } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    const result = await sendOTP(phone);
    setLoading(false);
    if (result.success) {
      setStep('otp');
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;
    setLoading(true);
    const result = await verifyOTP(phone, otpString);
    setLoading(false);
    if (result.success) {
      const user = result.user;
      if (user?.role === 'admin') router.push('/dashboard/admin');
      else if (user?.role === 'pharmacy_owner') router.push('/dashboard/pharmacy');
      else router.push('/dashboard/user');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary-600 dark:text-primary-400">
            <Pill className="h-7 w-7" />
            AvailMed
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {step === 'phone' ? 'Sign in with OTP' : 'Enter verification code'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {step === 'phone'
              ? 'Enter your phone number to receive an OTP'
              : `We sent a code to ${phone}`}
          </p>
        </div>

        <Card padding="lg">
          {step === 'phone' ? (
            <div className="space-y-4">
              <Input
                label="Phone number"
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="h-4 w-4" />}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOTP()}
              />
              <Button fullWidth loading={loading} onClick={handleSendOTP} size="lg">
                Send OTP
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 text-center">
                  Enter 6-digit OTP
                </label>
                <div className="flex justify-center gap-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ))}
                </div>
              </div>

              <Button fullWidth loading={loading} onClick={handleVerifyOTP} size="lg" disabled={otp.join('').length !== 6}>
                Verify OTP
              </Button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Resend OTP in {countdown}s</p>
                ) : (
                  <button
                    onClick={() => { handleSendOTP(); setOtp(['', '', '', '', '', '']); }}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); }}
                className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-4 w-4" /> Change phone number
              </button>
            </div>
          )}
        </Card>

        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          <Link href="/login" className="font-medium text-primary-600 dark:text-primary-400 hover:underline">
            Sign in with password instead
          </Link>
        </p>
      </div>
    </div>
  );
}
