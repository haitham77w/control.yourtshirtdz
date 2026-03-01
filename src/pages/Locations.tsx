import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, Edit2, Check, X, ChevronRight, Trash2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Wilaya, Baladiya } from '../types';
import { formatCurrency, cn } from '../lib/utils';

export default function Locations() {
  const [wilayas, setWilayas] = useState<Wilaya[]>([]);
  const [selectedWilaya, setSelectedWilaya] = useState<Wilaya | null>(null);
  const [baladiyas, setBaladiyas] = useState<Baladiya[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWilaya, setEditingWilaya] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ home: 0, desk: 0, active: true });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWilaya, setNewWilaya] = useState({
    code: '',
    name_ar: '',
    name_en: '',
    delivery_price_home: 0,
    delivery_price_desk: 0,
    active: true
  });

  useEffect(() => {
    fetchWilayas();
  }, []);

  async function fetchWilayas() {
    const { data } = await supabase.from('wilayas').select('*').order('id', { ascending: true });
    setWilayas(data || []);
  }

  async function fetchBaladiyas(wilayaId: number) {
    const { data } = await supabase.from('baladiyas').select('*').eq('wilaya_id', wilayaId).order('name_en', { ascending: true });
    setBaladiyas(data || []);
  }

  const handleWilayaClick = (wilaya: Wilaya) => {
    setSelectedWilaya(wilaya);
    fetchBaladiyas(wilaya.id);
  };

  const startEditing = (wilaya: Wilaya) => {
    setEditingWilaya(wilaya.id);
    setEditForm({
      home: wilaya.delivery_price_home,
      desk: wilaya.delivery_price_desk,
      active: wilaya.active
    });
  };

  const saveWilaya = async (id: number) => {
    try {
      await supabase.from('wilayas').update({
        delivery_price_home: editForm.home,
        delivery_price_desk: editForm.desk,
        active: editForm.active
      }).eq('id', id);
      setEditingWilaya(null);
      fetchWilayas();
    } catch (error) {
      console.error('Error updating wilaya:', error);
    }
  };

  const handleAddWilaya = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('wilayas').insert([newWilaya]);
      if (error) throw error;

      setShowAddModal(false);
      setNewWilaya({
        code: '',
        name_ar: '',
        name_en: '',
        delivery_price_home: 0,
        delivery_price_desk: 0,
        active: true
      });
      fetchWilayas();
    } catch (error) {
      console.error('Error adding wilaya:', error);
      alert('حدث خطأ أثناء إضافة الولاية. يرجى التأكد من كود الولاية (يجب أن يكون فريداً).');
    }
  };

  const filteredWilayas = wilayas.filter(w =>
    w.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.name_ar.includes(searchTerm) ||
    w.code.includes(searchTerm)
  );

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const filteredIds = filteredWilayas.map(w => w.id);
    const allSelected = filteredIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => new Set([...prev, ...filteredIds]));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`هل تريد حذف ${selectedIds.size} ولاية؟ قد يفشل الحذف إن كانت مرتبطة بطلبات.`)) return;
    try {
      await supabase.from('wilayas').delete().in('id', Array.from(selectedIds));
      setSelectedIds(new Set());
      fetchWilayas();
      if (selectedWilaya && selectedIds.has(selectedWilaya.id)) setSelectedWilaya(null);
    } catch (error) {
      console.error('Error deleting wilayas:', error);
      alert('فشل الحذف. قد تكون الولايات مرتبطة بطلبات أو بلديات.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">الشحن والمواقع</h1>
          <p className="text-brand-black/50 mt-1">إدارة أسعار التوصيل والمناطق النشطة.</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={deleteSelected}
              className="btn-secondary flex items-center gap-2 text-rose-600 hover:bg-rose-50 border-rose-200"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">حذف المحدد ({selectedIds.size})</span>
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="hidden sm:flex items-center gap-2 px-6 py-3 bg-brand-black text-brand-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={20} />
            إضافة ولاية جديدة
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wilayas List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={20} />
            <input
              type="text"
              placeholder="البحث عن ولاية..."
              className="input-field pr-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="glass-card overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-brand-border bg-brand-gray/50">
                    <th className="p-4 text-left w-12">
                      <input
                        type="checkbox"
                        checked={filteredWilayas.length > 0 && filteredWilayas.every(w => selectedIds.has(w.id))}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-brand-black"
                      />
                    </th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-brand-black/40 hidden sm:table-cell">الكود</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-brand-black/40">الولاية</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-brand-black/40">للمنزل (دج)</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-brand-black/40 hidden md:table-cell">للمكتب (دج)</th>
                    <th className="p-4 font-bold text-xs uppercase tracking-widest text-brand-black/40 hidden lg:table-cell">الحالة</th>
                    <th className="p-4 text-left"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredWilayas.map((wilaya) => (
                    <tr
                      key={wilaya.id}
                      onClick={() => handleWilayaClick(wilaya)}
                      className={cn(
                        "hover:bg-brand-gray/20 transition-colors cursor-pointer group",
                        selectedWilaya?.id === wilaya.id && "bg-brand-gray/40"
                      )}
                    >
                      <td className="p-4 text-left" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(wilaya.id)}
                          onChange={() => toggleSelect(wilaya.id)}
                          className="w-4 h-4 accent-brand-black"
                        />
                      </td>
                      <td className="p-4 font-mono text-sm hidden sm:table-cell">{wilaya.code}</td>
                      <td className="p-4">
                        <p className="font-bold text-sm">{wilaya.name_ar}</p>
                        <p className="text-xs text-brand-black/40 font-serif">{wilaya.name_en}</p>
                      </td>
                      <td className="p-4">
                        {editingWilaya === wilaya.id ? (
                          <input
                            type="number"
                            className="w-20 px-2 py-1 bg-brand-white border border-brand-border rounded"
                            value={editForm.home}
                            onChange={e => setEditForm({ ...editForm, home: parseFloat(e.target.value) })}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-sm font-medium">{formatCurrency(wilaya.delivery_price_home)}</span>
                        )}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {editingWilaya === wilaya.id ? (
                          <input
                            type="number"
                            className="w-20 px-2 py-1 bg-brand-white border border-brand-border rounded"
                            value={editForm.desk}
                            onChange={e => setEditForm({ ...editForm, desk: parseFloat(e.target.value) })}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-sm font-medium">{formatCurrency(wilaya.delivery_price_desk)}</span>
                        )}
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        {editingWilaya === wilaya.id ? (
                          <input
                            type="checkbox"
                            checked={editForm.active}
                            onChange={e => setEditForm({ ...editForm, active: e.target.checked })}
                            onClick={e => e.stopPropagation()}
                          />
                        ) : (
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            wilaya.active ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-brand-black/20"
                          )} />
                        )}
                      </td>
                      <td className="p-4 text-left">
                        {editingWilaya === wilaya.id ? (
                          <div className="flex gap-2 justify-start">
                            <button
                              onClick={(e) => { e.stopPropagation(); saveWilaya(wilaya.id); }}
                              className="p-1.5 bg-brand-black text-brand-white rounded-lg"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingWilaya(null); }}
                              className="p-1.5 bg-brand-gray rounded-lg"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); startEditing(wilaya); }}
                            className="p-2 hover:bg-brand-black hover:text-brand-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-brand-border max-h-[60vh] overflow-y-auto custom-scrollbar">
              {filteredWilayas.map((wilaya) => (
                <div
                  key={wilaya.id}
                  onClick={() => handleWilayaClick(wilaya)}
                  className={cn(
                    "p-4 active:bg-brand-gray/20 transition-colors",
                    selectedWilaya?.id === wilaya.id && "bg-brand-gray/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(wilaya.id)}
                        onChange={() => toggleSelect(wilaya.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-5 h-5 accent-brand-black rounded-lg"
                      />
                      <div>
                        <p className="font-bold text-brand-black">{wilaya.name_ar}</p>
                        <p className="text-[10px] text-brand-black/40 font-mono">#{wilaya.code}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight",
                      wilaya.active ? "bg-emerald-100 text-emerald-600" : "bg-brand-gray text-brand-black/40"
                    )}>
                      {wilaya.active ? 'نشط' : 'إيقاف'}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs mt-3">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-brand-black/40 block mb-0.5">المنزل</span>
                        <span className="font-bold">{formatCurrency(wilaya.delivery_price_home)}</span>
                      </div>
                      <div>
                        <span className="text-brand-black/40 block mb-0.5">المكتب</span>
                        <span className="font-bold">{formatCurrency(wilaya.delivery_price_desk)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); startEditing(wilaya); }}
                      className="p-2.5 bg-brand-gray rounded-xl"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Baladiyas Detail */}
          <div className="space-y-4">
            {selectedWilaya ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-6 h-full flex flex-col"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold">{selectedWilaya.name_ar}</h3>
                    <p className="text-brand-black/50 text-sm">قائمة البلديات</p>
                  </div>
                  <div className="p-3 bg-brand-black text-brand-white rounded-xl">
                    <MapPin size={20} />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {baladiyas.map((baladiya) => (
                    <div key={baladiya.id} className="p-3 bg-brand-gray/50 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">{baladiya.name_ar}</p>
                        <p className="text-xs text-brand-black/40 font-serif">{baladiya.name_en || 'N/A'}</p>
                      </div>
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        baladiya.active ? "bg-emerald-500" : "bg-brand-black/20"
                      )} />
                    </div>
                  ))}
                  {baladiyas.length === 0 && (
                    <p className="text-center text-brand-black/30 py-12">لم يتم العثور على بلديات لهذه الولاية.</p>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-4 h-full">
                <div className="w-16 h-16 bg-brand-gray rounded-full flex items-center justify-center text-brand-black/20">
                  <MapPin size={32} />
                </div>
                <div>
                  <p className="font-bold">اختر ولاية</p>
                  <p className="text-sm text-brand-black/40">انقر على ولاية لرؤية البلديات التابعة لها وإدارة الإعدادات الخاصة بها.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Add Wilaya Modal */}
        <AnimatePresence>
          {showAddModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddModal(false)}
                className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-brand-white rounded-3xl shadow-2xl overflow-hidden border border-brand-border"
              >
                <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-gray/50">
                  <div>
                    <h3 className="text-xl font-bold">إضافة ولاية جديدة</h3>
                    <p className="text-xs text-brand-black/50 mt-1">أدخل بيانات الولاية الجديدة لإضافتها إلى القائمة.</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-brand-gray rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleAddWilaya} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-black/60 px-1">كود الولاية (مثلاً 01)</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="01"
                        value={newWilaya.code}
                        onChange={e => setNewWilaya({ ...newWilaya, code: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 flex items-end pb-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-5 h-5 accent-brand-black rounded-lg"
                          checked={newWilaya.active}
                          onChange={e => setNewWilaya({ ...newWilaya, active: e.target.checked })}
                        />
                        <span className="text-sm font-bold">نشطة</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-black/60 px-1">اسم الولاية (عربي)</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="أدرار"
                        value={newWilaya.name_ar}
                        onChange={e => setNewWilaya({ ...newWilaya, name_ar: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-black/60 px-1">اسم الولاية (EN)</label>
                      <input
                        type="text"
                        required
                        className="input-field"
                        placeholder="Adrar"
                        value={newWilaya.name_en}
                        onChange={e => setNewWilaya({ ...newWilaya, name_en: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-black/60 px-1">سعر التوصيل للمنزل</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          className="input-field"
                          placeholder="800"
                          value={newWilaya.delivery_price_home || ''}
                          onChange={e => setNewWilaya({ ...newWilaya, delivery_price_home: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-black/30 pointer-events-none">دج</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-black/60 px-1">سعر التوصيل للمكتب</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          className="input-field"
                          placeholder="400"
                          value={newWilaya.delivery_price_desk || ''}
                          onChange={e => setNewWilaya({ ...newWilaya, delivery_price_desk: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-black/30 pointer-events-none">دج</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-brand-black text-brand-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                    >
                      حفظ الولاية
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-8 py-4 bg-brand-gray text-brand-black rounded-2xl font-bold hover:bg-brand-gray/80 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </motion.div >
  );
}
