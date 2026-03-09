/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'ar';

type Translations = {
  [key: string]: {
    en: string;
    ar: string;
  };
};

const translations: Translations = {
  // Navigation
  home: { en: "Home", ar: "الرئيسية" },
  products: { en: "Products", ar: "المنتجات" },
  newArrivals: { en: "New Arrivals", ar: "أحدث المنتجات" },
  sale: { en: "Sale", ar: "تخفيضات" },
  cart: { en: "Cart", ar: "السلة" },
  
  // Home Hero
  heroBadge: { en: "EST. 2026", ar: "تأسس 2026" },
  heroTitle1: { en: "YourTshirt", ar: "YourTshirt" },
  heroTitle2: { en: "DZ", ar: "DZ" },
  heroDesc: { en: "Redefine your style with our exclusive 2026 streetwear collection. Bold, authentic, and made for the streets of Algeria.", ar: "أعد تعريف أسلوبك مع تشكيلة ستريت وير 2026 الحصرية. جريئة، أصلية، ومصممة لشوارع الجزائر." },
  shopNow: { en: "EXPLORE DROP", ar: "اكتشف المجموعة" },
  marqueeText: { en: "• NEW COLLECTION 2026 • STREETWEAR • ALGERIA • LIMITED EDITION • FREE SHIPPING 58 WILAYAS", ar: "• تشكيلة جديدة 2026 • ستريت وير • الجزائر • إصدار محدود • توصيل 58 ولاية" },

  // Features
  deliveryTitle: { en: "58 Wilayas Delivery", ar: "توصيل 58 ولاية" },
  deliveryDesc: { en: "We reach you wherever you are in Algeria", ar: "نصلك أينما كنت في الجزائر" },
  qualityTitle: { en: "High Quality", ar: "جودة عالية" },
  qualityDesc: { en: "Best fabrics and brands", ar: "أفضل الأقمشة والماركات" },
  codTitle: { en: "Cash on Delivery", ar: "الدفع عند الاستلام" },
  codDesc: { en: "Inspect your order then pay", ar: "افحص طلبك ثم ادفع" },
  
  // Sections
  featuredProducts: { en: "Featured Products", ar: "منتجات مميزة" },
  bestProducts: { en: "Best Products", ar: "أفضل المنتجات" },
  viewAll: { en: "View All", ar: "عرض الكل" },
  
  // Product Details
  price: { en: "DZD", ar: "د.ج" },
  color: { en: "Color", ar: "اللون" },
  size: { en: "Size", ar: "المقاس" },
  quantity: { en: "Quantity", ar: "الكمية" },
  addToCart: { en: "Add to Cart", ar: "إضافة للسلة" },
  buyNow: { en: "Buy Now", ar: "اشترِ الآن" },
  selectOptionsError: { en: "Please select size and color", ar: "يرجى اختيار المقاس واللون" },
  fastDelivery: { en: "Fast delivery available to 58 wilayas", ar: "توصيل سريع ومتوفر لـ 58 ولاية" },
  
  // Cart
  shoppingCart: { en: "Shopping Cart", ar: "سلة المشتريات" },
  emptyCart: { en: "Your cart is empty", ar: "سلتك فارغة حالياً" },
  browseProducts: { en: "Browse Products", ar: "تصفح المنتجات" },
  total: { en: "Total", ar: "المجموع" },
  checkout: { en: "Checkout", ar: "إتمام الطلب" },
  continueShopping: { en: "Continue Shopping", ar: "متابعة تسوق" },
  
  // Checkout
  checkoutTitle: { en: "Checkout", ar: "إتمام الطلب" },
  orderSummary: { en: "Order Summary", ar: "ملخص الطلب" },
  subtotal: { en: "Subtotal", ar: "المجموع الفرعي" },
  delivery: { en: "Delivery", ar: "التوصيل" },
  deliveryMethod: { en: "Delivery Method", ar: "طريقة التوصيل" },
  stopdesk: { en: "Delivery to ZR Express office", ar: "توصيل إلى مكتب ZR اكسبراس" },
  homeDelivery: { en: "Home Delivery", ar: "باب المنزل" },
  shippingInfo: { en: "Shipping Information", ar: "معلومات التوصيل" },
  firstName: { en: "First Name", ar: "الاسم" },
  lastName: { en: "Last Name", ar: "اللقب" },
  phone: { en: "Phone Number", ar: "رقم الهاتف" },
  wilaya: { en: "Wilaya", ar: "الولاية" },
  selectWilaya: { en: "Select Wilaya", ar: "اختر الولاية" },
  baladiya: { en: "Baladiya (Municipality)", ar: "البلدية" },
  address: { en: "Home Address", ar: "عنوان المنزل" },
  addressPlaceholder: { en: "District, House number...", ar: "الحي، رقم المنزل..." },
  instagram: { en: "Instagram Username (Optional)", ar: "اسم حساب انستغرام (اختياري)" },
  confirmOrder: { en: "Confirm Order", ar: "تأكيد الطلب" },
  processing: { en: "Processing...", ar: "جاري التأكيد..." },
  
  // Success
  successTitle: { en: "Order Received Successfully!", ar: "تم استلام طلبك بنجاح!" },
  successMessage: { en: "Thank you {name}. Our team will contact you shortly to confirm the order at {phone}.", ar: "شكراً لك {name}. سيتصل بك فريقنا قريباً لتأكيد الطلب على الرقم {phone}." },
  backToStore: { en: "Back to Store", ar: "العودة للمتجر" },
  
  // Footer
  aboutText: { en: "Your #1 store for modern clothing in Algeria. High quality, competitive prices, and fast delivery to all states.", ar: "متجرك الأول للملابس العصرية في الجزائر. جودة عالية، أسعار تنافسية، وتوصيل سريع لجميع الولايات." },
  quickLinks: { en: "Quick Links", ar: "روابط سريعة" },
  contactUs: { en: "Contact Us", ar: "تواصل معنا" },
  aboutUs: { en: "About Us", ar: "من نحن" },
  deliveryPolicy: { en: "Delivery Policy", ar: "سياسة التوصيل" },
  faq: { en: "FAQ", ar: "الأسئلة الشائعة" },
  rights: { en: "© 2026 YourTshirtDZ. All rights reserved.", ar: "© 2026 YourTshirtDZ. جميع الحقوق محفوظة." },

  // About Page
  aboutStoryText: { 
    en: "YourTshirtDZ started in 2026 with a simple mission: to bring authentic, high-quality streetwear to the Algerian youth. We believe in bold designs, premium fabrics, and a community-first approach. From the streets of Algiers to every Wilaya, we represent the new wave of Algerian fashion.", 
    ar: "انطلق متجر YourTshirtDZ في عام 2026 بمهمة بسيطة: تقديم ملابس ستريت وير أصلية وعالية الجودة للشباب الجزائري. نحن نؤمن بالتصاميم الجريئة، والأقمشة الفاخرة، والنهج الذي يضع المجتمع أولاً. من شوارع الجزائر العاصمة إلى كل ولاية، نحن نمثل الموجة الجديدة للموضة الجزائرية." 
  },
  visitUs: { en: "Visit Our Store", ar: "قم بزيارة متجرنا" },
  contactInfo: { en: "Contact Information", ar: "معلومات الاتصال" },
  openingHours: { en: "Opening Hours", ar: "ساعات العمل" }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[key]?.[language] || key;
  };

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};