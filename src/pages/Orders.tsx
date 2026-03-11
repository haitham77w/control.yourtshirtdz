import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  ExternalLink,
  Phone,
  MapPin,
  Package,
  X,
  Trash2,
  ArrowRight,
  AlertCircle,
  Check,
  Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { Order, ToastType } from '../types';
import ConfirmModal from '../components/ConfirmModal';

const statusColors = {
  pending: "bg-amber-50 text-amber-600 border-amber-100",
  confirmed: "bg-blue-50 text-blue-600 border-blue-100",
  shipped: "bg-indigo-50 text-indigo-600 border-indigo-100",
  delivered: "bg-emerald-50 text-emerald-600 border-emerald-100",
  cancelled: "bg-rose-50 text-rose-600 border-rose-100",
};

const statusLabels = {
  pending: "قيد الانتظار",
  confirmed: "تم التأكيد",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغى",
};

interface OrdersProps {
  showToast: (message: string, type?: ToastType) => void;
}

export default function Orders({ showToast }: OrdersProps) {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; orderId: number | null }>({
    isOpen: false,
    orderId: null
  });

  const orderIdFromNotification = searchParams.get('id');
  const shouldHighlight = !!orderIdFromNotification;

  const tabs = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'الجديدة' },
    { id: 'confirmed', label: 'المؤكدة' },
    { id: 'shipped', label: 'قيد الشحن' },
    { id: 'delivered', label: 'المستلمة' },
    { id: 'cancelled', label: 'الملغاة/المرفوضة' },
  ];

  async function fetchOrders() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          wilaya:wilayas(*),
          baladiya:baladiyas(*),
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const sorted = (data as any[] || []).sort((a, b) => {
        const aPending = a.status === 'pending';
        const bPending = b.status === 'pending';
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      // Fetch product details for each order item
      const ordersWithProducts = await Promise.all(
        sorted.map(async (order) => {
          const itemsWithProducts = await Promise.all(
            (order.items || []).map(async (item) => {
              let product = null;
              let variant = null;

              if (item.product_id) {
                const { data: regularProduct } = await supabase
                  .from('products')
                  .select('*')
                  .eq('id', item.product_id)
                  .single();
                product = regularProduct;
              }

              if (!product && item.product_id) {
                const { data: featuredProduct } = await supabase
                  .from('featured_products')
                  .select('*')
                  .eq('id', item.product_id)
                  .single();
                product = featuredProduct;
              }

              if (item.variant_id) {
                const { data: variantData } = await supabase
                  .from('product_variants')
                  .select('*')
                  .eq('id', item.variant_id)
                  .single();
                variant = variantData;
              }

              return { ...item, product, variant };
            })
          );

          return { ...order, items: itemsWithProducts };
        })
      );

      setOrders(ordersWithProducts);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleContact = () => {
    if (!selectedOrder) return;
    const message = `مرحباً ${selectedOrder.first_name}، نحن من متجر "يور تيشرت" بخصوص طلبك رقم #${selectedOrder.id.toString().padStart(5, '0')}.`;
    window.open(`https://wa.me/${selectedOrder.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const updateStatus = async (orderId: number, newStatus: string, mode: 'normal' | 'reserved' = 'normal') => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          // If we had a column for reservation mode, we'd update it here
        })
        .eq('id', orderId);

      if (error) throw error;

      showToast(`تم تحديث حالة الطلب إلى: ${statusLabels[newStatus as keyof typeof statusLabels]}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      showToast('فشل تحديث الحالة', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    setUpdatingStatus(true);
    try {
      const { error: itemsErr } = await supabase.from('order_items').delete().eq('order_id', orderId);
      if (itemsErr) throw itemsErr;

      const { error } = await supabase.from('orders').delete().eq('id', orderId);
      if (error) throw error;

      showToast('تم حذف الطلب نهائياً');
      setSelectedOrder(null);
      setDeleteConfirm({ isOpen: false, orderId: null });
      fetchOrders();
    } catch (err: any) {
      console.error('Error deleting order:', err);
      showToast(`فشل الحذف: ${err.message}`, 'error');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = `${o.first_name} ${o.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm) ||
      o.id.toString().includes(searchTerm);

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && o.status === activeTab;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">الطلبات</h1>
          <p className="text-brand-black/50 mt-1">تتبع وإدارة طلبات الزبائن وتصنيفها.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={20} />
            <input
              type="text"
              placeholder="البحث بالاسم، الهاتف أو رقم الطلب..."
              className="input-field pr-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap border",
                activeTab === tab.id
                  ? "bg-brand-black text-brand-white border-brand-black shadow-lg"
                  : "bg-white text-brand-black/50 border-brand-border hover:border-brand-black/30"
              )}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span className={cn(
                  "mr-2 px-2 py-0.5 rounded-full text-[10px]",
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-brand-gray text-brand-black/40"
                )}>
                  {orders.filter(o => o.status === tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-brand-border bg-brand-gray/50">
                <th className="p-6 font-bold text-sm text-brand-black/60">رقم الطلب</th>
                <th className="p-6 font-bold text-sm text-brand-black/60">الزبون</th>
                <th className="p-6 font-bold text-sm text-brand-black/60 hidden md:table-cell">الموقع</th>
                <th className="p-6 font-bold text-sm text-brand-black/60">المبلغ</th>
                <th className="p-6 font-bold text-sm text-brand-black/60 hidden sm:table-cell">الحالة</th>
                <th className="p-6 font-bold text-sm text-brand-black/60 hidden lg:table-cell">التاريخ</th>
                <th className="p-6 font-bold text-sm text-brand-black/60 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  data-order-id={order.id}
                  className={cn(
                    "border-b border-brand-border hover:bg-brand-gray/20 transition-colors group",
                    shouldHighlight && order.id === parseInt(orderIdFromNotification || '0') && "bg-amber-50 border-amber-200 animate-pulse"
                  )}
                >
                  <td className="p-6">
                    <span className="font-mono font-bold text-brand-black/40">#{order.id.toString().padStart(5, '0')}</span>
                  </td>
                  <td className="p-6">
                    <div>
                      <p className="font-bold text-sm">{order.first_name} {order.last_name}</p>
                      <p className="text-xs text-brand-black/50">{order.phone}</p>
                    </div>
                  </td>
                  <td className="p-6 hidden md:table-cell">
                    <div className="text-sm">
                      <p className="font-medium">{order.wilaya?.name_ar}</p>
                      <p className="text-xs text-brand-black/50">{order.delivery_method === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'}</p>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="font-bold text-sm">{formatCurrency(order.total_amount)}</p>
                  </td>
                  <td className="p-6 hidden sm:table-cell">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border",
                      statusColors[order.status as keyof typeof statusColors]
                    )}>
                      {statusLabels[order.status as keyof typeof statusLabels]}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-brand-black/50 hidden lg:table-cell">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-6 text-left">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 hover:bg-brand-black hover:text-brand-white rounded-lg transition-all"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-brand-black/40">
                    لم يتم العثور على طلبات.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedOrder(null); setShowConfirmModal(false); }}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-brand-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-brand-border flex items-center justify-between bg-brand-black text-brand-white">
                <div>
                  <h2 className="text-2xl font-bold">تفاصيل الطلب</h2>
                  <p className="text-brand-white/60 text-sm font-mono">#{selectedOrder.id.toString().padStart(5, '0')}</p>
                </div>
                <button onClick={() => { setSelectedOrder(null); setShowConfirmModal(false); }} className="p-2 hover:bg-brand-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Customer Info */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-3 text-brand-black/40">
                          <Users size={18} />
                          <span className="text-xs font-bold uppercase tracking-widest">الزبون</span>
                        </div>
                        <div>
                          <p className="text-lg font-bold">{selectedOrder.first_name} {selectedOrder.last_name}</p>
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <Phone size={14} />
                            <a href={`tel:${selectedOrder.phone}`} className="hover:underline">{selectedOrder.phone}</a>
                          </div>
                          {selectedOrder.instagram_handle && (
                            <div className="flex items-center gap-2 mt-1 text-sm text-brand-black/60">
                              <ExternalLink size={14} />
                              <a href={`https://instagram.com/${selectedOrder.instagram_handle.replace('@', '')}`} target="_blank" className="hover:underline">
                                {selectedOrder.instagram_handle}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-3 text-brand-black/40">
                          <MapPin size={18} />
                          <span className="text-xs font-bold uppercase tracking-widest">الشحن</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold">{selectedOrder.wilaya?.name_ar} / {selectedOrder.wilaya?.name_en}</p>
                          <p className="text-sm text-brand-black/60">{selectedOrder.baladiya?.name_ar || selectedOrder.baladiya?.name_en}</p>
                          <p className="text-sm text-brand-black/60 mt-2">{selectedOrder.address}</p>
                          <div className="mt-3 inline-block px-3 py-1 bg-brand-gray rounded-lg text-xs font-bold">
                            {selectedOrder.delivery_method === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="glass-card overflow-hidden">
                      <div className="p-6 border-b border-brand-border bg-brand-gray/30">
                        <div className="flex items-center gap-3 text-brand-black/40">
                          <Package size={18} />
                          <span className="text-xs font-bold uppercase tracking-widest">المنتجات</span>
                        </div>
                      </div>
                      <div className="divide-y divide-brand-border">
                        {selectedOrder.items?.map((item) => (
                          <div key={item.id} className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-brand-gray rounded-xl overflow-hidden">
                                <img src={item.product?.image_url || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{item.product?.name_ar || 'منتج غير معروف'}</p>
                                <p className="text-xs text-brand-black/50">
                                  المقاس: {item.variant?.size} | اللون: {item.variant?.color}
                                </p>
                                <p className="text-xs mt-1">الكمية: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-bold">{formatCurrency(item.price_at_purchase * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-6 bg-brand-gray/20 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-brand-black/50">المجموع الفرعي</span>
                          <span>{formatCurrency(selectedOrder.total_amount - selectedOrder.shipping_fee)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-brand-black/50">رسوم الشحن</span>
                          <span>{formatCurrency(selectedOrder.shipping_fee)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 border-t border-brand-border">
                          <span>الإجمالي</span>
                          <span>{formatCurrency(selectedOrder.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="space-y-6">
                    <div className="glass-card p-6 space-y-6">
                      <div className="flex items-center gap-3 text-brand-black/40">
                        <Clock size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">إدارة الحالة</span>
                      </div>

                      {/* Status Timeline */}
                      <div className="relative">
                        <div className="absolute right-6 top-8 bottom-8 w-0.5 bg-brand-border"></div>

                        <div className="space-y-4">
                          {[
                            { id: 'pending', label: 'قيد الانتظار', icon: Clock, description: 'طلب جديد' },
                            { id: 'confirmed', label: 'تأكيد الطلب', icon: CheckCircle2, description: 'تم تأكيد الطلب' },
                            { id: 'shipped', label: 'تم الشحن', icon: Truck, description: 'الطلب في الطريق' },
                            { id: 'delivered', label: 'تم التوصيل', icon: CheckCircle2, description: 'تم تسليم الطلب' },
                            { id: 'cancelled', label: 'إلغاء الطلب', icon: XCircle, description: 'طلب ملغي' },
                          ].map((status, index) => {
                            const isActive = selectedOrder.status === status.id;
                            const isPast = index < [
                              'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
                            ].indexOf(selectedOrder.status);

                            return (
                              <div key={status.id} className="relative flex items-center gap-4">
                                {/* Status Node */}
                                <div className="relative z-10">
                                  <button
                                    onClick={() => updateStatus(selectedOrder.id, status.id)}
                                    className={cn(
                                      "w-12 h-12 rounded-full flex items-center justify-center transition-all border-2",
                                      isActive
                                        ? "bg-brand-black text-brand-white border-brand-black shadow-lg scale-110"
                                        : isPast
                                          ? "bg-emerald-500 text-white border-emerald-500"
                                          : "bg-brand-white text-brand-black/40 border-brand-border hover:border-brand-black/60 hover:scale-105"
                                    )}
                                  >
                                    <status.icon size={20} />
                                  </button>
                                  {isActive && (
                                    <div className="absolute -inset-1 bg-brand-black/20 rounded-full animate-ping"></div>
                                  )}
                                </div>

                                {/* Status Content */}
                                <div className="flex-1">
                                  <button
                                    onClick={() => updateStatus(selectedOrder.id, status.id)}
                                    className="w-full text-right group"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className={cn(
                                          "font-bold text-sm transition-colors",
                                          isActive ? "text-brand-black" : "text-brand-black/60 group-hover:text-brand-black"
                                        )}>
                                          {status.label}
                                        </p>
                                        <p className="text-xs text-brand-black/40 mt-0.5">
                                          {status.description}
                                        </p>
                                      </div>
                                      {isActive && (
                                        <Check className="text-emerald-500" size={16} />
                                      )}
                                      {!isActive && !isPast && (
                                        <ArrowRight className="text-brand-black/20 group-hover:text-brand-black/40 transition-colors" size={16} />
                                      )}
                                    </div>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {showConfirmModal && (
                      <div className="glass-card p-6 border-2 border-amber-200 bg-amber-50/50 space-y-4">
                        <p className="text-sm font-bold">طريقة خصم المخزون عند التأكيد:</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => updateStatus(selectedOrder.id, 'confirmed', 'normal')}
                            disabled={updatingStatus}
                            className="flex-1 btn-primary py-3 disabled:opacity-50"
                          >
                            {updatingStatus ? 'جاري الحفظ...' : 'عادي — خصم من المخزون'}
                          </button>
                          <button
                            onClick={() => updateStatus(selectedOrder.id, 'confirmed', 'reserved')}
                            disabled={updatingStatus}
                            className="flex-1 btn-secondary py-3 disabled:opacity-50"
                          >
                            قيد — مخزون مشتري مقيد
                          </button>
                        </div>
                        <button
                          onClick={() => setShowConfirmModal(false)}
                          className="w-full text-sm text-brand-black/50"
                        >
                          إلغاء
                        </button>
                      </div>
                    )}

                    <div className="glass-card p-6">
                      <button
                        onClick={handlePrint}
                        className="w-full btn-secondary flex items-center justify-center gap-2 mb-3"
                      >
                        طباعة الفاتورة
                      </button>
                      <button
                        onClick={handleContact}
                        className="w-full btn-secondary flex items-center justify-center gap-2 mb-3"
                      >
                        الاتصال بالزبون (واتساب)
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ isOpen: true, orderId: selectedOrder.id })}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all"
                      >
                        <Trash2 size={18} />
                        حذف الطلبية
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, orderId: null })}
        onConfirm={() => {
          if (deleteConfirm.orderId) handleDeleteOrder(deleteConfirm.orderId);
        }}
        title="حذف الطلب نهائياً؟"
        message="هل أنت متأكد من حذف هذا الطلب؟ سيتم إزالته وكافة بياناته من النظام بشكل دائم."
      />
    </motion.div>
  );
}
