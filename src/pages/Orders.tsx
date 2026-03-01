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
import { Order } from '../types';

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

export default function Orders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Get order ID and highlight flag from URL params
  const orderIdFromNotification = searchParams.get('order');
  const shouldHighlight = searchParams.get('highlight') === 'true';

  useEffect(() => {
    fetchOrders();
  }, []);

  // Auto-open and highlight order from notification
  useEffect(() => {
    if (orderIdFromNotification && orders.length > 0) {
      const targetOrder = orders.find(o => o.id === parseInt(orderIdFromNotification));
      if (targetOrder) {
        setSelectedOrder(targetOrder);

        // Scroll to the order in the table
        setTimeout(() => {
          const orderRow = document.querySelector(`[data-order-id="${targetOrder.id}"]`);
          if (orderRow) {
            orderRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [orderIdFromNotification, orders]);

  const FINAL_STATUSES = ['confirmed', 'shipped', 'delivered', 'cancelled'];
  const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

  async function fetchOrders() {
    setLoading(true);
    try {
      const fiveDaysAgo = new Date(Date.now() - FIVE_DAYS_MS).toISOString();
      const { data: oldOrders } = await supabase
        .from('orders')
        .select('id')
        .in('status', FINAL_STATUSES)
        .lt('created_at', fiveDaysAgo);

      if (oldOrders?.length) {
        await supabase.from('orders').delete().in('id', oldOrders.map(o => o.id));
      }

      const { data } = await supabase
        .from('orders')
        .select(`
          *,
          wilaya:wilayas(*),
          baladiya:baladiyas(*),
          items:order_items(*)
        `)
        .order('created_at', { ascending: false });

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

              // Try to get regular product first
              if (item.product_id) {
                const { data: regularProduct } = await supabase
                  .from('products')
                  .select('*')
                  .eq('id', item.product_id)
                  .single();
                product = regularProduct;
              }

              // Try to get featured product if regular product not found
              if (!product && item.product_id) {
                const { data: featuredProduct } = await supabase
                  .from('featured_products')
                  .select('*')
                  .eq('id', item.product_id)
                  .single();
                product = featuredProduct;
              }

              // Get variant details
              if (item.variant_id) {
                const { data: variantData } = await supabase
                  .from('product_variants')
                  .select('*')
                  .eq('id', item.variant_id)
                  .single();
                variant = variantData;
              }

              return {
                ...item,
                product,
                variant
              };
            })
          );

          return {
            ...order,
            items: itemsWithProducts
          };
        })
      );

      setOrders(ordersWithProducts);

      // Reserve stock for new pending orders
      for (const order of sorted) {
        if (order.status === 'pending') {
          await reserveStock(order);
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  // Return stock when order is cancelled
  const returnStock = async (order: Order) => {
    if (!order.items?.length) return;

    try {
      for (const item of order.items) {
        if (!item.variant_id) continue;

        const { data: variant } = await supabase
          .from('product_variants')
          .select('quantity')
          .eq('id', item.variant_id)
          .single();

        if (variant) {
          const currentStock = variant.quantity || 0;
          const newStock = currentStock + item.quantity;

          await supabase
            .from('product_variants')
            .update({ quantity: newStock })
            .eq('id', item.variant_id);

          console.log(`Returned ${item.quantity} units to stock for variant ${item.variant_id}`);
        }
      }
    } catch (error) {
      console.error('Error returning stock:', error);
    }
  };

  // Reserve stock when order is created (pending) - No longer needed with immediate deduction
  const reserveStock = async (order: Order) => {
    // This function is no longer needed as we deduct stock immediately
    console.log('Stock reservation skipped - using immediate deduction');
  };

  // Release reserved stock when order is cancelled
  const releaseReservedStock = async (order: Order) => {
    if (!order.items?.length) return;

    try {
      for (const item of order.items) {
        if (!item.variant_id) continue;

        const { data: variant } = await supabase
          .from('product_variants')
          .select('reserved_quantity')
          .eq('id', item.variant_id)
          .single();

        if (variant && variant.reserved_quantity) {
          const newReserved = Math.max(0, variant.reserved_quantity - item.quantity);
          await supabase
            .from('product_variants')
            .update({ reserved_quantity: newReserved })
            .eq('id', item.variant_id);
        }
      }
    } catch (error) {
      console.error('Error releasing reserved stock:', error);
    }
  };

  const updateStatus = async (orderId: number, newStatus: string, stockType?: 'normal' | 'reserved') => {
    const order = selectedOrder || orders.find(o => o.id === orderId);
    if (!order) return;

    setUpdatingStatus(true);
    try {
      // Handle stock operations based on status changes
      const oldStatus = order.status;

      // If cancelling, return stock to inventory
      if (newStatus === 'cancelled' && oldStatus === 'pending') {
        await returnStock(order);
      }

      // If confirming from pending, stock is already deducted
      if (newStatus === 'confirmed' && oldStatus === 'pending') {
        // Stock was already deducted when order was created
        console.log('Order confirmed - stock already deducted');
      }

      const orderPayload: Record<string, unknown> = { status: newStatus };

      const { error: orderErr } = await supabase
        .from('orders')
        .update(orderPayload)
        .eq('id', orderId);

      if (orderErr) {
        alert(`فشل تحديث حالة الطلب: ${orderErr.message}`);
        setUpdatingStatus(false);
        return;
      }

      setShowConfirmModal(false);
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === orderId
            ? { ...o, status: newStatus as Order['status'] }
            : o
        )
      );
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus as Order['status'] } : null);
    } catch (err) {
      console.error('Error updating status:', err);
      alert(`حدث خطأ: ${err instanceof Error ? err.message : 'غير معروف'}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrint = () => {
    if (!selectedOrder) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = selectedOrder.items?.map(item => {
      const product = item.product;
      return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${product?.name_ar || 'منتج غير معروف'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.variant?.size || '-'} / ${item.variant?.color || '-'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${formatCurrency(item.price_at_purchase * item.quantity)}</td>
      </tr>
    `}).join('');

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>فاتورة طلب #${selectedOrder.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f9f9f9; padding: 10px; text-align: right; border-bottom: 2px solid #eee; }
            .totals { text-align: left; }
            .totals p { margin: 5px 0; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>YourTshirtDZ</h1>
            <div>
              <p><strong>رقم الطلب:</strong> #${selectedOrder.id}</p>
              <p><strong>التاريخ:</strong> ${new Date(selectedOrder.created_at).toLocaleDateString('ar-DZ')}</p>
            </div>
          </div>
          
          <div class="info-grid">
            <div>
              <h3>معلومات الزبون</h3>
              <p><strong>الاسم:</strong> ${selectedOrder.first_name} ${selectedOrder.last_name}</p>
              <p><strong>الهاتف:</strong> ${selectedOrder.phone}</p>
            </div>
            <div>
              <h3>معلومات الشحن</h3>
              <p><strong>الولاية:</strong> ${selectedOrder.wilaya?.name_ar}</p>
              <p><strong>العنوان:</strong> ${selectedOrder.address}</p>
              <p><strong>طريقة التوصيل:</strong> ${selectedOrder.delivery_method === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>المنتج</th>
                <th>المقاس/اللون</th>
                <th>الكمية</th>
                <th>السعر</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <p>المجموع الفرعي: ${formatCurrency(selectedOrder.total_amount - selectedOrder.shipping_fee)}</p>
            <p>رسوم الشحن: ${formatCurrency(selectedOrder.shipping_fee)}</p>
            <h2 style="margin-top: 10px;">الإجمالي: ${formatCurrency(selectedOrder.total_amount)}</h2>
          </div>

          <div class="footer">
            <p>شكراً لتعاملك مع YourTshirtDZ</p>
          </div>

          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleContact = () => {
    if (!selectedOrder) return;
    const phone = selectedOrder.phone.replace(/\s+/g, '');
    // Format for WhatsApp (Algeria +213)
    const formattedPhone = phone.startsWith('0') ? '213' + phone.substring(1) : phone;
    const message = encodeURIComponent(`مرحباً ${selectedOrder.first_name}، نحن من متجر YourTshirtDZ بخصوص طلبك رقم #${selectedOrder.id}`);
    window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank');
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm(`هل أنت متأكد من حذف الطلب #${selectedOrder.id.toString().padStart(5, '0')}؟ لا يمكن التراجع.`)) return;
    try {
      const { error: itemsErr } = await supabase.from('order_items').delete().eq('order_id', selectedOrder.id);
      if (itemsErr) {
        alert(`فشل الحذف: ${itemsErr.message}`);
        return;
      }
      const { error } = await supabase.from('orders').delete().eq('id', selectedOrder.id);
      if (error) throw error;
      setSelectedOrder(null);
      setShowConfirmModal(false);
      fetchOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      alert(`فشل حذف الطلب: ${err instanceof Error ? err.message : 'غير معروف'}`);
    }
  };

  const filteredOrders = orders.filter(o =>
    `${o.first_name} ${o.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.phone.includes(searchTerm) ||
    o.id.toString().includes(searchTerm)
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">الطلبات</h1>
          <p className="text-brand-black/50 mt-1">تتبع وإدارة طلبات الزبائن.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            تصدير CSV
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-black/30" size={20} />
          <input
            type="text"
            placeholder="البحث بالاسم، الهاتف أو رقم الطلب..."
            className="input-field pr-12 text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar scroll-smooth">
          {['الكل', 'قيد الانتظار', 'تم التأكيد', 'تم الشحن', 'تم التوصيل', 'ملغى'].map(status => (
            <button
              key={status}
              className="px-4 py-2 rounded-xl text-[10px] sm:text-sm font-bold border border-brand-border hover:bg-brand-black hover:text-brand-white transition-all whitespace-nowrap capitalize"
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table & Cards */}
      <div className="glass-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
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
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-brand-border max-h-[70vh] overflow-y-auto custom-scrollbar">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={cn(
                "p-4 active:bg-brand-gray/20 transition-colors",
                shouldHighlight && order.id === parseInt(orderIdFromNotification || '0') && "bg-amber-50"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] text-brand-black/40 mb-1">#{order.id.toString().padStart(5, '0')}</span>
                  <p className="font-bold text-sm">{order.first_name} {order.last_name}</p>
                  <p className="text-xs text-brand-black/50 mt-0.5">{order.phone}</p>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-tight border",
                  statusColors[order.status as keyof typeof statusColors]
                )}>
                  {statusLabels[order.status as keyof typeof statusLabels]}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div className="text-brand-black/60">
                  <p>{order.wilaya?.name_ar}</p>
                  <p className="text-[10px]">{order.delivery_method === 'home' ? 'توصيل للمنزل' : 'توصيل للمكتب'}</p>
                </div>
                <p className="font-bold text-brand-black">{formatCurrency(order.total_amount)}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-20 text-center flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-20 h-20 bg-brand-gray rounded-full flex items-center justify-center text-brand-black/10">
              <ShoppingBag size={40} />
            </div>
            <div>
              <p className="text-lg font-bold">لا توجد طلبات</p>
              <p className="text-sm text-brand-black/40 max-w-xs mx-auto">لم نتمكن من العثور على أي طلبات في هذا القسم حالياً.</p>
            </div>
            <button
              onClick={() => setSearchParams({})}
              className="btn-secondary text-xs py-2 px-6"
            >
              إعادة تعيين الفلاتر
            </button>
          </motion.div>
        )}
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
              <div className="p-4 sm:p-8 border-b border-brand-border flex items-center justify-between bg-brand-black text-brand-white">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">تفاصيل الطلب</h2>
                  <p className="text-brand-white/60 text-[10px] sm:text-sm font-mono">#{selectedOrder.id.toString().padStart(5, '0')}</p>
                </div>
                <button onClick={() => { setSelectedOrder(null); setShowConfirmModal(false); }} className="p-2 hover:bg-brand-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  {/* Customer Info */}
                  <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="glass-card p-4 sm:p-6 space-y-4">
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
                      <div className="p-4 sm:p-6 border-b border-brand-border bg-brand-gray/30">
                        <div className="flex items-center gap-3 text-brand-black/40">
                          <Package size={18} />
                          <span className="text-xs font-bold uppercase tracking-widest">المنتجات</span>
                        </div>
                      </div>
                      <div className="divide-y divide-brand-border">
                        {selectedOrder.items?.map((item) => (
                          <div key={item.id} className="p-4 sm:p-6 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-gray rounded-xl overflow-hidden shrink-0">
                                <img src={item.product?.image_url || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-xs sm:text-sm leading-tight">{item.product?.name_ar || 'منتج غير معروف'}</p>
                                <p className="text-[10px] sm:text-xs text-brand-black/50 mt-0.5">
                                  {item.variant?.size} | {item.variant?.color}
                                </p>
                                <p className="text-[10px] sm:text-xs mt-1">الكمية: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-bold text-xs sm:text-base whitespace-nowrap">{formatCurrency(item.price_at_purchase * item.quantity)}</p>
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
                    <div className="glass-card p-4 sm:p-6 space-y-4 sm:space-y-6">
                      <div className="flex items-center gap-3 text-brand-black/40">
                        <Clock size={18} />
                        <span className="text-xs font-bold uppercase tracking-widest">إدارة الحالة</span>
                      </div>

                      {/* Status Timeline */}
                      <div className="relative pr-2 sm:pr-0">
                        <div className="absolute right-6 top-8 bottom-8 w-0.5 bg-brand-border"></div>

                        <div className="space-y-3 sm:space-y-4">
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
                              <div key={status.id} className="relative flex items-center gap-3 sm:gap-4">
                                {/* Status Node */}
                                <div className="relative z-10">
                                  <button
                                    onClick={() => updateStatus(selectedOrder.id, status.id)}
                                    className={cn(
                                      "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all border-2",
                                      isActive
                                        ? "bg-brand-black text-brand-white border-brand-black shadow-lg scale-110"
                                        : isPast
                                          ? "bg-emerald-500 text-white border-emerald-500"
                                          : "bg-brand-white text-brand-black/40 border-brand-border hover:border-brand-black/60 hover:scale-105"
                                    )}
                                  >
                                    <status.icon size={16} />
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
                                          "font-bold text-[13px] sm:text-sm transition-colors",
                                          isActive ? "text-brand-black" : "text-brand-black/60 group-hover:text-brand-black"
                                        )}>
                                          {status.label}
                                        </p>
                                        <p className="text-[10px] sm:text-xs text-brand-black/40 mt-0.5">
                                          {status.description}
                                        </p>
                                      </div>
                                      {isActive && (
                                        <Check className="text-emerald-500" size={16} />
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
                        onClick={handleDeleteOrder}
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
    </motion.div>
  );
}


