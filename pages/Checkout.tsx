import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CartItem } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import OrderForm from '../components/OrderForm';

interface CheckoutProps {
  cart: CartItem[];
  total: number;
  onClearCart: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cart, total, onClearCart }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <p className="text-xl font-bold mb-4 uppercase">{t('emptyCart')}</p>
        <button
          onClick={() => navigate('/')}
          className="text-brand-yellow font-bold underline uppercase"
        >
          {t('browseProducts')}
        </button>
      </div>
    );
  }

  return (
    <OrderForm
      items={cart}
      total={total}
      onClearCart={onClearCart}
      onSuccess={() => navigate('/')}
    />
  );
};

export default Checkout;
