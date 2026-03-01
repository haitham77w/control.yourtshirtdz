import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Plus,
  LayoutGrid,
  RefreshCw,
  AlertTriangle,
  Map,
  FileText,
  Package,
  ChevronRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { Order, ProductVariant } from '../types';

const data = [
  { name: 'السبت', sales: 4000, orders: 24 },
  { name: 'الأحد', sales: 3000, orders: 18 },
  { name: 'الاثنين', sales: 2000, orders: 12 },
  { name: 'الثلاثاء', sales: 2780, orders: 20 },
  { name: 'الأربعاء', sales: 1890, orders: 15 },
  { name: 'الخميس', sales: 2390, orders: 22 },
  { name: 'الجمعة', sales: 3490, orders: 30 },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockVariants, setLowStockVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [
        { data: orders },
        { count: productsCount },
        { data: recent },
        { data: lowStock }
      ] = await Promise.all([
        supabase.from('orders').select('total_amount, status'),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('*, wilaya:wilayas(name_ar)').order('created_at', { ascending: false }).limit(5),
        supabase.from('product_variants').select('*, product:products(name_ar, image_url)').lt('quantity', 5).order('quantity').limit(5)
      ]);

      const totalSales = orders?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
      const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;

      setStats({
        totalSales,
        totalOrders: orders?.length || 0,
        pendingOrders,
        activeProducts: productsCount || 0
      });
      setRecentOrders(recent as any || []);
      setLowStockVariants(lowStock || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statCards = [
    { title: 'إجمالي الإيرادات', value: formatCurrency(stats.totalSales), icon: DollarSign, trend: '+12.5%', isUp: true, color: 'from-emerald-500/10 to-emerald-500/0' },
    { title: 'إجمالي الطلبات', value: stats.totalOrders.toString(), icon: ShoppingBag, trend: '+5.2%', isUp: true, color: 'from-blue-500/10 to-blue-500/0' },
    { title: 'طلبات قيد الانتظار', value: stats.pendingOrders.toString(), icon: Clock, trend: '-2.1%', isUp: false, color: 'from-amber-500/10 to-amber-500/0' },
    { title: 'المنتجات النشطة', value: stats.activeProducts.toString(), icon: Package, trend: '+3', isUp: true, color: 'from-purple-500/10 to-purple-500/0' },
  ];

  const quickActions = [
    { label: 'منتج جديد', icon: Plus, onClick: () => navigate('/products'), color: 'bg-brand-black text-brand-white' },
    { label: 'إدارة المواقع', icon: Map, onClick: () => navigate('/locations'), color: 'bg-brand-gray text-brand-black' },
    { label: 'الأصناف', icon: LayoutGrid, onClick: () => navigate('/categories'), color: 'bg-brand-gray text-brand-black' },
    { label: 'التقارير', icon: FileText, onClick: () => { }, color: 'bg-brand-gray text-brand-black' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">نظرة عامة</h1>
          <p className="text-brand-black/50 mt-1">مرحباً بك مجدداً في لوحة تحكم YourTshirtDZ.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="btn-secondary flex items-center justify-center gap-2 px-4 whitespace-nowrap"
          >
            <RefreshCw size={18} className={cn(refreshing && "animate-spin")} />
            تحديث البيانات
          </button>
          <button className="btn-primary flex-1 sm:flex-none">آخر 30 يوم</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "glass-card p-6 relative overflow-hidden group hover:border-brand-black transition-all shadow-sm hover:shadow-md",
              "bg-gradient-to-br", stat.color
            )}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-brand-black text-brand-white rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                  <stat.icon size={20} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                  stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                )}>
                  {stat.trend}
                  {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
              </div>
              <p className="text-brand-black/50 text-xs font-bold uppercase tracking-wider">{stat.title}</p>
              <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
            </div>

            {/* Background pattern */}
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.05] group-hover:scale-110 transition-all">
              <stat.icon size={120} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts & Quick Actions Wrapper */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={action.onClick}
                className={cn(
                  "p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-[1.05] active:scale-[0.95] shadow-sm font-bold text-sm",
                  action.color
                )}
              >
                <div className="p-2 bg-white/10 rounded-lg">
                  <action.icon size={24} />
                </div>
                {action.label}
              </motion.button>
            ))}
          </div>

          {/* Charts Section */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold">أداء المبيعات</h3>
                <p className="text-xs text-brand-black/40 mt-1">إحصائيات الطلبات اليومية للأسبوع الحالي.</p>
              </div>
              <select className="bg-brand-gray border-none text-xs font-bold px-4 py-2 rounded-xl focus:ring-0 cursor-pointer">
                <option>أسبوعي</option>
                <option>شهري</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#000" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#000" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#999', fontSize: 10, fontWeight: 'bold' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#999', fontSize: 10, fontWeight: 'bold' }}
                    dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="المبيعات"
                    stroke="#000"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorSales)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Recent Orders */}
          <div className="glass-card p-6 flex flex-col h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">أحدث الطلبات</h3>
              <button
                onClick={() => navigate('/orders')}
                className="text-xs font-bold text-brand-black/40 hover:text-brand-black transition-colors"
              >
                عرض الكل
              </button>
            </div>
            <div className="space-y-5">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between group cursor-pointer hover:bg-brand-gray/30 p-2 -m-2 rounded-xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-black text-brand-white rounded-full flex items-center justify-center font-bold text-xs shadow-md">
                      {order.first_name[0]}{order.last_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{order.first_name} {order.last_name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full animate-pulse",
                          order.status === 'pending' ? "bg-amber-500" :
                            order.status === 'confirmed' ? "bg-blue-500" : "bg-emerald-500"
                        )} />
                        <p className="text-[10px] text-brand-black/50 font-medium whitespace-nowrap">
                          {(order as any).wilaya?.name_ar} • {order.status === 'pending' ? 'قيد الانتظار' : order.status}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{formatCurrency(order.total_amount)}</p>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-brand-black/30">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <p className="text-center text-brand-black/40 py-8 text-sm">لا توجد طلبات حديثة</p>
              )}
            </div>
          </div>

          {/* Low Stock Widget */}
          <div className="glass-card p-6 border-amber-100 bg-gradient-to-br from-amber-50/50 to-white">
            <div className="flex items-center gap-2 text-amber-600 mb-6">
              <AlertTriangle size={20} />
              <h3 className="text-lg font-bold">تنبيه المخزون المنخفض</h3>
            </div>

            <div className="space-y-4">
              {lowStockVariants.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-amber-100 shadow-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-brand-gray">
                      {v.product?.image_url && (
                        <img src={v.product.image_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{v.product?.name_ar}</p>
                      <p className="text-[10px] text-brand-black/50">{v.size} / {v.color}</p>
                    </div>
                  </div>
                  <div className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg text-[10px] font-black whitespace-nowrap">
                    بقي {v.quantity}
                  </div>
                </div>
              ))}

              {lowStockVariants.length === 0 && (
                <div className="text-center py-6">
                  <Package className="mx-auto text-emerald-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-emerald-600">المخزون كافٍ حالياً!</p>
                </div>
              )}

              {lowStockVariants.length > 0 && (
                <button
                  onClick={() => navigate('/products')}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-3 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-all shadow-md active:scale-95"
                >
                  تحديث المخزون
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
