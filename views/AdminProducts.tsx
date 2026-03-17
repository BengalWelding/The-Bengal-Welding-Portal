import React, { useEffect, useMemo, useState } from 'react';
import type { Product } from '../types';
import { createProduct, deleteProduct, listProducts, updateProduct } from '../lib/products';
import { supabase } from '../lib/supabase';

type ProductForm = Omit<Product, 'id'>;

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    category: '',
    price: 0,
    price_min: undefined,
    price_max: undefined,
    image: '',
  });
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProducts();
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      category: '',
      price: 0,
      price_min: undefined,
      price_max: undefined,
      image: '',
    });
    setUploadError(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      price: p.price,
      price_min: p.price_min,
      price_max: p.price_max,
      image: p.image,
    });
    setUploadError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setModalOpen(false);
    setEditing(null);
    setUploadError(null);
  };

  const handleUploadImage = async (file: File) => {
    setUploadError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'bin';
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('product-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      if (!data?.publicUrl) throw new Error('Failed to generate image URL');
      setForm((prev) => ({ ...prev, image: data.publicUrl }));
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setUploadError('Product name is required.');
      return;
    }
    if (!form.category.trim()) {
      setUploadError('Category is required.');
      return;
    }
    if (!form.description.trim()) {
      setUploadError('Description is required.');
      return;
    }
    if (!form.image.trim()) {
      setUploadError('Please upload a product image.');
      return;
    }
    if (!Number.isFinite(form.price) || form.price < 0) {
      setUploadError('Price must be a valid number.');
      return;
    }

    setSaving(true);
    setUploadError(null);
    try {
      if (editing) {
        const updated = await updateProduct(editing.id, {
          ...form,
        });
        setProducts((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
      } else {
        const created = await createProduct(form);
        setProducts((prev) => [created, ...prev]);
      }
      setModalOpen(false);
      setEditing(null);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!window.confirm(`Delete product "${p.name}"?`)) return;
    try {
      await deleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to delete product');
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 bg-black border border-[#333333] rounded-xl text-white text-sm focus:outline-none focus:border-[#F2C200] focus:ring-1 focus:ring-[#F2C200]/30';
  const labelClass = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#F2C200] tracking-tight">Products</h1>
          <p className="text-gray-500 text-sm font-bold mt-0.5">
            Manage the customer product catalog and images.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-[#F2C200] text-black hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-[#F2C2001A] shrink-0"
        >
          <i className="fas fa-plus"></i>
          <span>Add Product</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full max-w-md">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
          <input
            type="text"
            placeholder="Search name, category, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#333333] rounded-full text-sm text-white focus:outline-none focus:border-[#F2C200]"
          />
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-full text-xs font-bold bg-[#111111] border border-[#333333] text-gray-400 hover:border-[#F2C200] hover:text-white transition-all w-fit"
          title="Refresh"
        >
          <i className="fas fa-rotate-right mr-2" />
          Refresh
        </button>
      </div>

      <div className="bg-[#111111] rounded-2xl border border-[#333333] overflow-x-auto">
        {loading ? (
          <div className="p-12 text-center text-gray-500 font-bold text-sm">Loading...</div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 font-bold text-sm">{error}</div>
        ) : (
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-[#1A1A1A] border-b border-[#333333]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333333]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black border border-[#333333] overflow-hidden flex items-center justify-center">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <i className="fas fa-image text-gray-700" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-500 truncate max-w-[36rem]">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-300">{p.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-[#F2C200]">
                      £{Number(p.price_min ?? p.price).toLocaleString()}+
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-[#333333] text-[#F2C200] hover:bg-[#F2C200] hover:text-black transition-all"
                      >
                        <i className="fas fa-pen text-[10px]" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-red-900/40 text-red-400 border border-red-800/50 hover:bg-red-800/40 transition-all"
                      >
                        <i className="fas fa-trash-alt text-[10px]" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-bold text-sm">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[650] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#111111] border border-[#333333] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
            <div className="p-6 border-b border-[#333333] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {editing ? 'Edit Product' : 'Add Product'}
                </h2>
                <p className="text-sm text-gray-500 font-bold mt-0.5">
                  Upload an image and set pricing fields to match the customer catalog layout.
                </p>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-white p-1 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {(uploadError || error) && (
                <div className="px-4 py-2 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-sm font-bold">
                  {uploadError || error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Product name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Extraction Hood"
                  />
                </div>

                <div>
                  <label className={labelClass}>Category *</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Ventilation"
                  />
                </div>

                <div>
                  <label className={labelClass}>Base price (£) *</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: Math.max(0, Number(e.target.value) || 0) }))}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Min price (£)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price_min ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((p) => ({ ...p, price_min: v === '' ? undefined : Math.max(0, Number(v) || 0) }));
                    }}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className={labelClass}>Max price (£)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.price_max ?? ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((p) => ({ ...p, price_max: v === '' ? undefined : Math.max(0, Number(v) || 0) }));
                    }}
                    className={inputClass}
                    placeholder="Optional"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Description *</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    className={`${inputClass} resize-none`}
                    placeholder="Short customer-facing description..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Product image *</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="w-full sm:w-40 aspect-square rounded-2xl bg-black border border-[#333333] overflow-hidden flex items-center justify-center">
                      {form.image ? (
                        <img src={form.image} alt="Preview" className="w-full h-full object-contain p-3" />
                      ) : (
                        <div className="text-center text-gray-600 text-xs font-bold px-4">
                          No image yet
                        </div>
                      )}
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUploadImage(f);
                          e.currentTarget.value = '';
                        }}
                        className="block w-full text-sm text-gray-300 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#F2C200] file:text-black hover:file:brightness-110 cursor-pointer"
                        disabled={uploading || saving}
                      />
                      <p className="mt-1 text-[11px] text-gray-500 font-bold">
                        {uploading ? 'Uploading image...' : 'Upload a PNG/JPG/WebP image.'}
                      </p>
                      {!!form.image && (
                        <p className="mt-2 text-[11px] text-gray-600 break-all">
                          {form.image}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#333333] flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={saving || uploading}
                className="px-5 py-2.5 rounded-lg font-bold text-sm bg-transparent border border-[#333333] text-gray-300 hover:border-[#F2C200] hover:text-white transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm bg-[#F2C200] text-black hover:brightness-110 disabled:opacity-60 transition-colors shadow-lg shadow-[#F2C2001A]"
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-sm"></i>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-check text-sm"></i>
                    <span>{editing ? 'Update Product' : 'Add Product'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

