import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Product, Category } from '../types';
import { ArrowRight, ArrowLeft, Star, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

interface HomeProps {
  products: Product[];
  categories: Category[];
  featuredProducts?: Product[];
}

const Home: React.FC<HomeProps> = ({ products, categories, featuredProducts = [] }) => {
  const { t, language, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const filteredProducts = useMemo(() => products, [products]);

  // شريط "أفضل المنتجات": من جدول featured_products فقط – إن كانت فارغة تبقى فارغة
  const bestProductsList = useMemo(() => featuredProducts, [featuredProducts]);

  return (
    <div className="pb-20">
      {/* Brutalist Hero Section */}
      <section className="relative h-screen bg-brand-black overflow-hidden flex flex-col justify-end">
        {/* Background Video Wrapper */}
        <div className="absolute inset-0 z-0 pointer-events-none bg-black">
          {/* Fallback Image (visible while video loads or if video fails) */}
          <img 
            src={"https://images.unsplash.com/photo-1523396870176-237e77b407bc?auto=format&fit=crop&q=80&w=2000"} 
            alt="Hero Background" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          
          {/* Cloudinary Video Iframe */}
          <iframe
            src={"https://player.cloudinary.com/embed/?cloud_name=dua3y4qmf&public_id=PinDown.io__conrable_1771477496_mxuiwe&autoplay=true&muted=true&loop=true&controls=false&hide_controls=true"}
            className="absolute inset-0 w-full h-full object-cover opacity-80"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
            title="Hero Video"
            style={{ pointerEvents: 'none' }}
          ></iframe>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
        </div>
        
        {/* Main Content */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
          <div className="flex flex-col items-start max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-brand-yellow text-black px-4 py-2 font-black text-sm tracking-widest uppercase mb-6 transform -rotate-2 inline-block shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
            >
              {t('heroBadge')}
            </motion.div>
            
            <h1 className="text-7xl md:text-9xl font-black text-white leading-[0.85] tracking-tighter mb-6 uppercase overflow-hidden">
              <motion.span 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
                className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400"
              >
                {t('heroTitle1')}
              </motion.span>
              <motion.span 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                className="block text-brand-yellow drop-shadow-lg"
              >
                {t('heroTitle2')}
              </motion.span>
            </h1>
            
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="text-gray-300 text-lg md:text-xl font-light max-w-lg mb-10 leading-relaxed border-l-4 border-brand-yellow pl-4 backdrop-blur-sm bg-black/30 p-4 rounded-r-lg"
            >
              {t('heroDesc')}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.4, delay: 1 }}
            >
              <Link
                to="/products"
                className="group relative inline-flex items-center gap-4 bg-white text-black px-10 py-5 font-black text-xl uppercase tracking-wider hover:bg-brand-yellow transition-colors duration-300 shadow-[8px_8px_0px_0px_rgba(255,215,0,0.5)] hover:shadow-[12px_12px_0px_0px_rgba(255,215,0,0.8)]"
              >
                {t('shopNow')}
                <ArrowIcon className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-2 rtl:group-hover:-translate-x-2" />
                <div className="absolute bottom-0 left-0 w-full h-1 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Marquee Strip */}
        <div className="absolute bottom-0 w-full bg-brand-yellow border-y-4 border-black py-3 overflow-hidden z-20">
          <div className="animate-marquee whitespace-nowrap inline-block">
            <span className="text-2xl font-black text-black uppercase tracking-widest mx-4">
               {t('marqueeText')} &nbsp;&nbsp;&nbsp; {t('marqueeText')} &nbsp;&nbsp;&nbsp; {t('marqueeText')}
            </span>
          </div>
        </div>
      </section>

      {/* Best Products Bar - من جدول featured_products في القاعدة */}
      <section className="bg-white border-b-4 border-black py-8 md:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-6 md:mb-8 text-brand-black font-sans">
            {t('bestProducts')}
          </h2>
          {bestProductsList.length === 0 ? (
            <p className="text-gray-500 font-bold uppercase text-sm">{language === 'ar' ? 'لا توجد منتجات حالياً' : 'No products yet.'}</p>
          ) : (
            <div className="flex overflow-x-auto gap-6 pb-4 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar snap-x snap-mandatory">
              {bestProductsList.map((product) => (
                <Link
                  to={`/product/${product.id}`}
                  key={product.id}
                  className="flex-shrink-0 w-[200px] md:w-[240px] snap-start group block"
                >
                  <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden border-2 border-gray-100 group-hover:border-brand-yellow transition-colors">
                    <img
                      src={product.image || null}
                      alt={language === 'ar' ? product.nameAr : product.nameEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="absolute top-2 right-2 bg-brand-yellow text-black text-xs font-black px-2 py-1 uppercase">
                        {t('sale')}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    <h3 className="font-sans font-bold text-sm md:text-base uppercase leading-tight truncate group-hover:text-brand-yellow transition-colors">
                      {language === 'ar' ? product.nameAr : product.nameEn}
                    </h3>
                    <p className="font-sans font-bold text-black text-base">{product.price} {t('price')}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          {bestProductsList.length > 0 && (
            <div className="mt-6 text-center">
              <Link to="/products" className="inline-flex items-center gap-2 font-sans font-bold uppercase text-sm border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-colors">
                {t('viewAll')} <ArrowIcon className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Category Section */}
      <section id="categories" className="py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div className="relative">
                <div className="absolute -top-10 -left-6 text-[120px] font-black text-black/5 select-none leading-none">01</div>
                <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] relative z-10">
                  {language === 'ar' ? 'الأصناف' : 'CATEGORIES'}
                </h2>
                <div className="h-4 w-full bg-brand-yellow mt-4"></div>
              </div>
              <p className="text-black font-black max-w-xs md:text-end uppercase text-xs tracking-widest leading-relaxed border-r-4 border-black pr-4 rtl:border-r-0 rtl:border-l-4 rtl:pl-4">
                {language === 'ar' ? 'اختر مجموعتك المفضلة وابدأ التسوق الآن' : 'SELECT YOUR VIBE. EXPLORE OUR CURATED STREETWEAR COLLECTIONS.'}
              </p>
           </div>
           
           {categories.length === 0 ? (
               <div className="text-center py-20 border-dashed text-black font-black uppercase tracking-widest">Loading...</div>
           ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
                  {categories.map((cat, index) => (
                      <Link to={`/category/${cat.id}`} key={cat.id} className="block">
                        <motion.div 
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          whileHover={{ 
                            scale: 0.98,
                            transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] }
                          }}
                          whileTap={{ scale: 0.95 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
                          className="group relative aspect-[3/4] cursor-pointer overflow-hidden bg-white border-2 border-gray-100 transition-colors duration-500"
                        >
                         {/* Image with Grayscale to Color effect */}
                         <motion.img 
                            src={cat.image || null} 
                            alt={language === 'ar' ? cat.nameAr : cat.nameEn} 
                            initial={{ scale: 1.2 }}
                            whileHover={{ scale: 1 }}
                            transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1] }}
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 opacity-90 group-hover:opacity-100" 
                         />
                         
                         {/* Luxurious Shine Effect */}
                         <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s] ease-in-out"></div>
                         </div>

                         {/* Label - font consistent with site */}
                         <div className="absolute inset-0 flex flex-col justify-between p-8">
                            <div className="flex justify-between items-start overflow-hidden">
                               <motion.span 
                                 initial={{ y: 20, opacity: 0 }}
                                 whileInView={{ y: 0, opacity: 1 }}
                                 className="text-5xl font-sans font-black text-black/5 group-hover:text-black/20 transition-colors duration-500"
                               >
                                 0{index + 1}
                               </motion.span>
                            </div>

                            <div className="relative z-10">
                               <motion.div 
                                  initial={{ x: -20, opacity: 0 }}
                                  whileInView={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.2 + (index * 0.1) }}
                                  className="bg-brand-black text-white group-hover:bg-brand-yellow group-hover:text-black inline-block px-4 py-2 mb-3 transition-colors duration-500"
                               >
                                  <span className="text-xs font-sans font-semibold uppercase tracking-widest">
                                    {language === 'ar' ? 'استعرض' : 'EXPLORE'}
                                  </span>
                               </motion.div>
                               <div className="overflow-hidden">
                                 <motion.h3 
                                    className="text-3xl md:text-4xl font-sans font-black uppercase text-black leading-none tracking-tight break-words bg-white group-hover:bg-brand-yellow inline-block px-3 py-1 transition-colors duration-500"
                                 >
                                     {language === 'ar' ? cat.nameAr : cat.nameEn}
                                 </motion.h3>
                               </div>
                            </div>
                         </div>

                         {/* Hover Overlay Line */}
                         <div className="absolute bottom-0 left-0 w-full h-0 bg-brand-yellow group-hover:h-3 transition-all duration-500 ease-[0.25, 1, 0.5, 1]"></div>
                      </motion.div>
                    </Link>
                  ))}
               </div>
           )}
        </div>
      </section>

      {/* Features Banner */}
      <section className="bg-white py-12 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 p-6 border border-gray-100 hover:border-black transition-colors">
            <div className="bg-black text-brand-yellow p-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase">{t('deliveryTitle')}</h3>
              <p className="text-sm text-gray-500">{t('deliveryDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 border border-gray-100 hover:border-black transition-colors">
            <div className="bg-black text-brand-yellow p-3">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase">{t('qualityTitle')}</h3>
              <p className="text-sm text-gray-500">{t('qualityDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 border border-gray-100 hover:border-black transition-colors">
            <div className="bg-black text-brand-yellow p-3">
              <ArrowIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-lg uppercase">{t('codTitle')}</h3>
              <p className="text-sm text-gray-500">{t('codDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 min-h-[600px]">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-5xl md:text-6xl font-black mb-2 uppercase tracking-tighter text-black outline-text">
              {t('featuredProducts')}
            </h2>
            <div className="h-4 w-32 bg-brand-yellow"></div>
          </div>
          <Link to="/products" className="hidden md:flex text-black hover:text-brand-yellow font-black items-center gap-2 uppercase text-lg tracking-wide border-b-2 border-black pb-1 hover:border-brand-yellow transition-colors">
            {t('viewAll')} <ArrowIcon className="w-5 h-5" />
          </Link>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200">
            <p className="text-gray-500 font-bold uppercase text-xl">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-16 sm:gap-x-8">
            {filteredProducts.map((product) => (
              <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-6 border-2 border-transparent transition-all duration-300">
                  <img 
                    src={product.image || null} 
                    alt={language === 'ar' ? product.nameAr : product.nameEn} 
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-0 right-0 bg-brand-yellow text-black text-sm font-black px-4 py-2 uppercase">
                      {t('sale')}
                    </div>
                  )}
                  {/* Quick Add Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur text-white py-4 text-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 font-bold uppercase tracking-wider text-sm hidden md:block">
                    {t('shopNow')}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-black text-xl leading-tight group-hover:text-brand-yellow transition-colors truncate text-start uppercase tracking-tight">
                    {language === 'ar' ? product.nameAr : product.nameEn}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-2xl text-black">{product.price} {t('price')}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-gray-400 text-base line-through font-medium">
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* Mobile View All */}
        <div className="mt-12 md:hidden text-center">
             <Link to="/products" className="inline-flex text-black border-2 border-black px-8 py-3 font-black items-center gap-2 uppercase text-lg tracking-wide hover:bg-black hover:text-white transition-colors">
            {t('viewAll')} <ArrowIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;