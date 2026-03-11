import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';
import ImageUpload from '../components/ImageUpload';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    image_url: '',
    image_public_id: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    setLoading(true);
    try {
      const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: false });
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = (category: Category | null = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name_ar: category.name_ar,
        name_en: category.name_en,
        image_url: category.image_url || '',
        image_public_id: category.image_public_id || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({ name_ar: '', name_en: '', image_url: '', image_public_id: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const { error } = await supabase.from('categories').update(formData).eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([formData]);
        if (error) throw error;
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(`فشل الحفظ: ${error instanceof Error ? error.message : 'غير معروف'}`);
    }
  };

  const handleDelete = async (category: Category) => {
    if (window.confirm(`هل أنت متأكد من حذف صنف "${category.name_ar}"؟ قد يؤثر هذا على المنتجات المرتبطة به. سيتم حذف الصورة نهائياً من Cloudinary.`)) {
      try {
        setLoading(true);

        // 1. Delete from Cloudinary first
        if (category.image_public_id) {
          const { deleteImage } = await import('../lib/cloudinary');
          await deleteImage(category.image_public_id);
        } else if (category.image_url) {
          const { deleteImage } = await import('../lib/cloudinary');
          await deleteImage(category.image_url);
        }

        // 2. Delete from Supabase
        const { error } = await supabase.from('categories').delete().eq('id', category.id);
        if (error) throw error;

        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(`فشل حذف الصنف: ${error instanceof Error ? error.message : 'غير معروف'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">الأصناف</h1>
          <p className="text-brand-black/50 mt-1">تنظيم منتجاتك في مجموعات.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> إضافة صنف
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            layout
            className="glass-card group overflow-hidden"
          >
            <div className="h-48 bg-brand-gray relative overflow-hidden">
              {category.image_url ? (
                <img src={category.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-black/20">
                  <ImageIcon size={40} />
                </div>
              )}
              <div className="absolute inset-0 bg-brand-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="p-3 bg-brand-white text-brand-black rounded-full hover:scale-110 transition-transform relative z-30"
                  type="button"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-3 bg-rose-500 text-brand-white rounded-full hover:scale-110 transition-transform relative z-30"
                  type="button"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold">{category.name_ar}</h3>
              <p className="text-brand-black/50 font-serif italic">{category.name_en}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-brand-white rounded-3xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold mb-6">{editingCategory ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold">الاسم (بالعربية)</label>
                  <input required dir="rtl" className="input-field" value={formData.name_ar} onChange={e => setFormData({ ...formData, name_ar: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold">الاسم (بالإنجليزي)</label>
                  <input required className="input-field" value={formData.name_en} onChange={e => setFormData({ ...formData, name_en: e.target.value })} />
                </div>
                <ImageUpload
                  label="صورة الصنف"
                  urls={formData.image_url ? [formData.image_url] : []}
                  publicIds={formData.image_public_id ? [formData.image_public_id] : []}
                  onChange={(urls, pids) => setFormData({
                    ...formData,
                    image_url: urls[0] || '',
                    image_public_id: pids[0] || ''
                  })}
                />
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">إلغاء</button>
                  <button type="submit" className="btn-primary flex-1">حفظ</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
