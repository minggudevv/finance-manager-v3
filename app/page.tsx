'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseAnonKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          router.push('/dashboard');
        }
      }
    };
    
    checkAuth();
  }, [router]);

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
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Kelola Keuangan Anda dengan Mudah
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            Aplikasi pengelola keuangan yang membantu Anda mencatat pemasukan, pengeluaran, hutang, dan piutang secara real-time.
          </p>
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

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-blue-600 dark:text-blue-400 mb-4">
              <Wallet className="h-12 w-12" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Transaksi Real-time</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Catat semua transaksi Anda secara langsung dengan data yang tersimpan aman di cloud.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-green-600 dark:text-green-400 mb-4">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Dashboard Visual</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Lihat ringkasan keuangan Anda dengan grafik interaktif dan statistik yang mudah dipahami.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-orange-600 dark:text-orange-400 mb-4">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Data Aman</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Data Anda dilindungi dengan enkripsi dan setiap user memiliki isolasi data sendiri.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
