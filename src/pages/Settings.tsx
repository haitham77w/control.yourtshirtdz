import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, Globe, Phone, Instagram, Facebook, Map, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsType } from '../types';
import ImageUpload from '../components/ImageUpload';

export default function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    const { data } = await supabase.from('settings').select('*').single();
    setSettings(data);
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    try {
      await supabase.from('settings').update(settings).eq('id', settings.id);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center">جاري تحميل الإعدادات...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">إعدادات المتجر</h1>
          <p className="text-brand-black/50 mt-1">تكوين مظهر موقعك ومعلومات الاتصال.</p>
        </div>
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100"
            >
              <CheckCircle2 size={18} />
              تم حفظ الإعدادات
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSave} className="space-y-8 pb-12">
        {/* General Info */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-brand-border pb-4">
            <Globe size={20} className="text-brand-black/40" />
            <h3 className="text-xl font-bold">معلومات عامة</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold">اسم الموقع</label>
              <input 
                className="input-field" 
                value={settings?.site_name || ''} 
                onChange={e => setSettings({...settings!, site_name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={16} />
                <input 
                  className="input-field pr-12" 
                  value={settings?.phone_number || ''} 
                  onChange={e => setSettings({...settings!, phone_number: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload 
              label="شعار الموقع"
              value={settings?.site_logo || ''}
              onChange={url => setSettings({...settings!, site_logo: url})}
            />
            <ImageUpload 
              label="الفافيكون (Favicon)"
              value={settings?.favicon || ''}
              onChange={url => setSettings({...settings!, favicon: url})}
            />
          </div>
        </div>

        {/* About Section */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-brand-border pb-4">
            <ImageIcon size={20} className="text-brand-black/40" />
            <h3 className="text-xl font-bold">قسم "عن المتجر"</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold">الوصف (بالعربية)</label>
              <textarea 
                dir="rtl"
                className="input-field h-32 resize-none" 
                value={settings?.about_description_ar || ''} 
                onChange={e => setSettings({...settings!, about_description_ar: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">الوصف (بالإنجليزي)</label>
              <textarea 
                className="input-field h-32 resize-none" 
                value={settings?.about_description_en || ''} 
                onChange={e => setSettings({...settings!, about_description_en: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Social & Maps */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-brand-border pb-4">
            <Instagram size={20} className="text-brand-black/40" />
            <h3 className="text-xl font-bold">التواصل والروابط</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold">رابط إنستغرام</label>
              <div className="relative">
                <Instagram className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={16} />
                <input 
                  className="input-field pr-12" 
                  value={settings?.instagram_url || ''} 
                  onChange={e => setSettings({...settings!, instagram_url: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold">رابط فيسبوك</label>
              <div className="relative">
                <Facebook className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={16} />
                <input 
                  className="input-field pr-12" 
                  value={settings?.facebook_url || ''} 
                  onChange={e => setSettings({...settings!, facebook_url: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">موقع المتجر (رابط تضمين خرائط جوجل)</label>
            <div className="relative">
              <Map className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={16} />
              <input 
                className="input-field pr-12" 
                value={settings?.store_location_url || ''} 
                onChange={e => setSettings({...settings!, store_location_url: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={saving}
            className="btn-primary flex items-center gap-3 px-12 py-4 text-lg"
          >
            {saving ? 'جاري الحفظ...' : (
              <>
                <Save size={20} />
                حفظ جميع التغييرات
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
