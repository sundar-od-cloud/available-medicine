'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingBag, Users, Building2,
  Upload, BarChart3, Pill
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const userLinks = [
    { href: '/dashboard/user', icon: LayoutDashboard, label: 'Overview' },
    { href: '/reservations', icon: ShoppingBag, label: 'My Reservations' },
    { href: '/search', icon: Pill, label: 'Search Medicine' },
  ];

  const pharmacyLinks = [
    { href: '/dashboard/pharmacy', icon: LayoutDashboard, label: 'Overview' },
    { href: '/inventory', icon: Package, label: 'Inventory' },
    { href: '/reservations', icon: ShoppingBag, label: 'Reservations' },
    { href: '/inventory/upload', icon: Upload, label: 'Bulk Upload' },
  ];

  const adminLinks = [
    { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/pharmacies', icon: Building2, label: 'Pharmacies' },
    { href: '/admin/medicines', icon: Pill, label: 'Medicines' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const links =
    user?.role === 'admin' ? adminLinks :
    user?.role === 'pharmacy_owner' ? pharmacyLinks :
    userLinks;

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <nav className="p-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
