'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pill, User, Mail, Lock, Phone, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().min(10, 'Valid phone required').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'pharmacy_owner']),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = (searchParams.get('role') as 'user' | 'pharmacy_owner') || 'user';

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole },
  });

  const selectedRole = form.watch('role');

  const handleSubmit = async (data: RegisterForm) => {
    setLoading(true);
    const result = await registerUser({
      name: data.name,
      email: data.email || undefined,
      phone: data.phone || undefined,
      password: data.password,
      role: data.role,
    });
    setLoading(false);
    if (result.success) {
      if (data.role === 'pharmacy_owner') {
        router.push('/dashboard/pharmacy');
      } else {
        router.push('/search');
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-600 text-white mb-4">
            <Pill className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create an account</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Join AvailMed today</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Role Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am a</label>
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1">
                <button
                  type="button"
                  onClick={() => form.setValue('role', 'user')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${selectedRole === 'user' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  <User className="h-4 w-4" /> Patient / User
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('role', 'pharmacy_owner')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${selectedRole === 'pharmacy_owner' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  <Building2 className="h-4 w-4" /> Pharmacy Owner
                </button>
              </div>
            </div>

            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              leftIcon={<User className="h-4 w-4" />}
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />
            <Input
              label="Email (optional)"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              {...form.register('email')}
              error={form.formState.errors.email?.message}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="+91 9876543210"
              leftIcon={<Phone className="h-4 w-4" />}
              {...form.register('phone')}
              error={form.formState.errors.phone?.message}
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              leftIcon={<Lock className="h-4 w-4" />}
              {...form.register('password')}
              error={form.formState.errors.password?.message}
            />

            <Button type="submit" fullWidth loading={loading} size="lg">
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
