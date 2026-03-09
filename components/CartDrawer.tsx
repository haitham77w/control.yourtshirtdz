import React from 'react';
import { X, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (id: string) => void;
  total: number;
}

const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, items, onRemove, total }) => {
  const navigate = useNavigate();
  const { t, language, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  if (!isOpen) return null;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    onClose();
    navigate('/products');
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-y-0 max-w-full flex ltr:right-0 rtl:left-0">
        <div className={`w-screen max-w-md transform transition-transform ease-in-out duration-500 bg-white shadow-2xl flex flex-col h-full absolute ${dir === 'ltr' ? 'right-0' : 'left-0'}`}>
          
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold uppercase">{t('shoppingCart')} ({items.length})</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-none transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
                <ShoppingBagIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="uppercase tracking-wide">{t('emptyCart')}</p>
                <button onClick={onClose} className="mt-4 text-brand-yellow font-bold hover:underline uppercase">
                  {t('browseProducts')}
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.cartId} className="flex gap-4">
                  <div className="w-20 h-24 flex-shrink-0 bg-gray-100 rounded-none overflow-hidden border border-gray-200">
                    <img src={item.image || null} alt={language === 'ar' ? item.nameAr : item.nameEn} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm uppercase">{language === 'ar' ? item.nameAr : item.nameEn}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {item.selectedSize} / {item.selectedColor}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-black">{item.price} {t('price')}</p>
                      <button 
                        onClick={() => onRemove(item.cartId)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-100 p-6 space-y-4 bg-gray-50">
              <div className="flex items-center justify-between text-lg font-black uppercase">
                <span>{t('total')}</span>
                <span className="text-black">{total} {t('price')}</span>
              </div>
              <button
                type="button"
                onClick={handleContinueShopping}
                className="w-full bg-white text-black font-bold py-3 rounded-none border-2 border-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {t('continueShopping')}
              </button>
              <button 
                onClick={handleCheckout}
                className="w-full bg-brand-yellow text-black font-bold py-4 rounded-none hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                <span>{t('checkout')}</span>
                <ArrowIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function ShoppingBagIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

export default CartDrawer;
