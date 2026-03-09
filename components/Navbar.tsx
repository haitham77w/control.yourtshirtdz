import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Menu, Search, Globe } from 'lucide-react';
import { LOGO_URL } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart }) => {
  const { t, language, setLanguage } = useLanguage();
  const { settings } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-black"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center justify-center md:justify-start flex-1 md:flex-none">
            <Link to="/" className="flex items-center gap-2">
              <img src={settings?.siteLogo || LOGO_URL || null} alt={settings?.siteName || "YourTshirtDZ"} className="h-12 w-12 rounded-full object-cover border-2 border-brand-yellow" />
              <span className="font-black text-xl tracking-tighter uppercase hidden sm:block">
                {(settings?.siteName || 'YourTshirtDZ').split('DZ')[0]}<span className="text-brand-yellow">DZ</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-gray-900 hover:text-brand-yellow font-bold text-sm uppercase tracking-wide transition-colors">{t('home')}</Link>
            <Link to="/products" className="text-gray-500 hover:text-brand-yellow font-bold text-sm uppercase tracking-wide transition-colors">{t('products')}</Link>
            <Link to="/about-us" className="text-gray-500 hover:text-brand-yellow font-bold text-sm uppercase tracking-wide transition-colors">{t('aboutUs')}</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-black transition-colors"
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'en' ? 'AR' : 'EN'}</span>
            </button>

            <button className="p-2 text-gray-500 hover:text-brand-yellow transition-colors hidden sm:block">
              <Search className="w-5 h-5" />
            </button>
            <button 
              onClick={onOpenCart}
              className="group flex items-center gap-2 bg-black text-white px-4 py-2 rounded-none hover:bg-brand-yellow hover:text-black transition-all duration-300"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="font-bold text-sm hidden sm:block">{t('cart')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-20 bg-white border-b border-gray-200 shadow-lg z-40">
            <div className="px-4 py-4 flex flex-col gap-1">
              <Link to="/" onClick={closeMobileMenu} className="py-3 px-2 text-gray-900 hover:text-brand-yellow font-bold text-sm uppercase tracking-wide border-b border-gray-100">
                {t('home')}
              </Link>
              <Link to="/products" onClick={closeMobileMenu} className="py-3 px-2 text-gray-900 hover:text-brand-yellow font-bold text-sm uppercase tracking-wide border-b border-gray-100">
                {t('products')}
              </Link>
              <Link to="/about-us" onClick={closeMobileMenu} className="py-3 px-2 text-gray-900 hover:text-brand-yellow font-bold text-sm uppercase tracking-wide border-b border-gray-100">
                {t('aboutUs')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
