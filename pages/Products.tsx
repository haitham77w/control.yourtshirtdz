import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Product, Category } from '../types';
import { Filter } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ProductsPageProps {
  products: Product[];
  categories: Category[];
}

const ProductsPage: React.FC<ProductsPageProps> = ({ products, categories }) => {
  const { t, language } = useLanguage();
  const { categoryId } = useParams();
  
  const selectedCategoryId = categoryId ? Number(categoryId) : null;
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === null) return products;
    return products.filter(p => p.categoryId === selectedCategoryId);
  }, [selectedCategoryId, products]);

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header - no black background, consistent with site */}
      <div className="bg-white border-b border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-brand-black font-sans">
                {t('products')}
            </h1>
            <div className="w-24 h-2 bg-brand-yellow mx-auto"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Filters (Desktop) - font consistent with site, no black bg */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <h3 className="font-sans font-semibold text-lg uppercase tracking-wide mb-6 flex items-center gap-2 text-brand-black">
                <Filter className="w-5 h-5" />
                {t('browseProducts')}
              </h3>
              
              <div className="space-y-1">
                <Link 
                  to="/products"
                  className={`w-full block text-start px-4 py-3 font-sans font-medium uppercase tracking-wide transition-colors border-l-4 ${selectedCategoryId === null ? 'border-brand-yellow bg-gray-50 text-black' : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'}`}
                >
                  {t('viewAll')}
                </Link>
                {categories.map(cat => (
                  <Link 
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    className={`w-full block text-start px-4 py-3 font-sans font-medium uppercase tracking-wide transition-colors border-l-4 ${selectedCategoryId === cat.id ? 'border-brand-yellow bg-gray-50 text-black' : 'border-transparent text-gray-500 hover:text-black hover:bg-gray-50'}`}
                  >
                    {language === 'ar' ? cat.nameAr : cat.nameEn}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Filter Toggle - no black bg, font consistent */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full bg-white border-2 border-brand-black text-brand-black py-3 font-sans font-semibold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              {isFilterOpen ? (language === 'ar' ? 'إغلاق الفلتر' : 'Close Filters') : (language === 'ar' ? 'تصفية المنتجات' : 'Filter Products')}
            </button>
            
            {isFilterOpen && (
              <div className="mt-4 grid grid-cols-2 gap-2 animate-fadeIn">
                <Link 
                  to="/products"
                  onClick={() => setIsFilterOpen(false)}
                  className={`p-3 text-center text-sm font-sans font-medium uppercase tracking-wide border-2 ${selectedCategoryId === null ? 'border-brand-yellow bg-yellow-50 text-black' : 'border-gray-200 text-gray-700'}`}
                >
                  {t('viewAll')}
                </Link>
                {categories.map(cat => (
                  <Link 
                    key={cat.id}
                    to={`/category/${cat.id}`}
                    onClick={() => setIsFilterOpen(false)}
                    className={`p-3 text-center text-sm font-sans font-medium uppercase tracking-wide border-2 ${selectedCategoryId === cat.id ? 'border-brand-yellow bg-yellow-50 text-black' : 'border-gray-200 text-gray-700'}`}
                  >
                    {language === 'ar' ? cat.nameAr : cat.nameEn}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <p className="text-gray-500 font-bold uppercase text-sm">
                Showing {filteredProducts.length} Products
              </p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-200">
                <p className="text-gray-500 font-bold uppercase text-xl">No products found.</p>
                <button 
                    onClick={() => setSelectedCategoryId(null)}
                    className="mt-4 text-brand-yellow font-black uppercase hover:underline"
                >
                    Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-12 sm:gap-x-8">
                {filteredProducts.map((product) => (
                  <Link to={`/product/${product.id}`} key={product.id} className="group cursor-pointer">
                    <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-4 border-2 border-transparent transition-all duration-300">
                      <img 
                        src={product.image || null} 
                        alt={language === 'ar' ? product.nameAr : product.nameEn} 
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                      />
                      {product.originalPrice && product.originalPrice > product.price && (
                        <div className="absolute top-0 right-0 bg-brand-yellow text-black text-xs font-black px-3 py-1 uppercase">
                          {t('sale')}
                        </div>
                      )}
                      {/* Quick Add Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur text-white py-3 text-center transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 font-bold uppercase tracking-wider text-xs hidden md:block">
                        {t('shopNow')}
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-black text-lg leading-tight group-hover:text-brand-yellow transition-colors truncate text-start uppercase tracking-tight">
                        {language === 'ar' ? product.nameAr : product.nameEn}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-xl text-black">{product.price} {t('price')}</span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-gray-400 text-sm line-through font-medium">
                            {product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
