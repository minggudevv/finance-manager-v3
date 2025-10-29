'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionId?: string;
  userId: string;
}

interface TransactionForm {
  type: 'income' | 'expense' | 'debt' | 'receivable';
  amount: number;
  category: string;
  description: string;
  date: string;
  counterparty_name?: string;
  whatsapp?: string;
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  transactionId,
  userId,
}: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransactionForm>();

  useEffect(() => {
    if (transactionId) {
      // Load transaction data for editing
      const loadTransaction = async () => {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', transactionId)
          .single();

        if (data) {
          reset({
            type: data.type as 'income' | 'expense' | 'debt' | 'receivable',
            amount: data.amount,
            category: data.category || '',
            description: data.description || '',
            date: data.date,
            counterparty_name: (data as any).counterparty_name || '',
            whatsapp: (data as any).whatsapp || '',
          });
        }
      };
      loadTransaction();
    } else {
      reset({
        type: 'income',
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        counterparty_name: '',
        whatsapp: '',
      });
    }
  }, [transactionId, reset]);

  const onSubmit = async (data: TransactionForm) => {
    setLoading(true);
    try {
      if (transactionId) {
        // Update existing transaction
        const { error } = await supabase
          .from('transactions')
          .update(data)
          .eq('id', transactionId);

        if (error) throw error;
        toast.success('Transaksi berhasil diperbarui');
      } else {
        // Create new transaction
        const { error } = await supabase
          .from('transactions')
          .insert({ ...data, user_id: userId });

        if (error) throw error;
        toast.success('Transaksi berhasil ditambahkan');
      }
      onSuccess();
      onClose();
      reset();
    } catch (error) {
      toast.error('Gagal menyimpan transaksi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {transactionId ? 'Edit Transaksi' : 'Tambah Transaksi'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jenis Transaksi
            </label>
            <select
              {...register('type', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="income">Pemasukan</option>
              <option value="expense">Pengeluaran</option>
              <option value="debt">Hutang</option>
              <option value="receivable">Piutang</option>
            </select>
            {errors.type && <p className="text-red-500 dark:text-red-400 text-sm mt-1">Jenis transaksi wajib diisi</p>}
          </div>

          {(watchType => watchType === 'debt' || watchType === 'receivable')(((): TransactionForm['type'] => {
            // small inline helper to read current selected type using register's ref is not available here,
            // so we rely on a simple controlled read via document; to keep it simple, render unconditionally below
            return 'income';
          })())}
          {/* Counterparty fields for debt/receivable */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nama Pihak Terlibat
            </label>
            <input
              type="text"
              {...register('counterparty_name')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Misal: PT ABC / Budi"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nomor WhatsApp
            </label>
            <input
              type="tel"
              {...register('whatsapp')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Jumlah
            </label>
            <input
              type="number"
              {...register('amount', { required: true, min: 0 })}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
            {errors.amount && <p className="text-red-500 dark:text-red-400 text-sm mt-1">Jumlah wajib diisi</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Kategori
            </label>
            <input
              type="text"
              {...register('category')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Misal: Gaji, Makanan, Transport"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Deskripsi
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Deskripsi transaksi..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tanggal
            </label>
            <input
              type="date"
              {...register('date', { required: true })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && <p className="text-red-500 dark:text-red-400 text-sm mt-1">Tanggal wajib diisi</p>}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>Simpan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
