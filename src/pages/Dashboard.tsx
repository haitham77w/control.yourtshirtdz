import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from '../lib/supabase';
import { formatCurrency, cn } from '../lib/utils';
import { Order } from '../types';

const data = [
  { name: 'Sat', sales: 4000, orders: 24 },
  { name: 'Sun', sales: 3000, orders: 18 },
  { name: 'Mon', sales: 2000, orders: 12 },
  { name: 'Tue', sales: 2780, orders: 20 },
  { name: 'Wed', sales: 1890, orders: 15 },
  { name: 'Thu', sales: 2390, orders: 22 },
  { name: 'Fri', sales: 3490, orders: 30 },
];

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    activeProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { data: orders },
          { count: productsCount },
          { data: recent }
        ] = await Promise.all([
          supabase.from('orders').select('total_amount, status'),
          supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabase.from('orders').select('*, wilaya:wilayas(name_ar)').order('created_at', { ascending: false }).limit(5)
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
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const statCards = [
    { title: 'إجمالي الإيرادات', value: formatCurrency(stats.totalSales), icon: DollarSign, trend: '+12.5%', isUp: true },
    { title: 'إجمالي الطلبات', value: stats.totalOrders.toString(), icon: ShoppingBag, trend: '+5.2%', isUp: true },
    { title: 'طلبات قيد الانتظار', value: stats.pendingOrders.toString(), icon: Clock, trend: '-2.1%', isUp: false },
    { title: 'المنتجات النشطة', value: stats.activeProducts.toString(), icon: Package, trend: '+3', isUp: true },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">نظرة عامة</h1>
          <p className="text-brand-black/50 mt-1">مرحباً بك مجدداً في لوحة تحكم YourTshirtDZ.</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex-1 sm:flex-none">تحميل التقرير</button>
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
            className="glass-card p-6 group hover:border-brand-black transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-black text-brand-white rounded-xl group-hover:scale-110 transition-transform">
                <stat.icon size={20} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
                stat.isUp ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {stat.trend}
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
            </div>
            <p className="text-brand-black/50 text-sm font-medium">{stat.title}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">أداء المبيعات</h3>
            <select className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer">
              <option>أسبوعي</option>
              <option>شهري</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#999', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#999', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#000" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-8">
          <h3 className="text-xl font-bold mb-8">أحدث الطلبات</h3>
          <div className="space-y-6">
            {recentOrders.map((order, i) => (
              <div key={order.id} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-gray rounded-full flex items-center justify-center font-bold text-sm">
                    {order.first_name[0]}{order.last_name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{order.first_name} {order.last_name}</p>
                    <p className="text-xs text-brand-black/50">{(order as any).wilaya?.name_ar}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{formatCurrency(order.total_amount)}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-brand-black/40">
                    {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <p className="text-center text-brand-black/40 py-8">لا توجد طلبات حديثة</p>
            )}
          </div>
          <button className="w-full mt-8 py-3 border border-brand-border rounded-xl text-sm font-bold hover:bg-brand-black hover:text-brand-white transition-all">
            عرض كل الطلبات
          </button>
        </div>
      </div>
    </motion.div>
  );
}

import { Package } from 'lucide-react';
