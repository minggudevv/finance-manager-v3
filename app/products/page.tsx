'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase, getCurrentUser } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  category: string | null;
  price: number;
  stock: number;
  description: string | null;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) { router.push('/login'); return; }
      await loadProducts();
    })();
  }, []);

  const loadProducts = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) return toast.error('Gagal menghapus');
    toast.success('Produk dihapus');
    loadProducts();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16 md:pb-0">
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Produk</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Kelola daftar produk Anda</p>
            </div>
            <button
              onClick={() => { setEditing(null); setIsModalOpen(true); }}
              className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors w-full sm:w-auto"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tambah Produk
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">Memuat...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-gray-600 dark:text-gray-400">Belum ada produk</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Kategori</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Harga</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stok</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{p.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{p.category || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',minimumFractionDigits:0}).format(Number(p.price))}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">{p.stock}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => { setEditing(p); setIsModalOpen(true); }} className="text-blue-600 dark:text-blue-400 hover:underline"><Edit className="h-5 w-5" /></button>
                            <button onClick={() => handleDelete(p.id)} className="text-red-600 dark:text-red-400 hover:underline"><Trash2 className="h-5 w-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isModalOpen && <ProductModal editing={editing} onClose={() => setIsModalOpen(false)} onSaved={() => { setIsModalOpen(false); loadProducts(); }} />}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function ProductModal({ editing, onClose, onSaved }: { editing: Product | null; onClose: () => void; onSaved: () => void; }) {
  const [form, setForm] = useState({ name: '', category: '', price: 0, stock: 0, description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) setForm({
      name: editing.name || '',
      category: editing.category || '',
      price: Number(editing.price) || 0,
      stock: Number(editing.stock) || 0,
      description: editing.description || ''
    });
  }, [editing]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'price' || name === 'stock' ? Number(value) : value }));
  };

  const onSubmit = async () => {
    setSaving(true);
    const user = await getCurrentUser();
    if (!user) return;
    try {
      if (editing) {
        const { error } = await supabase.from('products').update({ ...form }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Produk diperbarui');
      } else {
        const { error } = await supabase.from('products').insert([{ ...form, user_id: user.id }]);
        if (error) throw error;
        toast.success('Produk ditambahkan');
      }
      onSaved();
    } catch (e) {
      toast.error('Gagal menyimpan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-full sm:max-w-lg border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Produk' : 'Tambah Produk'}</div>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nama</label>
            <input name="name" value={form.name} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
            <input name="category" value={form.category} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Harga</label>
              <input name="price" type="number" value={form.price} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Stok</label>
              <input name="stock" type="number" value={form.stock} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Deskripsi</label>
            <textarea name="description" value={form.description} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">Batal</button>
          <button onClick={onSubmit} disabled={saving} className="px-4 py-2 rounded bg-pink-600 text-white hover:bg-pink-700 disabled:opacity-50">Simpan</button>
        </div>
      </div>
    </div>
  );
}
