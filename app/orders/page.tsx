'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Plus, Edit, Trash2, Truck, Save } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface Product { id: string; name: string; }
interface Order {
  id: string;
  product_id: string;
  quantity: number;
  customer_name: string;
  customer_phone: string | null;
  address: string | null;
  status: 'pending'|'diproses'|'dikirim'|'selesai';
  tracking_number: string | null;
  note: string | null;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) { router.push('/login'); return; }
      await Promise.all([loadProducts(), loadOrders()]);
    })();
  }, []);

  const loadProducts = async () => {
    const user = await getCurrentUser(); if (!user) return;
    const { data } = await supabase.from('products').select('id,name').eq('user_id', user.id).order('name');
    setProducts(data || []);
  };

  const loadOrders = async () => {
    try {
      const user = await getCurrentUser(); if (!user) return;
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setOrders(data || []);
    } catch {
      toast.error('Gagal memuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const productMap = useMemo(() => Object.fromEntries(products.map(p => [p.id, p.name])), [products]);

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pesanan ini?')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) return toast.error('Gagal menghapus');
    toast.success('Pesanan dihapus');
    loadOrders();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pesanan</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Kelola pesanan pelanggan</p>
            </div>
            <button
              onClick={() => { setEditing(null); setIsModalOpen(true); }}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tambah Pesanan
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">Memuat...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">Belum ada pesanan</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Pelanggan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Produk</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resi</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{o.customer_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{productMap[o.product_id] || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">{o.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            o.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
                            o.status === 'diproses' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            o.status === 'dikirim' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}>{o.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{o.tracking_number || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => { setEditing(o); setIsModalOpen(true); }} className="text-blue-600 dark:text-blue-400 hover:underline"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => handleDelete(o.id)} className="text-red-600 dark:text-red-400 hover:underline"><Trash2 className="h-5 w-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isModalOpen && <OrderModal editing={editing} products={products} onClose={() => setIsModalOpen(false)} onSaved={() => { setIsModalOpen(false); loadOrders(); }} />}
        </div>
      </div>
    </div>
  );
}

function OrderModal({ editing, products, onClose, onSaved }: { editing: Order | null; products: Product[]; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({ product_id: '', quantity: 1, customer_name: '', customer_phone: '', address: '', status: 'pending' as Order['status'], tracking_number: '', note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setForm({
      product_id: editing.product_id,
      quantity: editing.quantity,
      customer_name: editing.customer_name,
      customer_phone: editing.customer_phone || '',
      address: editing.address || '',
      status: editing.status,
      tracking_number: editing.tracking_number || '',
      note: editing.note || ''
    });
  }, [editing]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'quantity' ? Number(value) : value }));
  };

  const onSubmit = async () => {
    setSaving(true);
    const user = await getCurrentUser(); if (!user) return;
    try {
      if (editing) {
        const { error } = await supabase.from('orders').update({ ...form }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Pesanan diperbarui');
      } else {
        const { error } = await supabase.from('orders').insert([{ ...form, user_id: user.id }]);
        if (error) throw error;
        toast.success('Pesanan ditambahkan');
      }
      onSaved();
    } catch {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Pesanan' : 'Tambah Pesanan'}</div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Produk</label>
            <select name="product_id" value={form.product_id} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">Pilih produk</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Jumlah</label>
              <input name="quantity" type="number" value={form.quantity} min={1} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select name="status" value={form.status} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="pending">pending</option>
                <option value="diproses">diproses</option>
                <option value="dikirim">dikirim</option>
                <option value="selesai">selesai</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nama Pelanggan</label>
            <input name="customer_name" value={form.customer_name} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">No. Telepon</label>
              <input name="customer_phone" value={form.customer_phone} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">No. Resi</label>
              <input name="tracking_number" value={form.tracking_number} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Alamat</label>
            <textarea name="address" value={form.address || ''} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Catatan</label>
            <textarea name="note" value={form.note || ''} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Batal</button>
          <button onClick={onSubmit} disabled={saving} className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50 flex items-center gap-2"><Save className="h-4 w-4"/>Simpan</button>
        </div>
      </div>
    </div>
  );
}
