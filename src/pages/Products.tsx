import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Star,
  Image as ImageIcon,
  Check,
  X,
  ChevronDown,
  Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { Product, Category, ProductVariant } from '../types';
import ImageUpload from '../components/ImageUpload';
import { deleteImage } from '../lib/cloudinary';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    description_ar: '',
    description_en: '',
    price: '',
    original_price: '',
    category_id: '',
    images_urls: [] as string[],
    images_public_ids: [] as string[],
    is_active: true
  });

  // متغيرات المنتج (المقاس، اللون، المخزون) - id موجود عند التعديل
  const [variants, setVariants] = useState<Array<{ id?: number; size: string; color: string; quantity: string }>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [
        { data: productsData },
        { data: categoriesData }
      ] = await Promise.all([
        supabase.from('products').select('*, category:categories(*), variants:product_variants(*)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*')
      ]);

      setProducts(productsData as any || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (product: Product | null = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name_ar: product.name_ar,
        name_en: product.name_en,
        description_ar: product.description_ar || '',
        description_en: product.description_en || '',
        price: product.price.toString(),
        original_price: product.original_price?.toString() || '',
        category_id: product.category_id?.toString() || '',
        images_urls: product.images_urls || [],
        images_public_ids: product.images_public_ids || [],
        is_active: product.is_active
      });
      const vList = product.variants || (product as any).product_variants || [];
      setVariants(
        vList.map((v: ProductVariant) => ({
          id: v.id,
          size: v.size || '',
          color: v.color || '',
          quantity: v.quantity.toString()
        }))
      );
    } else {
      setEditingProduct(null);
      setFormData({
        name_ar: '',
        name_en: '',
        description_ar: '',
        description_en: '',
        price: '',
        original_price: '',
        category_id: '',
        images_urls: [],
        images_public_ids: [],
        is_active: true
      });
      setVariants([]);
    }
    setIsModalOpen(true);
  };

  const handleCopy = (product: Product) => {
    // Open modal with product data but treat as new product
    setEditingProduct(null);
    setFormData({
      name_ar: `${product.name_ar} (نسخة)`,
      name_en: `${product.name_en} - copy`,
      description_ar: product.description_ar || '',
      description_en: product.description_en || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category_id: product.category_id?.toString() || '',
      images_urls: product.images_urls || [],
      images_public_ids: product.images_public_ids || [],
      is_active: product.is_active
    });

    const vList = product.variants || (product as any).product_variants || [];
    setVariants(
      vList.map((v: ProductVariant) => ({
        // We strip the ID so it's created as a new record
        size: v.size || '',
        color: v.color || '',
        quantity: v.quantity.toString()
      }))
    );
    setIsModalOpen(true);
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', quantity: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: 'size' | 'color' | 'quantity', value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // تجهيز البيانات للإرسال مع حذف image_url القديم إن وجد
    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      original_price: formData.original_price ? parseFloat(formData.original_price) : null,
      category_id: formData.category_id ? parseInt(formData.category_id) : null,
    };

    try {
      let productId: number;
      if (editingProduct) {
        const { error: updateErr } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (updateErr) {
          alert(`فشل تحديث المنتج: ${updateErr.message}`);
          return;
        }
        productId = editingProduct.id;

        const validVariants = variants.filter(v => v.size.trim() || v.color.trim());
        for (const v of validVariants) {
          const q = parseInt(String(v.quantity), 10);
          const row = {
            product_id: productId,
            size: v.size.trim() || '-',
            color: v.color.trim() || '-',
            quantity: isNaN(q) ? 0 : Math.max(0, q)
          };
          if (v.id) {
            const { error: updErr } = await supabase
              .from('product_variants')
              .update({ size: row.size, color: row.color, quantity: row.quantity })
              .eq('id', v.id);
            if (updErr) {
              alert(`فشل تحديث المتغير: ${updErr.message}`);
              return;
            }
          } else {
            const { error: insErr } = await supabase.from('product_variants').insert([row]);
            if (insErr) {
              alert(`فشل إضافة المتغير: ${insErr.message}`);
              return;
            }
          }
        }
        const keptIds = validVariants.filter(v => v.id).map(v => v.id!);
        const existingList = editingProduct.variants || (editingProduct as any).product_variants || [];
        const existingIds = (existingList as ProductVariant[]).map(v => v.id);
        const toDelete = existingIds.filter(id => !keptIds.includes(id));
        for (const id of toDelete) {
          const { error: delErr } = await supabase.from('product_variants').delete().eq('id', id);
          if (delErr) {
            console.warn('لم يُحذف المتغير (ربما مرتبط بطلبات):', id, delErr.message);
          }
        }
      } else {
        const { data: inserted, error: insErr } = await supabase.from('products').insert([payload]).select('id').single();
        if (insErr) {
          alert(`فشل إضافة المنتج: ${insErr.message}`);
          return;
        }
        productId = inserted?.id;
        if (!productId) return;

        const variantsPayload = variants
          .filter(v => v.size.trim() || v.color.trim())
          .map(v => {
            const q = parseInt(String(v.quantity), 10);
            return {
              product_id: productId,
              size: v.size.trim() || '-',
              color: v.color.trim() || '-',
              quantity: isNaN(q) ? 0 : Math.max(0, q)
            };
          });
        if (variantsPayload.length > 0) {
          const { error: vErr } = await supabase.from('product_variants').insert(variantsPayload);
          if (vErr) {
            alert(`فشل إضافة المتغيرات: ${vErr.message}`);
            return;
          }
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(`حدث خطأ: ${error instanceof Error ? error.message : 'غير معروف'}`);
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const newFeaturedStatus = !product.is_featured;
      const { error } = await supabase
        .from('products')
        .update({ is_featured: newFeaturedStatus })
        .eq('id', product.id);

      if (error) throw error;

      fetchData();
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('حدث خطأ أثناء تحديث حالة المنتج المميز');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;

    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', id);

      if (orderItems?.length) {
        const orderIds = [...new Set(orderItems.map((oi: { order_id: number }) => oi.order_id))];
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status')
          .in('id', orderIds);
        const pendingOrders = (orders || []).filter((o: { status: string }) => o.status === 'pending');
        if (pendingOrders.length > 0) {
          alert(`يجب تأكيد حالة الطلبات المرتبطة بهذا المنتج (${pendingOrders.length} طلب قيد الانتظار) قبل الحذف.`);
          return;
        }
      }

      const { error: itemsErr } = await supabase.from('order_items').delete().eq('product_id', id);
      if (itemsErr) {
        alert(`فشل حذف بنود الطلبات: ${itemsErr.message}`);
        return;
      }
      const { error: variantsErr } = await supabase.from('product_variants').delete().eq('product_id', id);
      if (variantsErr) {
        alert(`فشل حذف المتغيرات: ${variantsErr.message}`);
        return;
      }
      const productToDelete = products.find(p => p.id === id);
      const publicIds = productToDelete?.images_public_ids || [];
      const imageUrls = productToDelete?.images_urls || (productToDelete?.image_url ? [productToDelete.image_url] : []);

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      // حذف جميع الصور من Cloudinary
      if (publicIds.length > 0) {
        await Promise.all(publicIds.map(pid => deleteImage(pid)));
      } else if (imageUrls.length > 0) {
        await Promise.all(imageUrls.map(url => deleteImage(url)));
      }

      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`فشل الحذف: ${error instanceof Error ? error.message : 'غير معروف'}`);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">المنتجات</h1>
          <p className="text-brand-black/50 mt-1">إدارة مخزون المتجر والمتغيرات.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={20} />
          إضافة منتج
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={20} />
          <input
            type="text"
            placeholder="البحث عن المنتجات..."
            className="input-field pr-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Filter size={18} />
            تصفية
          </button>
          <button className="btn-secondary flex items-center gap-2">
            الصنف
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-brand-gray/50">
                <th className="p-6 font-bold text-sm text-brand-black/60">المنتج</th>
                <th className="p-6 font-bold text-sm text-brand-black/60 hidden md:table-cell">الصنف</th>
                <th className="p-6 font-bold text-sm text-brand-black/60">السعر</th>
                <th className="p-6 font-bold text-sm text-brand-black/60 hidden sm:table-cell">الحالة</th>
                <th className="p-6 font-bold text-sm text-brand-black/60 hidden lg:table-cell">تاريخ الإنشاء</th>
                <th className="p-6 font-bold text-sm text-brand-black/60 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-brand-border hover:bg-brand-gray/20 transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-gray flex-shrink-0">
                        {product.images_urls && product.images_urls.length > 0 ? (
                          <img src={product.images_urls[0]} alt={product.name_en} className="w-full h-full object-cover" />
                        ) : product.image_url ? (
                          <img src={product.image_url} alt={product.name_en} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-black/20">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{product.name_ar}</p>
                        <p className="text-xs text-brand-black/50 font-serif italic">{product.name_en}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 hidden md:table-cell">
                    <span className="text-sm font-medium px-3 py-1 bg-brand-gray rounded-full">
                      {product.category?.name_ar || 'غير مصنف'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="text-sm">
                      <p className="font-bold">{formatCurrency(product.price)}</p>
                      {product.original_price && (
                        <p className="text-xs text-brand-black/40 line-through">{formatCurrency(product.original_price)}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-6 hidden sm:table-cell">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                      product.is_active ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                      {product.is_active ? <Check size={12} /> : <X size={12} />}
                      {product.is_active ? 'نشط' : 'غير نشط'}
                    </div>
                  </td>
                  <td className="p-6 text-sm text-brand-black/50 hidden lg:table-cell">
                    {new Date(product.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-6 text-left">
                    <div className="flex items-center justify-start gap-2">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="p-2 hover:bg-brand-black hover:text-brand-white rounded-lg transition-all"
                        title="تعديل المنتج"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleCopy(product)}
                        className="p-2 hover:bg-brand-black hover:text-brand-white rounded-lg transition-all"
                        title="نسخ المنتج"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={() => toggleFeatured(product)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          product.is_featured
                            ? "bg-amber-500 text-brand-white hover:bg-amber-600"
                            : "hover:bg-brand-black hover:text-brand-white"
                        )}
                        title={product.is_featured ? "إلغاء التمييز" : "جعل المنتج مميزاً"}
                      >
                        <Star size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 hover:bg-rose-500 hover:text-brand-white rounded-lg transition-all"
                        title="حذف المنتج"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-brand-black/40">
                    لم يتم العثور على منتجات.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between">
                <h2 className="text-2xl font-bold">{editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-gray rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">الاسم (بالعربية)</label>
                    <input
                      required
                      dir="rtl"
                      type="text"
                      className="input-field"
                      value={formData.name_ar}
                      onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">الاسم (بالإنجليزي)</label>
                    <input
                      required
                      type="text"
                      className="input-field"
                      value={formData.name_en}
                      onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">السعر (دج)</label>
                    <input
                      required
                      type="number"
                      className="input-field"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">السعر الأصلي (دج)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.original_price}
                      onChange={e => setFormData({ ...formData, original_price: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold">الصنف</label>
                  <select
                    className="input-field"
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">اختر الصنف</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name_ar} / {cat.name_en}</option>
                    ))}
                  </select>
                </div>

                <ImageUpload
                  label="صور المنتج"
                  urls={formData.images_urls}
                  publicIds={formData.images_public_ids}
                  onChange={(urls, pids) => setFormData({ ...formData, images_urls: urls, images_public_ids: pids })}
                />

                {/* متغيرات المنتج */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold">متغيرات المنتج (المقاس، اللون، المخزون)</label>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="btn-secondary flex items-center gap-2 text-sm py-2"
                    >
                      <Plus size={16} />
                      إضافة متغير
                    </button>
                  </div>
                  {variants.length > 0 && (
                    <div className="border border-brand-border rounded-xl overflow-hidden">
                      <div className="grid grid-cols-12 gap-2 p-3 bg-brand-gray/50 text-xs font-bold text-brand-black/60">
                        <div className="col-span-2">المقاس</div>
                        <div className="col-span-2">اللون</div>
                        <div className="col-span-2">المخزون</div>
                        <div className="col-span-6 text-left">إجراء</div>
                      </div>
                      {variants.map((v, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 p-3 border-t border-brand-border items-center">
                          <div className="col-span-2">
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="مثال: M, L"
                              className="input-field text-sm py-2"
                              value={v.size}
                              onChange={e => updateVariant(i, 'size', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="text"
                              dir="rtl"
                              placeholder="مثال: أحمر"
                              className="input-field text-sm py-2"
                              value={v.color}
                              onChange={e => updateVariant(i, 'color', e.target.value)}
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="input-field text-sm py-2"
                              value={v.quantity}
                              onChange={e => updateVariant(i, 'quantity', e.target.value)}
                              title="المخزون - يُخصم منه عند تأكيد الطلبية"
                            />
                          </div>
                          <div className="col-span-6 text-left">
                            <button
                              type="button"
                              onClick={() => removeVariant(i)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold">الوصف (بالعربية)</label>
                    <textarea
                      dir="rtl"
                      className="input-field h-24 resize-none"
                      value={formData.description_ar}
                      onChange={e => setFormData({ ...formData, description_ar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold">الوصف (بالإنجليزي)</label>
                    <textarea
                      className="input-field h-24 resize-none"
                      value={formData.description_en}
                      onChange={e => setFormData({ ...formData, description_en: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    className="w-5 h-5 accent-brand-black"
                    checked={formData.is_active}
                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  <label htmlFor="is_active" className="text-sm font-bold">المنتج نشط ومرئي للجميع</label>
                </div>

                <div className="pt-6 flex gap-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">إلغاء</button>
                  <button type="submit" className="btn-primary flex-1">حفظ المنتج</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
