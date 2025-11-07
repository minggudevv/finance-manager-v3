'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, ShoppingCart, Package, ReceiptText, Wallet, User, LogOut, Moon, Sun, Settings } from 'lucide-react';
import { signOut } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { isAdmin } from '@/lib/adminUtils';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/dashboard', icon: LayoutGrid, label: 'Dashboard' },
  { href: '/transactions', icon: ReceiptText, label: 'Transaksi' },
  { href: '/products', icon: Package, label: 'Produk' },
  { href: '/orders', icon: ShoppingCart, label: 'Pesanan' },
  { href: '/report', icon: ReceiptText, label: 'Laporan' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const admin = await isAdmin();
      setIsAdminUser(admin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
      toast.success('Berhasil logout');
    } catch (error) {
      toast.error('Gagal logout');
    }
  };

  // Filter out admin items if user is not an admin
  const displayNavItems = [...navItems];
  if (isAdminUser && !loading) {
    displayNavItems.push({ href: '/settings', icon: Settings, label: 'Pengaturan' });
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
      <div className="flex items-center justify-between px-4 py-2">
        {displayNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 flex-1 ${isActive ? 'text-pink-600 dark:text-pink-400' : 'text-gray-500 dark:text-gray-400'}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
        
        {displayNavItems.length < 6 && (
          <div className="flex-1" />
        )}
        
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center py-2 px-3 flex-1 text-gray-500 dark:text-gray-400"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="text-xs mt-1">Theme</span>
        </button>
        
        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center py-2 px-3 flex-1 text-gray-500 dark:text-gray-400"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-xs mt-1">Logout</span>
        </button>
      </div>
    </div>
  );
}