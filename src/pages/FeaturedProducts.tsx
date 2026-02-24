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
  Image as ImageIcon,
  Check,
  X,
  ChevronDown,
  Star,
  Package
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { FeaturedProduct, FeaturedProductVariant, Category, Product } from '../types';
import ImageUpload from '../components/ImageUpload';

export default function FeaturedProducts() {
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
    image_url: ''
  });

  // متغيرات المنتج (المقاس، اللون، المخزون) - id موجود عند التعديل
  const [variants, setVariants] = useState<Array<{ id?: number; size: string; color: string; quantity: string }>>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      console.log('Fetching featured products...');
      
      const [
        { data: productsData, error: productsError },
        { data: categoriesData, error: categoriesError }
      ] = await Promise.all([
        supabase.from('products').select(`
          *,
          variants:product_variants (
            id,
            size,
            color,
            quantity,
            sku
          )
        `).eq('is_featured', true).order('created_at', { ascending: false }),
        supabase.from('categories').select('id, name_ar, name_en')
      ]);

      // جلب التصنيفات يدوياً لكل منتج
      if (productsData && !productsError) {
        const productsWithCategories = await Promise.all(
          productsData.map(async (product: any) => {
            if (product.category_id) {
              const { data: category } = await supabase
                .from('categories')
                .select('id, name_ar, name_en')
                .eq('id', product.category_id)
                .single();
              
              return {
                ...product,
                category
              };
            }
            return product;
          })
        );
        
        console.log('Featured products with categories:', productsWithCategories);
        setProducts(productsWithCategories);
      } else {
        setProducts(productsData as any || []);
      }

      if (productsError) {
        console.error('Error fetching products:', productsError);
        alert('خطأ في جلب المنتجات المميزة: ' + productsError.message);
      }
      
      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
      }

      console.log('Products data:', productsData);
      console.log('Categories data:', categoriesData);
      
      setProducts(productsData as any || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('حدث خطأ أثناء جلب البيانات');
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
        image_url: product.image_url || ''
      });
      
      // Load existing variants
      if (product.variants && product.variants.length > 0) {
        setVariants(product.variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color,
          quantity: v.quantity.toString()
        })));
      } else {
        setVariants([{ size: '', color: '', quantity: '' }]);
      }
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
        image_url: ''
      });
      setVariants([{ size: '', color: '', quantity: '' }]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      name_ar: '',
      name_en: '',
      description_ar: '',
      description_en: '',
      price: '',
      original_price: '',
      category_id: '',
      image_url: ''
    });
    setVariants([{ size: '', color: '', quantity: '' }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name_ar || !formData.name_en || !formData.price) {
      alert('يرجى ملء الحقول المطلوبة');
      return;
    }

    if (variants.some(v => !v.size || !v.color || !v.quantity)) {
      alert('يرجى ملء جميع حقول المتغيرات أو حذف الفارغة');
      return;
    }

    try {
      const productData = {
        name_ar: formData.name_ar,
        name_en: formData.name_en,
        description_ar: formData.description_ar || null,
        description_en: formData.description_en || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        image_url: formData.image_url || null,
        is_featured: true  // دائماً مميز في هذه الصفحة
      };

      let productId: number;
      
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        
        if (error) throw error;
        productId = editingProduct.id;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single();
        
        if (error) throw error;
        productId = data.id;
      }

      // Handle variants
      if (editingProduct) {
        // Delete existing variants
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', editingProduct.id);
      }

      // Insert new variants
      const variantsData = variants
        .filter(v => v.size && v.color && v.quantity)
        .map(v => ({
          product_id: productId,
          size: v.size,
          color: v.color,
          quantity: parseInt(v.quantity)
        }));

      if (variantsData.length > 0) {
        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsData);
        
        if (variantsError) throw variantsError;
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('حدث خطأ أثناء حفظ المنتج');
    }
  };

  const handleDelete = async (product: Product) => {
    // Check if there are any pending orders for this product
    try {
      const { data: pendingOrders, error: ordersError } = await supabase
        .from('order_items')
        .select(`
          order_id,
          orders!inner(
            id,
            status
          )
        `)
        .eq('product_id', product.id)
        .in('orders.status', ['pending']);

      if (ordersError) {
        console.error('Error checking orders:', ordersError);
      }

      if (pendingOrders && pendingOrders.length > 0) {
        const orderIds = pendingOrders.map(item => `#${item.order_id.toString().padStart(5, '0')}`).join(', ');
        
        // Create a more detailed error message
        const errorMessage = `
⚠️ لا يمكن حذف هذا المنتج المميز

السبب: المنتج موجود في طلبات معلقة قيد الانتظار

رقم الطلبات المعنية:
${orderIds}

ملاحظات:
• عند تأكيد الطلب: سيتم خصم الكمية من المخزون الرئيسي
• عند إلغاء الطلب: ستعود الكمية للمخزون تلقائياً

يرجى معالجة الطلبات أولاً ثم محاولة الحذف مرة أخرى.
        `.trim();

        alert(errorMessage);
        return;
      }

      // If no pending orders, proceed with deletion
      if (!window.confirm(`هل أنت متأكد من حذف "${product.name_ar}"؟`)) return;
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', product.id);
      
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('حدث خطأ أثناء حذف المنتج');
    }
  };

  const addVariant = () => {
    setVariants([...variants, { size: '', color: '', quantity: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const filteredProducts = products.filter(product =>
    product.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.name_ar?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Star className="text-amber-500" size={36} />
            المنتجات المميزة
          </h1>
          <p className="text-brand-black/50 mt-1">إدارة المنتجات المميزة والمميزة في المتجر.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          إضافة منتج مميز
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={20} />
          <input 
            type="text" 
            placeholder="البحث بالاسم أو التصنيف..." 
            className="input-field pr-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card group hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="aspect-square bg-brand-gray/20 overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name_ar}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-black/20">
                  <ImageIcon size={48} />
                </div>
              )}
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-bold text-lg text-brand-black">{product.name_ar}</h3>
                <p className="text-sm text-brand-black/50">{product.name_en}</p>
                {product.category && (
                  <p className="text-xs text-brand-black/30 mt-1">{product.category.name_ar}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg text-brand-black">{formatCurrency(product.price)}</p>
                  {product.original_price && (
                    <p className="text-sm text-brand-black/40 line-through">{formatCurrency(product.original_price)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="text-amber-500 fill-amber-500" size={16} />
                  <span className="text-xs font-bold text-amber-600">مميز</span>
                </div>
              </div>

              {product.variants && product.variants.length > 0 && (
                <div className="text-xs text-brand-black/40">
                  {product.variants.length} متغير{product.variants.length > 1 ? 'ات' : ''}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => handleOpenModal(product)}
                  className="flex-1 btn-secondary py-2 text-sm"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(product)}
                  className="flex-1 btn-secondary py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-4 text-brand-black/20">
            <Star size={40} />
          </div>
          <p className="text-brand-black/40 font-bold">لم يتم العثور على منتجات مميزة</p>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-black text-brand-white">
                <h2 className="text-2xl font-bold">
                  {editingProduct ? 'تعديل منتج مميز' : 'إضافة منتج مميز جديد'}
                </h2>
                <button onClick={handleCloseModal} className="p-2 hover:bg-brand-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم بالعربية *</label>
                    <input
                      type="text"
                      required
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      className="input-field"
                      placeholder="أدخل اسم المنتج بالعربية"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الاسم بالإنجليزية *</label>
                    <input
                      type="text"
                      required
                      value={formData.name_en}
                      onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                      className="input-field"
                      placeholder="Enter product name in English"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">السعر *</label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40 font-bold">د.ج</span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="input-field pr-12"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">السعر الأصلي (اختياري)</label>
                    <div className="relative">
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-black/40 font-bold">د.ج</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.original_price}
                        onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                        className="input-field pr-12"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">التصنيف</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">اختر تصنيف</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name_ar}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold mb-2">الوصف بالعربية</label>
                    <textarea
                      rows={4}
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      className="input-field resize-none"
                      placeholder="أدخل وصف المنتج بالعربية..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2">الوصف بالإنجليزية</label>
                    <textarea
                      rows={4}
                      value={formData.description_en}
                      onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                      className="input-field resize-none"
                      placeholder="Enter product description in English..."
                    />
                  </div>
                </div>

                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                  label="صورة المنتج"
                />

                {/* Variants Section */}
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm">متغيرات المنتج</h3>
                      <p className="text-xs text-brand-black/40 mt-1">أضف المقاسات والألوان والكميات المتوفرة</p>
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
                    >
                      <Plus size={16} />
                      إضافة متغير
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {variants.map((variant, index) => (
                      <div key={index} className="flex gap-3 items-center p-3 bg-brand-gray/20 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="المقاس (مثال: M, L, XL)"
                            value={variant.size}
                            onChange={(e) => updateVariant(index, 'size', e.target.value)}
                            className="input-field text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="اللون (مثال: أحمر، أزرق)"
                            value={variant.color}
                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                            className="input-field text-sm"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="الكمية"
                            min="0"
                            value={variant.quantity}
                            onChange={(e) => updateVariant(index, 'quantity', e.target.value)}
                            className="input-field text-sm w-full"
                          />
                        </div>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف المتغير"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {variants.length === 0 && (
                    <div className="text-center py-8 text-brand-black/30">
                      <Package size={32} className="mx-auto mb-2" />
                      <p className="text-sm">لا توجد متغيرات مضافة</p>
                      <p className="text-xs mt-1">اضغط على "إضافة متغير" للبدء</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-brand-border">
                  <button type="submit" className="flex-1 btn-primary">
                    {editingProduct ? (
                      <span className="flex items-center justify-center gap-2">
                        <Check size={16} />
                        تحديث المنتج المميز
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Star size={16} />
                        إضافة منتج مميز
                      </span>
                    )}
                  </button>
                  <button type="button" onClick={handleCloseModal} className="flex-1 btn-secondary">
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
