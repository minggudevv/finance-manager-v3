'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { supabase, getCurrentUser } from '@/lib/supabaseClient';
import { formatMoney, formatDateShort } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'debt' | 'receivable';
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface CategorySummary {
  category: string;
  income: number;
  expense: number;
}

export default function ReportPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    checkAuthAndLoadData();
  }, [dateRange]);

  const checkAuthAndLoadData = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    loadReportData();
  };

  const loadReportData = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', dateRange.from)
        .lte('date', dateRange.to)
        .order('date', { ascending: true });

      if (error) throw error;
      setTransactions(data || []);

      // Calculate category summary
      const summary: Record<string, { income: number; expense: number }> = {};
      data?.forEach((t) => {
        const cat = t.category || 'Lainnya';
        if (!summary[cat]) {
          summary[cat] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') summary[cat].income += parseFloat(t.amount.toString());
        if (t.type === 'expense') summary[cat].expense += parseFloat(t.amount.toString());
      });

      setCategorySummary(
        Object.entries(summary).map(([category, amounts]) => ({
          category,
          ...amounts,
        }))
      );
    } catch (error) {
      toast.error('Gagal memuat laporan');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Jenis', 'Kategori', 'Deskripsi', 'Jumlah'];
    const rows = transactions.map((t) => [
      formatDateShort(t.date),
      t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : t.type === 'debt' ? 'Hutang' : 'Piutang',
      t.category || '-',
      t.description || '-',
      t.amount,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-${dateRange.from}-${dateRange.to}.csv`;
    link.click();
    toast.success('Laporan berhasil diekspor');
  };

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Laporan</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Analisis keuangan Anda</p>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export CSV
            </button>
          </div>

          {/* Date Range Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter Tanggal</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dari Tanggal</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sampai Tanggal</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">Total Pemasukan</h3>
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">{formatMoney(totalIncome)}</p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                {transactions.filter((t) => t.type === 'income').length} transaksi
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">Total Pengeluaran</h3>
              <p className="text-3xl font-bold text-red-700 dark:text-red-400">{formatMoney(totalExpense)}</p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {transactions.filter((t) => t.type === 'expense').length} transaksi
              </p>
            </div>
          </div>

          {/* Net Balance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Saldo Bersih</h3>
            <p className={`text-3xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatMoney(totalIncome - totalExpense)}
            </p>
          </div>

          {/* Category Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Ringkasan per Kategori
            </h3>
            {categorySummary.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Tidak ada data</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kategori</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pemasukan</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pengeluaran</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {categorySummary.map((cat) => {
                      const balance = cat.income - cat.expense;
                      return (
                        <tr key={cat.category} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">{cat.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-green-600 dark:text-green-400">
                            {formatMoney(cat.income)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-red-600 dark:text-red-400">
                            {formatMoney(cat.expense)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatMoney(balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Transaction List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daftar Transaksi</h3>
            {transactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">Tidak ada transaksi pada periode ini</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          t.type === 'income' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          t.type === 'expense' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          t.type === 'debt' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        }`}>
                          {t.type === 'income' ? 'Masuk' : t.type === 'expense' ? 'Keluar' : t.type === 'debt' ? 'Hutang' : 'Piutang'}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatDateShort(t.date)}</span>
                        {t.category && <span className="text-xs text-gray-500 dark:text-gray-400">• {t.category}</span>}
                      </div>
                      {t.description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.description}</p>}
                    </div>
                    <p className={`text-sm font-medium ${
                      t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
