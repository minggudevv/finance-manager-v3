'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { supabase, getCurrentUser } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();
  const [tracking, setTracking] = useState('');
  const [result, setResult] = useState<any | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      await getCurrentUser();
    };
    checkAuth();
  }, [router]);

  const checkTracking = async () => {
    const input = tracking.trim();
    if (!input) return;
    setChecking(true);
    setResult(null);
    const { data, error } = await supabase.rpc('public_get_order_by_tracking', { p_tracking: input });
    if (error) {
      console.error('Tracking RPC error', error);
      setResult({ notFound: true });
    } else if (data && data.length > 0) {
      setResult(data[0]);
    } else {
      setResult({ notFound: true });
    }
    setChecking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <nav className="flex justify-between items-center mb-12">
          <div className="flex items-center">
            <Wallet className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            <span className="ml-2 text-2xl font-bold text-gray-900 dark:text-white">Finance Manager</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium">
              Login
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Daftar
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Kelola Keuangan Anda dengan Mudah
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Aplikasi pengelola keuangan yang membantu Anda mencatat pemasukan, pengeluaran, hutang, dan piutang secara real-time.
          </p>
        </div>

        {/* Public Tracking */}
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Cek Resi Pesanan</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                placeholder="Masukkan nomor resi"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
            <button onClick={checkTracking} disabled={checking} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50">Cek Resi</button>
          </div>
          <div className="mt-4">
            {checking && <p className="text-gray-600 dark:text-gray-400">Memeriksa...</p>}
            {result?.notFound && <p className="text-red-600">Nomor resi tidak ditemukan.</p>}
            {result && !result.notFound && (
              <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
                <p><strong>Resi:</strong> {result.tracking_number}</p>
                <p><strong>Nama:</strong> {result.customer_name}</p>
                <p><strong>Produk:</strong> {result.product_name}</p>
                <p><strong>Jumlah:</strong> {result.quantity}</p>
                <p><strong>Status:</strong> {result.status}</p>
                <p><strong>Diperbarui:</strong> {new Date(result.updated_at).toLocaleString('id-ID')}</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex justify-center space-x-4">
          <Link
            href="/register"
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            Mulai Sekarang
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium border border-gray-300"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
