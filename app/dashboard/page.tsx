'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import Card from '@/components/Card';
import { supabase, getCurrentUser } from '@/lib/supabaseClient';
import { formatMoney } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardSummary {
  total_income: number;
  total_expense: number;
  total_debt: number;
  total_receivable: number;
  net_balance: number;
}

const COLORS = ['#10b981', '#ef4444', '#f97316', '#3b82f6'];

export default function DashboardPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('User tidak ditemukan');
        return;
      }

      // Get summary using the function
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_dashboard_summary', { p_user_id: user.id });

      if (summaryError) {
        // Fallback: calculate manually if function fails
        const { data: transactions } = await supabase
          .from('transactions')
          .select('type, amount')
          .eq('user_id', user.id);

        if (transactions) {
          const calculated = {
            user_id: user.id,
            total_income: transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
            total_expense: transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
            total_debt: transactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
            total_receivable: transactions.filter(t => t.type === 'receivable').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
            net_balance: 0
          };
          calculated.net_balance = calculated.total_income - calculated.total_expense;
          setSummary(calculated);
        }
      } else {
        setSummary(summaryData[0] || null);
      }

      // Get last 6 months data
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (transactionsError) throw transactionsError;

      // Process monthly data
      const monthly = transactions.reduce((acc: any, t: any) => {
        const month = new Date(t.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
        if (!acc[month]) {
          acc[month] = { month, income: 0, expense: 0 };
        }
        if (t.type === 'income') acc[month].income += parseFloat(t.amount);
        if (t.type === 'expense') acc[month].expense += parseFloat(t.amount);
        return acc;
      }, {});

      setMonthlyData(Object.values(monthly));

    } catch (error) {
      toast.error('Gagal memuat data dashboard');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  const pieData = summary ? [
    { name: 'Pemasukan', value: summary.total_income || 0 },
    { name: 'Pengeluaran', value: summary.total_expense || 0 },
  ] : [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Ringkasan keuangan Anda</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card
              title="Total Pemasukan"
              value={formatMoney(summary?.total_income || 0)}
              icon={<TrendingUp className="h-8 w-8" />}
              className="income"
            />
            <Card
              title="Total Pengeluaran"
              value={formatMoney(summary?.total_expense || 0)}
              icon={<TrendingDown className="h-8 w-8" />}
              className="expense"
            />
            <Card
              title="Total Hutang"
              value={formatMoney(summary?.total_debt || 0)}
              icon={<ArrowDownRight className="h-8 w-8" />}
              className="debt"
            />
            <Card
              title="Total Piutang"
              value={formatMoney(summary?.total_receivable || 0)}
              icon={<ArrowUpRight className="h-8 w-8" />}
              className="receivable"
            />
          </div>

          {/* Net Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <div className="text-center sm:text-left mb-4 sm:mb-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Saldo Bersih</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pemasukan - Pengeluaran</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl sm:text-3xl font-bold ${summary && summary.net_balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatMoney(summary?.net_balance || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6">
            {/* Pie Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Perbandingan Pemasukan & Pengeluaran</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatMoney(value as number)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tren Bulanan</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMoney(Number(value))} />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Pemasukan" />
                  <Bar dataKey="expense" fill="#ef4444" name="Pengeluaran" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
