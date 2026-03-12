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
  Copy,
  Zap
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { Category, Product, ProductVariant, ToastType } from '../types';
import ImageUpload from '../components/ImageUpload';
import ConfirmModal from '../components/ConfirmModal';

interface ProductsProps {
  showToast: (message: string, type?: ToastType) => void;
}

export default function Products({ showToast }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'stock-asc' | 'stock-desc'>('newest');
  const [filterCategory, setFilterCategory] = useState<string>('all');

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
    is_active: true,
    is_featured: false
  });

  // متغيرات المنتج (المقاس، اللون، المخزون) - id موجود عند التعديل
  const [variants, setVariants] = useState<Array<{ id?: number; size: string; color: string; quantity: string }>>([]);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null
  });

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
      showToast('فشل جلب البيانات', 'error');
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
        is_active: product.is_active,
        is_featured: product.is_featured || false
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
        is_active: true,
        is_featured: false
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

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<Array<{ ar: string; en: string }>>([]);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [productType, setProductType] = useState<'tshirt' | 'pants'>('tshirt');

  const PRESET_SIZES = {
    tshirt: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
    pants: ['28', '30', '32', '34', '36', '38', '40', '42']
  };

  const PRESET_COLORS = [
    { ar: 'أسود', en: 'Black' },
    { ar: 'أبيض', en: 'White' },
    { ar: 'رمادي', en: 'Grey' },
    { ar: 'كحلي', en: 'Navy' },
    { ar: 'أحمر', en: 'Red' },
    { ar: 'أزرق', en: 'Blue' },
    { ar: 'أخضر', en: 'Green' },
    { ar: 'أصفر', en: 'Yellow' }
  ];

  // Custom Shortcuts State
  const [customSizes, setCustomSizes] = useState<string[]>(() => {
    const saved = localStorage.getItem('custom_sizes');
    return saved ? JSON.parse(saved) : [];
  });
  const [customColors, setCustomColors] = useState<Array<{ ar: string; en: string }>>(() => {
    const saved = localStorage.getItem('custom_colors');
    return saved ? JSON.parse(saved) : [];
  });

  const [newSize, setNewSize] = useState('');
  const [newColorAr, setNewColorAr] = useState('');
  const [newColorEn, setNewColorEn] = useState('');

  useEffect(() => {
    localStorage.setItem('custom_sizes', JSON.stringify(customSizes));
  }, [customSizes]);

  useEffect(() => {
    localStorage.setItem('custom_colors', JSON.stringify(customColors));
  }, [customColors]);

  const addCustomSize = () => {
    if (newSize && !customSizes.includes(newSize)) {
      setCustomSizes([...customSizes, newSize]);
      setNewSize('');
    }
  };

  const removeCustomSize = (size: string) => {
    setCustomSizes(customSizes.filter(s => s !== size));
    setSelectedSizes(selectedSizes.filter(s => s !== size));
  };

  const addCustomColor = () => {
    if (newColorAr && newColorEn && !customColors.some(c => c.en === newColorEn)) {
      setCustomColors([...customColors, { ar: newColorAr, en: newColorEn }]);
      setNewColorAr('');
      setNewColorEn('');
    }
  };

  const removeCustomColor = (colorEn: string) => {
    setCustomColors(customColors.filter(c => c.en !== colorEn));
    setSelectedColors(selectedColors.filter(c => c.en !== colorEn));
  };

  const generateBulkVariants = () => {
    if (selectedSizes.length === 0 && selectedColors.length === 0) return;

    const newVariants: Array<{ size: string; color: string; quantity: string }> = [];

    // If only sizes are selected
    if (selectedSizes.length > 0 && selectedColors.length === 0) {
      selectedSizes.forEach(size => {
        newVariants.push({ size, color: '', quantity: '0' });
      });
    }
    // If only colors are selected
    else if (selectedSizes.length === 0 && selectedColors.length > 0) {
      selectedColors.forEach(color => {
        newVariants.push({ size: '', color: `${color.ar} / ${color.en}`, quantity: '0' });
      });
    }
    // If both are selected, generate combinations
    else {
      selectedSizes.forEach(size => {
        selectedColors.forEach(color => {
          newVariants.push({ size, color: `${color.ar} / ${color.en}`, quantity: '0' });
        });
      });
    }

    setVariants([...variants, ...newVariants]);
    // Reset selections after generating
    setSelectedSizes([]);
    setSelectedColors([]);
    setShowBulkAdd(false);
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
        if (updateErr) throw updateErr;
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
            if (updErr) throw updErr;
          } else {
            const { error: insErr } = await supabase.from('product_variants').insert([row]);
            if (insErr) throw insErr;
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
        if (insErr) throw insErr;
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
          if (vErr) throw vErr;
        }
      }

      setIsModalOpen(false);
      fetchData();
      showToast(editingProduct ? 'تم تحديث المنتج بنجاح' : 'تم إضافة المنتج بنجاح');
    } catch (error: any) {
      console.error('Error saving product:', error);
      showToast(`حدث خطأ: ${error.message}`, 'error');
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      const newFeaturedStatus = !product.is_featured;
      const { error } = await supabase
        .from('products')
        .update({ is_featured: newFeaturedStatus })
        .eq('id', product.id);

      showToast(newFeaturedStatus ? 'تم تمييز المنتج بنجمة' : 'تم إلغاء تمييز المنتج');
      fetchData();
    } catch (error: any) {
      console.error('Error toggling featured status:', error);
      showToast('حدث خطأ أثناء تحديث حالة المنتج المميز', 'error');
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      setLoading(true);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', product.id);

      if (orderItems?.length) {
        const orderIds = [...new Set(orderItems.map((oi: { order_id: number }) => oi.order_id))];
        const { data: orders } = await supabase
          .from('orders')
          .select('id, status')
          .in('id', orderIds);
        const pendingOrders = (orders || []).filter((o: { status: string }) => o.status === 'pending');
        if (pendingOrders.length > 0) {
          showToast(`يجب تأكيد حالة الطلبات المرتبطة (${pendingOrders.length} طلب قيد الانتظار) قبل الحذف.`, 'error');
          return;
        }
      }

      // Delete from Supabase first (relational constraints might apply)
      const { error: itemsErr } = await supabase.from('order_items').delete().eq('product_id', product.id);
      if (itemsErr) throw itemsErr;

      const { error: variantsErr } = await supabase.from('product_variants').delete().eq('product_id', product.id);
      if (variantsErr) throw variantsErr;

      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;

      // Delete images from Cloudinary
      const { deleteImage } = await import('../lib/cloudinary');
      const publicIds = product.images_public_ids || [];
      const imageUrls = product.images_urls || (product.image_url ? [product.image_url] : []);

      if (publicIds.length > 0) {
        await Promise.all(publicIds.map(pid => deleteImage(pid)));
      } else if (imageUrls.length > 0) {
        await Promise.all(imageUrls.map(url => deleteImage(url)));
      }

      fetchData();
      showToast('تم حذف المنتج وكافة بياناته بنجاح');
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showToast(`فشل الحذف: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name_en.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || p.category_id?.toString() === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;

      const getStock = (p: Product) => {
        const vList = p.variants || (p as any).product_variants || [];
        return vList.reduce((sum: number, v: ProductVariant) => sum + (v.quantity || 0), 0);
      };

      if (sortBy === 'stock-asc') return getStock(a) - getStock(b);
      if (sortBy === 'stock-desc') return getStock(b) - getStock(a);

      return 0;
    });

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
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <div className="relative min-w-[140px]">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40 pointer-events-none" size={16} />
            <select
              className="input-field pr-10 text-xs font-bold w-full bg-white cursor-pointer"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">جميع الأصناف</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id.toString()}>{cat.name_ar}</option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="relative min-w-[160px]">
            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-black/40 pointer-events-none" size={16} />
            <select
              className="input-field pl-10 text-xs font-bold w-full bg-white cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="newest">الأحدث أولاً</option>
              <option value="price-asc">السعر: من الأقل</option>
              <option value="price-desc">السعر: من الأعلى</option>
              <option value="stock-asc">المخزون: من الأقل</option>
              <option value="stock-desc">المخزون: من الأعلى</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-card overflow-hidden border border-brand-border">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-brand-gray/30">
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-brand-black/40">المنتج</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-brand-black/40 hidden md:table-cell">الصنف</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-brand-black/40">السعر</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-brand-black/40 hidden sm:table-cell">المخزون</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-brand-black/40 hidden lg:table-cell">تاريخ الإضافة</th>
                <th className="p-5 font-bold text-[11px] uppercase tracking-wider text-brand-black/40 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const productVariants = product.variants || (product as any).product_variants || [];
                const totalStock = productVariants.reduce((sum: number, v: ProductVariant) => sum + (v.quantity || 0), 0);

                const getStockBadge = (stock: number) => {
                  if (stock === 0) return <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black border border-rose-100 flex items-center gap-1 w-fit"><X size={10} /> نفذ</span>;
                  if (stock <= 5) return <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black border border-amber-100 flex items-center gap-1 w-fit"><Zap size={10} /> منخفض</span>;
                  return <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black border border-emerald-100 flex items-center gap-1 w-fit"><Check size={10} /> متوفر</span>;
                };

                return (
                  <tr key={product.id} className="border-b border-brand-border hover:bg-brand-gray/10 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-brand-gray/50 border border-brand-border flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                          {product.images_urls && product.images_urls.length > 0 ? (
                            <img src={product.images_urls[0]} alt={product.name_en} className="w-full h-full object-cover" />
                          ) : product.image_url ? (
                            <img src={product.image_url} alt={product.name_en} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-brand-black/20">
                              <ImageIcon size={20} />
                            </div>
                          )}
                          {product.is_featured && (
                            <div className="absolute top-1 right-1 p-1 bg-amber-400 text-white rounded-full shadow-lg">
                              <Star size={8} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-brand-black group-hover:text-brand-black transition-colors">{product.name_ar}</p>
                          <p className="text-[11px] text-brand-black/40 font-serif italic">{product.name_en}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-brand-gray rounded-lg border border-brand-border text-brand-black/60">
                        {product.category?.name_ar || 'غير مصنف'}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-bold text-sm text-brand-black">{formatCurrency(product.price)}</span>
                        {product.original_price && (
                          <span className="text-[10px] text-brand-black/30 line-through decoration-rose-500/30">
                            {formatCurrency(product.original_price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-5 hidden sm:table-cell">
                      <div className="flex flex-col gap-1.5">
                        {getStockBadge(totalStock)}
                        <span className="text-[10px] font-bold text-brand-black/40 pr-1">{totalStock} قطعة</span>
                      </div>
                    </td>
                    <td className="p-5 hidden lg:table-cell">
                      <span className="text-[10px] font-bold text-brand-black/40">
                        {new Date(product.created_at || '').toLocaleDateString('ar-DZ')}
                      </span>
                    </td>
                    <td className="p-5 text-left min-w-[150px]">
                      <div className="flex items-center justify-start gap-1">
                        <button
                          onClick={() => handleCopy(product)}
                          className="p-2.5 hover:bg-brand-black hover:text-white rounded-xl transition-all"
                          title="نسخ المنتج"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(product)}
                          className="p-2.5 hover:bg-brand-black hover:text-white rounded-xl transition-all"
                          title="تعديل"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => toggleFeatured(product)}
                          className={cn(
                            "p-2.5 rounded-xl transition-all",
                            product.is_featured
                              ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                              : "hover:bg-brand-black hover:text-white"
                          )}
                          title={product.is_featured ? "إلغاء التمييز" : "جعل المنتج مميزاً"}
                        >
                          <Star size={16} fill={product.is_featured ? "currentColor" : "none"} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ isOpen: true, product })}
                          className="p-2.5 hover:bg-rose-50 text-rose-500 rounded-xl transition-all"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-brand-black/30">
                      <Search size={40} strokeWidth={1} />
                      <p className="font-bold text-sm">لم يتم العثور على منتجات تطابق بحثك.</p>
                    </div>
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
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold">متغيرات المنتج (المقاس، اللون، المخزون)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBulkAdd(!showBulkAdd)}
                        className={cn(
                          "flex items-center gap-2 text-xs py-2 px-3 rounded-lg border transition-all",
                          showBulkAdd
                            ? "bg-brand-black text-white border-brand-black"
                            : "bg-white text-brand-black border-brand-border hover:bg-brand-gray"
                        )}
                      >
                        <Zap size={14} />
                        إضافة سريعة
                      </button>
                      <button
                        type="button"
                        onClick={addVariant}
                        className="btn-secondary flex items-center gap-2 text-xs py-2 px-3"
                      >
                        <Plus size={14} />
                        إضافة يدوي
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showBulkAdd && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 bg-brand-gray/30 rounded-2xl border border-brand-border space-y-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-brand-black/40 uppercase tracking-wider text-right">نوع المنتج</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => { setProductType('tshirt'); setSelectedSizes([]); }}
                                className={cn(
                                  "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                                  productType === 'tshirt' ? "bg-brand-black text-white border-brand-black" : "bg-white text-brand-black border-brand-border"
                                )}
                              >
                                تيشرت / قميص
                              </button>
                              <button
                                type="button"
                                onClick={() => { setProductType('pants'); setSelectedSizes([]); }}
                                className={cn(
                                  "flex-1 py-2 rounded-xl text-xs font-bold border transition-all",
                                  productType === 'pants' ? "bg-brand-black text-white border-brand-black" : "bg-white text-brand-black border-brand-border"
                                )}
                              >
                                سروال / بنطلون
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-brand-black/40 uppercase tracking-wider text-right">اختر المقاسات ({productType === 'tshirt' ? 'حروف' : 'أرقام'})</p>
                            <div className="flex flex-wrap gap-2">
                              {PRESET_SIZES[productType].map(size => (
                                <button
                                  key={size}
                                  type="button"
                                  onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all border",
                                    selectedSizes.includes(size)
                                      ? "bg-brand-black text-white border-brand-black"
                                      : "bg-white text-brand-black border-brand-border hover:border-brand-black/30"
                                  )}
                                >
                                  {size}
                                </button>
                              ))}
                              {customSizes.map(size => (
                                <div key={size} className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                                    className={cn(
                                      "px-3 py-1.5 rounded-full text-xs font-bold transition-all border pr-8",
                                      selectedSizes.includes(size)
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-300"
                                    )}
                                  >
                                    {size}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeCustomSize(size); }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="إضافة مقاس جديد..."
                                className="flex-1 text-[11px] py-1 px-3 border border-brand-border rounded-lg bg-white"
                                value={newSize}
                                onChange={e => setNewSize(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCustomSize())}
                              />
                              <button
                                type="button"
                                onClick={addCustomSize}
                                className="p-1 px-2 bg-brand-black text-white rounded-lg text-xs"
                              >
                                أضف
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-brand-black/40 uppercase tracking-wider text-right">اختر الألوان (لغتين)</p>
                            <div className="flex flex-wrap gap-2">
                              {PRESET_COLORS.map(color => (
                                <button
                                  key={color.en}
                                  type="button"
                                  onClick={() => setSelectedColors(prev =>
                                    prev.some(c => c.en === color.en)
                                      ? prev.filter(c => c.en !== color.en)
                                      : [...prev, color]
                                  )}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                                    selectedColors.some(c => c.en === color.en)
                                      ? "bg-brand-black text-white border-brand-black"
                                      : "bg-white text-brand-black border-brand-border hover:border-brand-black/30"
                                  )}
                                >
                                  {color.ar} / {color.en}
                                </button>
                              ))}
                              {customColors.map(color => (
                                <div key={color.en} className="relative group">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedColors(prev =>
                                      prev.some(c => c.en === color.en)
                                        ? prev.filter(c => c.en !== color.en)
                                        : [...prev, color]
                                    )}
                                    className={cn(
                                      "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border pr-8",
                                      selectedColors.some(c => c.en === color.en)
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-indigo-50 text-indigo-700 border-indigo-100 hover:border-indigo-300"
                                    )}
                                  >
                                    {color.ar} / {color.en}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeCustomColor(color.en); }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="اللون (بالعربية)..."
                                className="flex-1 text-[11px] py-1 px-3 border border-brand-border rounded-lg bg-white"
                                value={newColorAr}
                                onChange={e => setNewColorAr(e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="اللون (بالإنجليزي)..."
                                className="flex-1 text-[11px] py-1 px-3 border border-brand-border rounded-lg bg-white"
                                value={newColorEn}
                                onChange={e => setNewColorEn(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCustomColor())}
                              />
                              <button
                                type="button"
                                onClick={addCustomColor}
                                className="p-1 px-2 bg-brand-black text-white rounded-lg text-xs"
                              >
                                أضف
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={generateBulkVariants}
                            disabled={selectedSizes.length === 0 && selectedColors.length === 0}
                            className="w-full py-3 bg-brand-black text-white rounded-xl text-xs font-bold hover:bg-brand-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            توليد التشكيلات ({Math.max(1, selectedSizes.length) * Math.max(1, selectedColors.length)})
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
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

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, product: null })}
        onConfirm={() => {
          if (deleteConfirm.product) handleDelete(deleteConfirm.product);
        }}
        title="حذف المنتج؟"
        message={`هل أنت متأكد من حذف منتج "${deleteConfirm.product?.name_ar}"؟ سيتم حذف كافة المتغيرات والصور المرتبطة به نهائياً.`}
      />
    </motion.div>
  );
}
