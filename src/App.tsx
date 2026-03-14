import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  MapPin,
  Settings as SettingsIcon,
  Bell,
  LogOut
} from 'lucide-react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { cn, formatCurrency } from './lib/utils';
import Toast, { ToastType } from './components/Toast';
import { ExpandableTabs } from './components/ui/expandable-tabs';

// Pages
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Categories from './pages/Categories';
import Locations from './pages/Locations';
import Settings from './pages/Settings';

export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('sound_notifications');
    return saved !== null ? JSON.parse(saved) : true;
  });
  // Use a ref so the realtime callback always reads the latest value (avoids stale closure)
  const soundEnabledRef = React.useRef(soundEnabled);
  React.useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  const [toastOrder, setToastOrder] = useState<{ id: number; name: string; amount: number; imageUrl?: string } | null>(null);

  // Global Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'success',
    isVisible: false
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type, isVisible: true });
  };

  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'لوحة التحكم', path: '/', icon: LayoutDashboard },
    { name: 'الطلبات', path: '/orders', icon: ShoppingCart },
    { name: 'المنتجات', path: '/products', icon: Package },
    { name: 'الأصناف', path: '/categories', icon: Tag },
    { name: 'المواقع والشحن', path: '/locations', icon: MapPin },
    { name: 'الإعدادات', path: '/settings', icon: SettingsIcon },
  ];

  // Active tab index based on current path
  const activeTabIndex = navItems.findIndex(item => item.path === location.pathname);

  const handleTabChange = (index: number | null) => {
    if (index !== null && navItems[index]) {
      navigate(navItems[index].path);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <=
 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

        // Fetch first product image from the order
        const fetchOrderImage = async (orderId: number) => {
          const { data } = await supabase
            .from('order_items')
            .select('product:products(images_urls, image_url)')
            .eq('order_id', orderId)
            .limit(1)
            .single();
          const product = (data?.product as any);
          return product?.images_urls?.[0] || product?.image_url || undefined;
        };

        fetchOrderImage(order.id).then(imageUrl => {
          setToastOrder({ id: order.id, name: `${order.first_name} ${order.last_name}`, amount: order.total_amount, imageUrl });
        });
        setTimeout(() => setToastOrder(null), 5000);

        // Deduct stock after a short delay to ensure order_items are inserted
        setTimeout(() => deductStockImmediately(order.id), 2000);

        if (document.hidden) {
          document.title = `📦 طلب جديد من ${order.first_name}!`;
          setTimeout(() => { document.title = 'YourTshirtDZ - لوحة التحكم'; }, 3000);
        }

        if (soundEnabledRef.current && "Notification" in window && Notification.permission === "granted") {
          new Notification("طلب جديد! 📦", {
            body: `وصل طلب من ${order.first_name} ${order.last_name} بمبلغ ${formatCurrency(order.total_amount)}`,
            icon: "/favicon.ico"
          });
        }

        if (soundEnabledRef.current) {
          const audio = new Audio('https://res.cloudinary.com/ddsikz7wq/video/upload/v1773411583/%D9%86%D8%BA%D9%85%D9%87_%D8%B1%D8%B3%D8%A7%D8%A6%D9%84_%D8%A7%D9%8A%D9%81%D9%88%D9%86_%D8%A7%D9%84%D8%A7%D8%B5%D9%84%D9%8A%D9%87_%D8%A7%D9%84%D8%A7%D9%8A%D9%81%D9%88%D9%86_11%D8%A8%D8%B1%D9%88_2021_320_qa8kbe.mp3');
          audio.volume = 1.0;
          audio.play().catch(err => console.warn('Audio play blocked:', err));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    fetchPendingCount();

    // Subscribe to changes in orders to update count
    const countChannel = supabase
      .channel('orders-count')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchPendingCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(countChannel);
    };
  }, []);

  async function fetchPendingCount() {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    setPendingOrdersCount(count || 0);
  }

  return (
    <div className="flex flex-col h-screen bg-brand-gray/30 font-sans">

      {/* ===== TOP HEADER ===== */}
      <header className="h-16 border-b border-brand-border bg-white/80 backdrop-blur-sm z-40 px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-brand-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base">Y</span>
          </div>
          <span className="font-serif text-base font-bold tracking-tighter hidden sm:block">يور تيشيرت DZ</span>
        </Link>

        {/* Desktop: Expandable Tabs nav */}
        <div className="hidden md:flex flex-1 justify-center px-4">
          <ExpandableTabs
            tabs={navItems.map(item => ({ title: item.name, icon: item.icon, path: item.path }))}
            activeIndex={activeTabIndex >= 0 ? activeTabIndex : null}
            onChange={handleTabChange}
          />
        </div>

        {/* Right side: pending badge + sound + bell + avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {pendingOrdersCount > 0 && (
            <button
              onClick={() => navigate('/orders')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse"
            >
              <ShoppingCart size={13} />
              {pendingOrdersCount} جديدة
            </button>
          )}

          {/* Sound toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              localStorage.setItem('sound_notifications', JSON.stringify(next));
            }}
            title={soundEnabled ? 'إيقاف صوت الإشعارات' : 'تفعيل صوت الإشعارات'}
            className={cn(
              "p-2 rounded-lg transition-colors",
              soundEnabled ? "text-emerald-600 hover:bg-emerald-50" : "text-brand-black/30 hover:bg-brand-gray"
            )}
          >
            {soundEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            )}
          </button>

          {/* Bell / Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn("p-2 hover:bg-brand-gray rounded-lg transition-colors relative", showNotifications && "bg-brand-gray")}
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full border-2 border-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
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
                      <h3 className="font-bold text-sm">الإشعارات</h3>
                      {notifications.length > 0 && (
                        <button onClick={() => setNotifications([])} className="text-[10px] font-bold text-brand-black/40 hover:text-brand-black">
                          مسح الكل
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        <div className="divide-y divide-brand-border">
                          {notifications.map((notif, i) => (
                            <div
                              key={notif.id ?? i}
                              className="p-4 hover:bg-brand-gray/20 cursor-pointer"
                              onClick={() => { navigate(`/orders?order=${notif.id}&highlight=true`); setShowNotifications(false); setNotifications(prev => prev.filter(n => (n.id ?? i) !== (notif.id ?? i))); }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-brand-black text-brand-white rounded-full flex items-center justify-center text-[9px] font-bold">{notif.first_name?.[0]}{notif.last_name?.[0]}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">طلب من {notif.first_name} {notif.last_name}</p>
                                  <p className="text-[10px] text-brand-black/50">{formatCurrency(notif.total_amount)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="mx-auto mb-2 text-brand-black/20" size={20} />
                          <p className="text-xs text-brand-black/40">لا توجد إشعارات</p>
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <Link to="/orders" onClick={() => setShowNotifications(false)} className="block p-3 text-center text-[10px] font-bold bg-brand-black text-brand-white hover:bg-brand-black/90">
                        عرض جميع الطلبات
                      </Link>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <div className="w-8 h-8 bg-brand-black rounded-full flex items-center justify-center text-white font-bold text-sm">A</div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          <Routes location={location}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders showToast={showToast} />} />
            <Route path="/products" element={<Products showToast={showToast} />} />
            <Route path="/categories" element={<Categories showToast={showToast} />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/settings" element={<Settings showToast={showToast} />} />
          </Routes>
        </AnimatePresence>
      </main>

      {/* ===== MOBILE BOTTOM TABS ===== */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-t border-brand-border">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTabIndex === index;
            const hasBadge = item.path === '/orders' && pendingOrdersCount > 0;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative",
                  isActive ? "text-brand-black" : "text-brand-black/40"
                )}
              >
                <div className={cn("p-1.5 rounded-xl transition-all", isActive && "bg-brand-black text-white")}>
                  <Icon size={18} />
                </div>
                <span className="text-[9px] font-bold">{item.name}</span>
                {hasBadge && (
                  <span className="absolute top-0 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border border-white">
                    {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* New Order Toast */}
      <AnimatePresence>
        {toastOrder && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] mx-4"
          >
            <button
              onClick={() => { navigate('/orders'); setToastOrder(null); }}
              className="flex items-center gap-4 px-6 py-4 bg-brand-black text-white rounded-2xl shadow-2xl border-2 border-emerald-400 hover:scale-[1.02] transition-transform"
            >
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                {toastOrder.imageUrl ? (
                  <img src={toastOrder.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : '📦'}
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">طلب جديد!</p>
                <p className="text-xs text-white/80">من {toastOrder.name} — {formatCurrency(toastOrder.amount)}</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
}
