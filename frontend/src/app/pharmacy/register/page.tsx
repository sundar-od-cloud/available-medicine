'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, MapPin, Phone, FileText, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { pharmacyApi } from '@/lib/api';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(3, 'Pharmacy name must be at least 3 characters'),
  license_no: z.string().min(5, 'License number required'),
  gst_no: z.string().optional(),
  address: z.string().min(10, 'Full address required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  phone: z.string().min(10, 'Valid phone number required'),
});

type PharmacyForm = z.infer<typeof schema>;

export default function RegisterPharmacyPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { latitude, longitude, loading: geoLoading } = useGeolocation();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PharmacyForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      latitude: latitude || 0,
      longitude: longitude || 0,
    },
  });

  // Update lat/lng when geolocation loads
  if (latitude && !form.getValues('latitude')) {
    form.setValue('latitude', latitude);
    form.setValue('longitude', longitude || 0);
  }

  const handleSubmit = async (data: PharmacyForm) => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      router.push('/login');
      return;
    }
    setSubmitting(true);
    try {
      await pharmacyApi.register(data);
      toast.success('Pharmacy registered! Awaiting admin approval.');
      router.push('/dashboard/pharmacy');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Register Your Pharmacy</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Submit your pharmacy details for review. Once approved, you can manage inventory and accept reservations.
        </p>
      </div>

      <Card>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h2 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary-600" /> Basic Information
            </h2>
            <Input
              label="Pharmacy Name"
              placeholder="City Medical Store"
              leftIcon={<Building2 className="h-4 w-4" />}
              {...form.register('name')}
              error={form.formState.errors.name?.message}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="License Number"
                placeholder="MH-2024-001234"
                leftIcon={<FileText className="h-4 w-4" />}
                {...form.register('license_no')}
                error={form.formState.errors.license_no?.message}
              />
              <Input
                label="GST Number (optional)"
                placeholder="27AAPFU0939F1ZV"
                {...form.register('gst_no')}
                error={form.formState.errors.gst_no?.message}
              />
            </div>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 22 1234 5678"
              leftIcon={<Phone className="h-4 w-4" />}
              {...form.register('phone')}
              error={form.formState.errors.phone?.message}
            />
          </div>

          <div className="space-y-4">
            <h2 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary-600" /> Location
            </h2>
            <Input
              label="Full Address"
              placeholder="123 Main Street, Andheri West, Mumbai, Maharashtra 400058"
              {...form.register('address')}
              error={form.formState.errors.address?.message}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  placeholder="19.0760"
                  {...form.register('latitude', { valueAsNumber: true })}
                  error={form.formState.errors.latitude?.message}
                />
              </div>
              <div>
                <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  placeholder="72.8777"
                  {...form.register('longitude', { valueAsNumber: true })}
                  error={form.formState.errors.longitude?.message}
                />
              </div>
            </div>
            {geoLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Detecting your location...
              </div>
            ) : latitude ? (
              <div className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400">
                <MapPin className="h-4 w-4" /> Location detected automatically
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable location access or enter coordinates manually. Use{' '}
                <a href="https://www.latlong.net/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                  latlong.net
                </a>{' '}
                to find your coordinates.
              </p>
            )}
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 text-sm text-yellow-800 dark:text-yellow-200">
            Your pharmacy will be reviewed by our team before approval. This typically takes 1-2 business days.
          </div>

          <Button type="submit" fullWidth size="lg" loading={submitting}>
            Submit for Review
          </Button>
        </form>
      </Card>
    </div>
  );
}
