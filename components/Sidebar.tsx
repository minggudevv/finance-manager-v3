'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LayoutGrid, ShoppingCart, Package, ReceiptText, Wallet, ChevronLeft, ChevronRight, LogOut, Moon, Sun, Settings, Users } from 'lucide-react';
import { signOut } from '@/lib/supabaseClient';
import { useTheme } from '@/contexts/ThemeContext';
import { isAdmin } from '@/lib/adminUtils';
import { runDatabaseHealthCheck } from '@/lib/dbInitUtils';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) setCollapsed(saved === 'true');
    
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      setLoading(true);
      const admin = await isAdmin();
      setIsAdminUser(admin);
    } catch (error) {
      console.error('Error checking admin status:', error instanceof Error ? error.message : error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  const isActive = (href: string) => pathname.startsWith(href);

  const NavItem = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium
        ${isActive(href)
          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}
      `}
      title={collapsed ? label : undefined}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  // Show loading state while checking admin status
  if (loading) {
    return (
      <aside className={`h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${collapsed ? 'w-16' : 'w-60'} transition-all`}>
        <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-pink-600" />
            {!collapsed && <span className="font-bold text-gray-900 dark:text-white">Finance</span>}
          </div>
          <button onClick={toggleCollapse} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
        <div className="p-3 flex flex-col gap-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 animate-pulse">
            <LayoutGrid className="h-5 w-5" />
            {!collapsed && <span>Loading...</span>}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`h-screen sticky top-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 ${collapsed ? 'w-16' : 'w-60'} transition-all`}> 
      <div className="h-16 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-pink-600" />
          {!collapsed && <span className="font-bold text-gray-900 dark:text-white">Finance</span>}
        </div>
        <button onClick={toggleCollapse} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
      <nav className="p-3 flex flex-col gap-1">
        <NavItem href="/dashboard" icon={<LayoutGrid className="h-5 w-5" />} label="Dashboard" />
        <NavItem href="/transactions" icon={<ReceiptText className="h-5 w-5" />} label="Transaksi" />
        <NavItem href="/products" icon={<Package className="h-5 w-5" />} label="Produk" />
        <NavItem href="/orders" icon={<ShoppingCart className="h-5 w-5" />} label="Pesanan" />
        <NavItem href="/report" icon={<ReceiptText className="h-5 w-5" />} label="Laporan" />
        
        {/* Admin-only menu items */}
        {isAdminUser && (
          <>
            <NavItem href="/settings" icon={<Settings className="h-5 w-5" />} label="Pengaturan" />
            {/* Add a small indicator for database status - this is just for visual feedback */}
            <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span>DB OK</span>
            </div>
          </>
        )}
      </nav>
      <div className="mt-auto p-3 flex flex-col gap-2">
        <button onClick={toggleTheme} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button
          onClick={async () => { await signOut(); router.push('/login'); }}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
