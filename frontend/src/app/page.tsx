import Link from 'next/link';
import { Search, MapPin, Shield, Clock, Pill, ArrowRight, Star, Users, Building2, CheckCircle } from 'lucide-react';
import { SearchBar } from '@/components/medicine/SearchBar';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: Search,
    title: 'Instant Search',
    description: 'Search from thousands of medicines and find availability across nearby pharmacies in seconds.',
  },
  {
    icon: MapPin,
    title: 'Location-Based Results',
    description: 'Get pharmacies sorted by distance with real-time stock and pricing information.',
  },
  {
    icon: Shield,
    title: 'Verified Pharmacies',
    description: 'All pharmacies on our platform are licensed and verified for your safety.',
  },
  {
    icon: Clock,
    title: 'Reserve & Collect',
    description: 'Reserve medicines online and collect them from the pharmacy at your convenience.',
  },
];

const stats = [
  { value: '10,000+', label: 'Medicines Listed', icon: Pill },
  { value: '500+', label: 'Pharmacies', icon: Building2 },
  { value: '50,000+', label: 'Users', icon: Users },
  { value: '4.8', label: 'Avg Rating', icon: Star },
];

const categories = [
  'Antibiotics', 'Antidiabetics', 'Cardiovascular', 'Analgesics',
  'Antifungals', 'Vitamins', 'Antihistamines', 'Gastrointestinal',
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full filter blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300 rounded-full filter blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Pill className="h-10 w-10 text-primary-200" />
              <span className="text-4xl font-bold tracking-tight">AvailMed</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Find Medicines
              <span className="block text-primary-200">Near You, Instantly</span>
            </h1>
            <p className="text-xl text-primary-100 mb-10 max-w-xl mx-auto">
              Search medicine availability across thousands of local pharmacies. Compare prices, reserve online, and collect in-store.
            </p>
            <div className="max-w-2xl mx-auto">
              <SearchBar
                size="lg"
                autoNavigate
                placeholder="Search for any medicine, generic name, or composition..."
                className="shadow-2xl"
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="text-sm text-primary-200">Popular:</span>
              {['Paracetamol', 'Metformin', 'Amlodipine', 'Atorvastatin', 'Pantoprazole'].map((med) => (
                <Link
                  key={med}
                  href={`/search?q=${encodeURIComponent(med)}`}
                  className="text-sm text-white/80 hover:text-white underline underline-offset-2 transition-colors"
                >
                  {med}
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-primary-200">
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Free to use</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Real-time stock</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Online reservation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 bg-primary-50 dark:bg-primary-950/30 rounded-lg">
                      <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Why Choose AvailMed?</h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              We make finding and reserving medicines simple, fast, and reliable.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-950/30 rounded-xl">
                      <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Browse by Category</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Find medicines by therapeutic category</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/search?category=${encodeURIComponent(cat)}`}
                className="group p-4 text-center rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all"
              >
                <Pill className="h-8 w-8 mx-auto mb-2 text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-700 dark:group-hover:text-primary-300">{cat}</span>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/search">
              <Button variant="outline" size="lg">
                Browse All Medicines <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Own a Pharmacy?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Join AvailMed and reach thousands of customers looking for medicines in your area. Manage inventory, reservations, and grow your business.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register?role=pharmacy_owner">
              <Button size="lg" variant="secondary">
                Register Your Pharmacy
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Search Medicines
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
