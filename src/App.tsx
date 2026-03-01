import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  MapPin,
  Settings as SettingsIcon,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronRight,
  Star
} from 'lucide-react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { cn, formatCurrency } from './lib/utils';

// Pages (to be created)
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Categories from './pages/Categories';
import Locations from './pages/Locations';
import Settings from './pages/Settings';
import FeaturedProducts from './pages/FeaturedProducts';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastOrder, setToastOrder] = useState<{ id: number; name: string; amount: number } | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'لوحة التحكم', path: '/', icon: LayoutDashboard },
    { name: 'الطلبات', path: '/orders', icon: ShoppingCart },
    { name: 'المنتجات', path: '/products', icon: Package },
    { name: 'المنتجات المميزة', path: '/featured-products', icon: Star },
    { name: 'الأصناف', path: '/categories', icon: Tag },
    { name: 'المواقع والشحن', path: '/locations', icon: MapPin },
    { name: 'الإعدادات', path: '/settings', icon: SettingsIcon },
  ];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Deduct stock immediately when new order is created
    const deductStockImmediately = async (orderId: number) => {
      try {
        console.log(`🔄 Starting immediate stock deduction for order ${orderId}`);

        // Get order items with product variants
        const { data: orderItems, error: itemsError } = await supabase
          .from('order_items')
          .select(`
          product_id,
          variant_id,
          quantity,
          product_variants!inner(
            id,
            quantity
          )
        `)
          .eq('order_id', orderId);

        if (itemsError) {
          console.error('❌ Error fetching order items:', itemsError);
          return;
        }

        console.log('📦 Processing order items for immediate stock deduction:', orderItems);

        // Deduct stock for each item
        for (const item of orderItems || []) {
          if (item.variant_id && item.product_variants) {
            const currentStock = item.product_variants.quantity || 0;
            const newStock = currentStock - item.quantity;

            console.log(`📊 Product ${item.product_id} - Variant ${item.variant_id}:`);
            console.log(`   Current Stock: ${currentStock}`);
            console.log(`   Order Quantity: ${item.quantity}`);
            console.log(`   New Stock: ${newStock}`);

            // Check if we have enough stock
            if (currentStock < item.quantity) {
              console.error(`❌ Not enough stock for variant ${item.variant_id}. Available: ${currentStock}, Requested: ${item.quantity}`);
              continue;
            }

            const { error: updateError } = await supabase
              .from('product_variants')
              .update({ quantity: newStock })
              .eq('id', item.variant_id);

            if (updateError) {
              console.error('❌ Error deducting stock:', updateError);
            } else {
              console.log(`✅ Successfully deducted ${item.quantity} units for variant ${item.variant_id}`);
            }
          } else {
            console.log(`⚠️ No variant_id for product_id ${item.product_id}`);
          }
        }

        console.log(`✅ Immediate stock deduction completed for order ${orderId}`);
      } catch (error) {
        console.error('❌ Error in deductStockImmediately:', error);
      }
    };

    // Real-time orders notification
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload: { new: { id: number; first_name: string; last_name: string; total_amount: number } }) => {
        const order = payload.new;
        setNotifications(prev => [order, ...prev]);

        setToastOrder({ id: order.id, name: `${order.first_name} ${order.last_name}`, amount: order.total_amount });
        setTimeout(() => setToastOrder(null), 5000);

        // Deduct stock immediately when new order is created
        deductStockImmediately(order.id);

        if (document.hidden) {
          document.title = `📦 طلب جديد من ${order.first_name}!`;
          setTimeout(() => { document.title = 'YourTshirtDZ - لوحة التحكم'; }, 3000);
        }

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("طلب جديد! 📦", {
            body: `وصل طلب من ${order.first_name} ${order.last_name} بمبلغ ${formatCurrency(order.total_amount)}`,
            icon: "https://res.cloudinary.com/dlwuxgvse/image/upload/v1772299278/580996199_18082640534081883_3315094757438837248_n_wwtp2p.jpg"
          });
        }

        const audio = new Audio('https://res.cloudinary.com/dlwuxgvse/video/upload/v1772274343/6GYhcxV_rSI_eohbgv.mp3');
        audio.play().catch(() => { });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex h-screen bg-brand-white overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-brand-black/60 backdrop-blur-sm z-[60]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-brand-black text-brand-white transition-all duration-300 ease-in-out flex flex-col z-[70]",
          isMobile
            ? cn("fixed inset-y-0 right-0 w-64 transform", isSidebarOpen ? "translate-x-0" : "translate-x-full")
            : cn("relative", isSidebarOpen ? "w-64" : "w-20")
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-xl border-2 border-brand-white/20 flex items-center justify-center bg-brand-white/10">
              <img
                src="https://res.cloudinary.com/dlwuxgvse/image/upload/v1772299278/580996199_18082640534081883_3315094757438837248_n_wwtp2p.jpg"
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            {(isSidebarOpen || isMobile) && <span className="font-serif text-xl font-bold tracking-tighter">يور تيشيرت DZ</span>}
          </Link>
          {isMobile && (
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-brand-white/10 rounded-lg">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
                  isActive
                    ? "bg-brand-white text-brand-black"
                    : "text-brand-white/60 hover:bg-brand-white/10 hover:text-brand-white"
                )}
              >
                <Icon size={20} className={cn(isActive ? "text-brand-black" : "group-hover:scale-110 transition-transform")} />
                {(isSidebarOpen || isMobile) && <span className="font-medium">{item.name}</span>}
                {isActive && (isSidebarOpen || isMobile) && (
                  <motion.div
                    layoutId="activeNav"
                    className="mr-auto"
                  >
                    <ChevronRight size={16} className="rotate-180" />
                  </motion.div>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-white/10">
          <button className="flex items-center gap-4 px-4 py-3 w-full text-brand-white/60 hover:text-brand-white transition-colors">
            <LogOut size={20} />
            {(isSidebarOpen || isMobile) && <span className="font-medium">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-brand-border flex items-center justify-between px-4 sm:px-8 bg-white/50 backdrop-blur-sm z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-brand-gray rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-serif text-base sm:text-lg font-bold sm:hidden truncate max-w-[120px]">يور تيشيرت</h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "p-2 hover:bg-brand-gray rounded-lg transition-colors relative",
                  showNotifications && "bg-brand-gray"
                )}
              >
                <Bell size={20} />
                {notifications.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-white">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowNotifications(false)}
                      className="fixed inset-0 z-[45]"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-80 bg-brand-white rounded-2xl shadow-2xl border border-brand-border z-[50] overflow-hidden"
                    >
                      <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-gray/30">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm">الإشعارات</h3>
                          {notifications.length > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                              {notifications.length} جديد
                            </span>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <button
                            onClick={() => setNotifications([])}
                            className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors bg-red-50 px-2 py-1 rounded-md"
                          >
                            مسح الكل
                          </button>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length > 0 ? (
                          <div className="divide-y divide-brand-border">
                            {notifications.map((notif, i) => (
                              <div
                                key={notif.id ?? i}
                                className="p-4 hover:bg-brand-gray/20 transition-colors cursor-pointer"
                                onClick={() => {
                                  // Navigate to specific order with notification highlight
                                  navigate(`/orders?order=${notif.id}&highlight=true`);
                                  setShowNotifications(false);

                                  // Remove this notification from the list
                                  setNotifications(prev => prev.filter(n => (n.id ?? i) !== (notif.id ?? i)));
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="w-10 h-10 bg-brand-black text-brand-white rounded-xl flex items-center justify-center text-xs font-bold shadow-lg">
                                      {notif.first_name?.[0]}{notif.last_name?.[0]}
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate text-brand-black">طلب جديد من {notif.first_name} {notif.last_name}</p>
                                    <p className="text-xs text-brand-black/60 mt-0.5 font-medium">بمبلغ <span className="text-emerald-600">{formatCurrency(notif.total_amount)}</span></p>
                                  </div>
                                  <div className="text-[10px] font-bold text-brand-black/30 bg-brand-gray px-1.5 py-0.5 rounded-full">
                                    {notif.created_at
                                      ? new Date(notif.created_at).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })
                                      : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center">
                            <div className="w-12 h-12 bg-brand-gray rounded-full flex items-center justify-center mx-auto mb-3 text-brand-black/20">
                              <Bell size={20} />
                            </div>
                            <p className="text-xs font-bold text-brand-black/40">لا توجد إشعارات جديدة</p>
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <Link
                          to="/orders"
                          onClick={() => setShowNotifications(false)}
                          className="block p-3 text-center text-[10px] font-bold bg-brand-black text-brand-white hover:bg-brand-black/90 transition-colors"
                        >
                          عرض جميع الطلبات
                        </Link>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 pr-2 sm:pr-6 border-r border-brand-border h-10">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold">المسؤول</p>
                <p className="text-xs text-brand-black/50">مدير المتجر</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-black rounded-full flex items-center justify-center text-brand-white font-bold shrink-0">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Toast: طلب جديد */}
        <AnimatePresence>
          {toastOrder && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] mx-4"
            >
              <button
                onClick={() => { navigate('/orders'); setToastOrder(null); }}
                className="flex items-center gap-4 px-6 py-4 bg-brand-black text-white rounded-2xl shadow-2xl border-2 border-emerald-400 hover:scale-[1.02] transition-transform"
              >
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-2xl">📦</div>
                <div className="text-right">
                  <p className="font-bold text-sm">طلب جديد!</p>
                  <p className="text-xs text-white/80">من {toastOrder.name} — {formatCurrency(toastOrder.amount)}</p>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-brand-gray/30">
          <AnimatePresence mode="wait">
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/products" element={<Products />} />
              <Route path="/featured-products" element={<FeaturedProducts />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/locations" element={<Locations />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
