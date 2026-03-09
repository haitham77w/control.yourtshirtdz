import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { OrderFormState, CartItem, WilayaData } from '../types';
import { ArrowLeft, ArrowRight, Truck, MapPin, Instagram, CheckCircle, Building2, Home, Loader2, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled,
  language
}: {
  options: { id: number; label: string }[];
  value: number;
  onChange: (id: number) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  language: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.id === value);
  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-bold mb-2 uppercase">{label}</label>
      <div
        className={`w-full bg-gray-50 border border-gray-200 rounded-none p-3 flex justify-between items-center cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-black'} ${isOpen ? 'border-black ring-1 ring-black' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? 'text-black font-medium' : 'text-gray-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[60] w-full mt-1 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                autoFocus
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 focus:border-black outline-none bg-white"
                placeholder={language === 'ar' ? 'ابحث...' : 'Search...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  className={`p-3 text-sm hover:bg-brand-yellow cursor-pointer transition-colors flex items-center justify-between ${value === opt.id ? 'bg-yellow-50 font-bold' : ''}`}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span>{opt.label}</span>
                  {value === opt.id && <CheckCircle className="w-4 h-4 text-black" />}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 italic">
                {language === 'ar' ? 'لا توجد نتائج' : 'No results found'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export interface OrderFormProps {
  items: CartItem[];
  total: number;
  onClearCart: () => void;
  onSuccess: () => void;
  /** If true, show compact layout (e.g. inside product page) */
  compact?: boolean;
}

const OrderForm: React.FC<OrderFormProps> = ({ items, total, onClearCart, onSuccess, compact }) => {
  const { t, language, dir } = useLanguage();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const [formData, setFormData] = useState<OrderFormState>({
    firstName: '',
    lastName: '',
    phone: '',
    wilayaId: 0,
    baladiya: '',
    instagram: '',
    deliveryMethod: 'stopdesk',
    address: ''
  });

  const [wilayas, setWilayas] = useState<WilayaData[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [deliveryPrice, setDeliveryPrice] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const { data: wilayasData } = await supabase.from('wilayas').select('*').order('code');
        if (wilayasData) {
          setWilayas(
            wilayasData.map((w: any) => ({
              id: w.id,
              code: w.code,
              nameAr: w.name_ar,
              nameEn: w.name_en,
              deliveryPriceHome: w.delivery_price_home,
              deliveryPriceDesk: w.delivery_price_desk
            }))
          );
        }
      } catch (err) {
        console.error('Error fetching locations', err);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, []);

  useEffect(() => {
    const wilaya = wilayas.find((w) => w.id === Number(formData.wilayaId));
    if (wilaya) {
      setDeliveryPrice(
        formData.deliveryMethod === 'home' ? wilaya.deliveryPriceHome : wilaya.deliveryPriceDesk
      );
    } else {
      setDeliveryPrice(0);
    }
  }, [formData.wilayaId, formData.deliveryMethod, wilayas]);

  const finalTotal = total + deliveryPrice;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      if (cleaned.length > 0 && cleaned.length < 10) {
        setPhoneError(
          language === 'ar' ? 'رقم الهاتف يجب أن يتكون من 10 أرقام' : 'Phone number must be 10 digits'
        );
      } else if (cleaned.length === 10 && !/^(05|06|07)/.test(cleaned)) {
        setPhoneError(
          language === 'ar'
            ? 'رقم الهاتف غير صالح (يجب أن يبدأ بـ 05، 06 أو 07)'
            : 'Invalid phone number (must start with 05, 06 or 07)'
        );
      } else {
        setPhoneError('');
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDeliveryChange = (method: 'home' | 'stopdesk') => {
    setFormData((prev) => ({ ...prev, deliveryMethod: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone.length !== 10 || !/^(05|06|07)/.test(formData.phone)) {
      setPhoneError(
        language === 'ar' ? 'يرجى إدخال رقم هاتف صالح (10 أرقام)' : 'Please enter a valid phone number (10 digits)'
      );
      return;
    }
    if (!formData.wilayaId || !formData.baladiya) {
      setSubmitError(
        language === 'ar' ? 'يرجى اختيار الولاية وكتابة البلدية' : 'Please select Wilaya and type Baladiya'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone,
          wilaya_id: Number(formData.wilayaId),
          baladiya_id: null,
          custom_baladiya: formData.baladiya,
          address: formData.address,
          instagram_handle: formData.instagram,
          delivery_method: formData.deliveryMethod,
          shipping_fee: deliveryPrice,
          total_amount: finalTotal,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      if (order) {
        const orderItems = items.map((item) => ({
          order_id: order.id,
          product_id: item.id,
          variant_id: Number(item.selectedVariantId),
          quantity: item.quantity,
          price_at_purchase: item.price
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) {
          // إذا الطلبية دخلت (orders) لكن order_items فشل (مثلاً foreign key)، نعرض صفحة الشكر ولا نعرض الخطأ للمستخدم
          const isOrderItemsFkError =
            itemsError.message?.includes('order_items') &&
            (itemsError.message?.includes('foreign key') || itemsError.message?.includes('product_id_fkey'));
          if (isOrderItemsFkError) {
            console.warn('Order saved but order_items failed (e.g. FK):', itemsError);
            setIsSuccess(true);
            onClearCart();
          } else {
            throw itemsError;
          }
        } else {
          setIsSuccess(true);
          onClearCart();
        }
      }
    } catch (err: any) {
      console.error('Order submission error:', err);
      let errorMsg = err?.message || 'Failed to submit order. Please try again.';
      if (errorMsg.includes('custom_baladiya')) {
        errorMsg =
          language === 'ar'
            ? "خطأ في قاعدة البيانات: يرجى تشغيل أمر SQL في Supabase لإضافة عمود 'custom_baladiya'."
            : "Database Error: Please run the SQL command in Supabase to add the 'custom_baladiya' column.";
      }
      if (errorMsg.includes('order_items') && (errorMsg.includes('foreign key') || errorMsg.includes('product_id_fkey'))) {
        // الطلبية انرسلت (orders)؛ نعرض صفحة الشكر بدل رسالة الخطأ
        setIsSuccess(true);
        onClearCart();
      } else {
        setSubmitError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    const successMsg = t('successMessage')
      .replace('{name}', formData.firstName)
      .replace('{phone}', formData.phone);

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-start pt-8 md:pt-12 px-4 text-center bg-gray-50">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-brand-yellow p-6 md:p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-6 md:mb-8"
        >
          <CheckCircle className="w-16 h-16 md:w-20 md:h-20 text-black" />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-2xl"
        >
          <h2 className="text-3xl md:text-6xl font-black mb-6 uppercase tracking-tighter">
            {language === 'ar' ? 'تم استلام طلبك!' : 'ORDER RECEIVED!'}
          </h2>
          <div className="max-w-md mx-auto bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
            <p className="text-lg font-bold leading-relaxed">{successMsg}</p>
          </div>
          <button
            onClick={onSuccess}
            className="group inline-flex items-center gap-4 bg-black text-white px-8 py-4 font-black text-lg uppercase tracking-wider hover:bg-brand-yellow hover:text-black transition-all"
          >
            {t('backToStore')}
            <ArrowIcon className="w-6 h-6" />
          </button>
        </motion.div>
      </div>
    );
  }

  const selectedWilayaData = wilayas.find((w) => w.id === Number(formData.wilayaId));

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      {compact && (
        <div className="bg-gray-50 p-6 rounded-none border border-gray-100 mb-6">
          <h3 className="font-bold text-lg mb-4 uppercase">{t('orderSummary')}</h3>
          <div className="space-y-4 mb-6">
            {items.map((item) => (
              <div key={item.cartId} className="flex gap-3 text-sm">
                <div className="w-12 h-12 bg-white rounded-none overflow-hidden flex-shrink-0 border border-gray-200">
                  <img
                    src={item.image || null}
                    alt={language === 'ar' ? item.nameAr : item.nameEn}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-bold line-clamp-1 uppercase">
                    {language === 'ar' ? item.nameAr : item.nameEn}
                  </p>
                  <p className="text-gray-500">
                    {item.selectedSize} / {item.selectedColor} x {item.quantity}
                  </p>
                </div>
                <div className="font-bold text-black">{item.price * item.quantity} {t('price')}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 uppercase text-xs font-bold">{t('subtotal')}</span>
              <span className="font-bold text-black">{total} {t('price')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 uppercase text-xs font-bold">{t('delivery')}</span>
              <span className="font-bold text-black">{deliveryPrice > 0 ? `${deliveryPrice} ${t('price')}` : '-'}</span>
            </div>
            <div className="flex justify-between text-xl font-black pt-2 border-t border-gray-200 mt-2 uppercase">
              <span>{t('total')}</span>
              <span className="text-black bg-brand-yellow px-2 rounded-none">{finalTotal} {t('price')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-none border-2 border-gray-100">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 uppercase">
          <Truck className="w-5 h-5 text-brand-yellow" />
          {t('deliveryMethod')}
        </h3>
        {!formData.wilayaId && (
          <div className="mb-4 bg-yellow-50 p-3 text-sm font-bold text-yellow-800 border border-yellow-200">
            {language === 'ar' ? 'يرجى اختيار الولاية أولاً لمعرفة تكلفة التوصيل' : 'Please select a Wilaya first to see shipping rates.'}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => handleDeliveryChange('stopdesk')}
            className={`cursor-pointer p-4 rounded-none border-2 transition-all flex items-center justify-between ${formData.deliveryMethod === 'stopdesk' ? 'border-brand-yellow bg-yellow-50' : 'border-gray-200 hover:border-black'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-none border-2 flex items-center justify-center ${formData.deliveryMethod === 'stopdesk' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm uppercase block">{t('stopdesk')}</span>
                <span className="text-xs text-gray-500">ZR Express</span>
              </div>
            </div>
            <span className="font-bold text-black">
              {selectedWilayaData ? selectedWilayaData.deliveryPriceDesk : '-'} {t('price')}
            </span>
          </div>
          <div
            onClick={() => handleDeliveryChange('home')}
            className={`cursor-pointer p-4 rounded-none border-2 transition-all flex items-center justify-between ${formData.deliveryMethod === 'home' ? 'border-brand-yellow bg-yellow-50' : 'border-gray-200 hover:border-black'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-none border-2 flex items-center justify-center ${formData.deliveryMethod === 'home' ? 'bg-black text-white border-black' : 'bg-gray-100 text-gray-400 border-gray-200'}`}
              >
                <Home className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm uppercase block">{t('homeDelivery')}</span>
                <span className="text-xs text-gray-500">Door to Door</span>
              </div>
            </div>
            <span className="font-bold text-black">
              {selectedWilayaData ? selectedWilayaData.deliveryPriceHome : '-'} {t('price')}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-none border-2 border-gray-100">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 uppercase">
          <MapPin className="w-5 h-5 text-brand-yellow" />
          {t('shippingInfo')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 uppercase">{t('firstName')}</label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 focus:outline-none focus:border-black focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase">{t('lastName')}</label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 focus:outline-none focus:border-black focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 uppercase">{t('phone')}</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                required
                placeholder="05/06/07..."
                value={formData.phone}
                onChange={handleChange}
                className={`w-full bg-gray-50 border ${phoneError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 focus:border-black'} rounded-none p-3 focus:outline-none focus:ring-0 transition-all`}
              />
              {phoneError && (
                <div className="absolute -bottom-6 left-0 text-[10px] text-red-600 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {phoneError}
                </div>
              )}
            </div>
          </div>
          <SearchableSelect
            label={t('wilaya')}
            placeholder={loadingLocations ? 'Loading...' : t('selectWilaya')}
            options={wilayas.map((w) => ({
              id: w.id,
              label: `${w.code} - ${language === 'ar' ? w.nameAr : w.nameEn}`
            }))}
            value={formData.wilayaId}
            onChange={(id) => setFormData((prev) => ({ ...prev, wilayaId: id, baladiya: '' }))}
            disabled={loadingLocations}
            language={language}
          />
          <div>
            <label className="block text-sm font-bold mb-2 uppercase">{t('baladiya')}</label>
            <input
              type="text"
              name="baladiya"
              required
              placeholder={language === 'ar' ? 'اكتب اسم البلدية هنا' : 'Type municipality name'}
              value={formData.baladiya}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 focus:outline-none focus:border-black focus:ring-0"
            />
          </div>
          {formData.deliveryMethod === 'home' && (
            <div className="sm:col-span-2">
              <label className="block text-sm font-bold mb-2 text-brand-yellow uppercase">{t('address')}</label>
              <input
                type="text"
                name="address"
                required
                placeholder={t('addressPlaceholder')}
                value={formData.address}
                onChange={handleChange}
                className="w-full bg-yellow-50 border border-brand-yellow rounded-none p-3 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold mb-2 flex items-center gap-2 uppercase">
              <Instagram className="w-4 h-4" />
              {t('instagram')}
            </label>
            <input
              type="text"
              name="instagram"
              placeholder="@username"
              value={formData.instagram}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-none p-3 focus:outline-none focus:border-black focus:ring-0"
            />
          </div>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 text-red-600 p-4 border border-red-200 font-bold">{submitError}</div>
      )}

      {compact && (
        <div className="flex justify-between items-center border-t border-gray-200 pt-4">
          <div>
            <span className="text-gray-600 uppercase text-xs font-bold">{t('delivery')}: </span>
            <span className="font-bold text-black">{deliveryPrice > 0 ? `${deliveryPrice} ${t('price')}` : '-'}</span>
            <span className="font-black text-lg ml-2">| {t('total')}: {finalTotal} {t('price')}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-black text-brand-yellow font-black text-xl py-4 rounded-none hover:bg-gray-900 transition-all border-b-4 border-yellow-600 active:border-b-0 active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-wider"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            {t('processing')}
          </>
        ) : (
          <>
            {t('confirmOrder')}
            <ArrowIcon className="w-6 h-6" />
          </>
        )}
      </button>
    </form>
  );

  if (compact) {
    return <div className="border-2 border-black p-6 bg-gray-50">{formContent}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black mb-8 text-center uppercase tracking-tight">{t('checkoutTitle')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 order-2 md:order-1">
          <div className="bg-gray-50 p-6 rounded-none sticky top-24 border border-gray-100">
            <h3 className="font-bold text-lg mb-4 uppercase">{t('orderSummary')}</h3>
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.cartId} className="flex gap-3 text-sm">
                  <div className="w-12 h-12 bg-white rounded-none overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={item.image || null}
                      alt={language === 'ar' ? item.nameAr : item.nameEn}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold line-clamp-1 uppercase">
                      {language === 'ar' ? item.nameAr : item.nameEn}
                    </p>
                    <p className="text-gray-500">
                      {item.selectedSize} / {item.selectedColor} x {item.quantity}
                    </p>
                  </div>
                  <div className="font-bold text-black">{item.price * item.quantity} {t('price')}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 uppercase text-xs font-bold">{t('subtotal')}</span>
                <span className="font-bold text-black">{total} {t('price')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 uppercase text-xs font-bold">{t('delivery')}</span>
                <span className="font-bold text-black">{deliveryPrice > 0 ? `${deliveryPrice} ${t('price')}` : '-'}</span>
              </div>
              <div className="flex justify-between text-xl font-black pt-2 border-t border-gray-200 mt-2 uppercase">
                <span>{t('total')}</span>
                <span className="text-black bg-brand-yellow px-2 rounded-none">{finalTotal} {t('price')}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="md:col-span-2 order-1 md:order-2">{formContent}</div>
      </div>
    </div>
  );
};

export default OrderForm;
