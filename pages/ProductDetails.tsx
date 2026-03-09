import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, ProductVariant, CartItem } from '../types';
import { Minus, Plus, ShoppingBag, AlertCircle, ChevronDown, ChevronUp, Truck, ShieldCheck, Share2, ArrowRight, ArrowLeft, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import OrderForm from '../components/OrderForm';

interface ProductDetailsProps {
    products: Product[];
    onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
}

const ProductView: React.FC<{
    product: Product;
    relatedProducts: Product[];
    onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
}> = ({ product, relatedProducts, onAddToCart }) => {
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [quantity, setQuantity] = useState(1);
    const [error, setError] = useState('');
    const [openSection, setOpenSection] = useState<string | null>('description');
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const orderFormRef = React.useRef<HTMLDivElement | null>(null);

    const { t, language, dir } = useLanguage();
    const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Extract unique sizes and colors available for this product
    const uniqueSizes = useMemo(() => Array.from(new Set(product.variants.map(v => v.size))), [product.variants]);
    const uniqueColors = useMemo(() => Array.from(new Set(product.variants.map(v => v.color))), [product.variants]);

    // Helper to find specific variant stock
    const getVariant = (size: string, color: string): ProductVariant | undefined => {
        return product.variants.find(v => v.size === size && v.color === color);
    };

    const getStock = (size: string, color: string): number => {
        const v = getVariant(size, color);
        return v ? v.quantity : 0;
    };

    const handleAddToCart = () => {
        if (!selectedSize || !selectedColor) {
            setError(t('selectOptionsError'));
            return;
        }

        const stock = getStock(selectedSize, selectedColor);
        if (quantity > stock) {
            setError(language === 'ar' ? 'الكمية المطلوبة غير متوفرة' : 'Requested quantity not available');
            return;
        }

        setError('');
        onAddToCart(product, selectedSize, selectedColor, quantity);
    };

    const handleBuyNow = () => {
        if (!selectedSize || !selectedColor) {
            setError(t('selectOptionsError'));
            return;
        }
        const stock = getStock(selectedSize, selectedColor);
        if (quantity > stock) {
            setError(language === 'ar' ? 'الكمية المطلوبة غير متوفرة' : 'Requested quantity not available');
            return;
        }
        setError('');
        setShowOrderForm(true);

        // تمرير الشاشة تلقائياً إلى نموذج الطلب (على موبايل و ديسكتوب)
        setTimeout(() => {
            orderFormRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 150);
    };

    const buyNowCartItem: CartItem | null = selectedSize && selectedColor ? (() => {
        const v = getVariant(selectedSize, selectedColor);
        if (!v) return null;
        return {
            ...product,
            selectedVariantId: String(v.id),
            selectedSize,
            selectedColor,
            quantity,
            cartId: `buy-now-${product.id}-${selectedSize}-${selectedColor}-${Date.now()}`
        };
    })() : null;

    const toggleSection = (section: string) => {
        setOpenSection(openSection === section ? null : section);
    };

    const productName = language === 'ar' ? product.nameAr : product.nameEn;
    const productDesc = language === 'ar' ? product.descriptionAr : product.descriptionEn;
    const currentStock = selectedSize && selectedColor ? getStock(selectedSize, selectedColor) : 0;
    const isOutOfStock = selectedSize && selectedColor && currentStock === 0;

    return (
        <div className="bg-white pb-20">
            {/* Breadcrumb - Mobile Optimized */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center text-xs md:text-sm text-gray-500 uppercase tracking-wider gap-2">
                    <Link to="/" className="hover:text-black hover:underline">{t('home')}</Link>
                    <span>/</span>
                    <span className="font-bold text-black">{product.category}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">

                    {/* LEFT COLUMN: Product Image Gallery */}
                    <div className="lg:col-span-7">
                        <div className="sticky top-24">
                            <div className="flex flex-col md:flex-row gap-4">
                                {/* Thumbnails - Side on Desktop, Bottom on Mobile */}
                                {product.imagesUrls && product.imagesUrls.length > 1 && (
                                    <div className="order-2 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar max-h-[100px] md:max-h-[500px]">
                                        {product.imagesUrls.map((img, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentImageIndex(idx)}
                                                className={`relative flex-shrink-0 w-20 h-24 md:w-24 md:h-32 border-2 transition-all ${currentImageIndex === idx ? 'border-brand-yellow scale-[0.98]' : 'border-transparent hover:border-gray-300'}`}
                                            >
                                                <img
                                                    src={img}
                                                    alt={`${productName} thumbnail ${idx + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Main Image */}
                                <div className="order-1 md:order-2 flex-1 relative aspect-[3/4] md:aspect-square bg-gray-100 overflow-hidden border-2 border-transparent group">
                                    <img
                                        src={(product.imagesUrls && product.imagesUrls.length > 0) ? product.imagesUrls[currentImageIndex] : (product.image || null)}
                                        alt={productName}
                                        className="w-full h-full object-cover transition-transform duration-700 md:group-hover:scale-110 cursor-zoom-in"
                                    />
                                    {product.originalPrice && product.originalPrice > product.price && (
                                        <div className="absolute top-4 left-4 bg-brand-yellow text-black px-3 py-1 text-sm font-black uppercase tracking-widest border border-black z-10">
                                            {t('sale')}
                                        </div>
                                    )}

                                    {/* Navigation Arrows for Mobile (if multiple images) */}
                                    {product.imagesUrls && product.imagesUrls.length > 1 && (
                                        <div className="absolute inset-0 flex items-center justify-between px-4 md:hidden pointer-events-none">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentImageIndex(prev => prev === 0 ? product.imagesUrls!.length - 1 : prev - 1);
                                                }}
                                                className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-lg pointer-events-auto active:scale-90 transition-transform"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCurrentImageIndex(prev => prev === product.imagesUrls!.length - 1 ? 0 : prev + 1);
                                                }}
                                                className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-lg pointer-events-auto active:scale-90 transition-transform"
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Product Info */}
                    <div className="lg:col-span-5 flex flex-col">

                        {/* Header */}
                        <div className="mb-6 border-b border-gray-100 pb-6">
                            <div className="flex justify-between items-start mb-2">
                                <h1 className="text-3xl md:text-5xl font-black uppercase leading-tight text-brand-black">{productName}</h1>
                                <button className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex items-end gap-3 mt-2">
                                <span className="text-3xl font-bold text-black">
                                    {product.price} {t('price')}
                                </span>
                                {product.originalPrice && product.originalPrice > product.price && (
                                    <span className="text-lg text-gray-400 line-through font-medium mb-1">
                                        {product.originalPrice}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Selectors */}
                        <div className="space-y-6 mb-8">
                            {/* Size Selector */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-black uppercase tracking-wider">{t('size')}: <span className="text-gray-500 font-normal">{selectedSize}</span></label>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {uniqueSizes.map((size) => {
                                        const hasAnyStock = product.variants.some(v => v.size === size && v.quantity > 0);
                                        return (
                                            <button
                                                key={size}
                                                disabled={!hasAnyStock}
                                                onClick={() => {
                                                    setSelectedSize(size);
                                                    setSelectedColor('');
                                                    setQuantity(1);
                                                    setError('');
                                                }}
                                                className={`
                                                    h-12 flex items-center justify-center font-bold text-sm uppercase transition-all border-2
                                                    ${selectedSize === size
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white text-black border-gray-200 hover:border-black'}
                                                    ${!hasAnyStock ? 'opacity-40 cursor-not-allowed bg-gray-50 decoration-slice line-through' : ''}
                                                `}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Color Selector */}
                            <div>
                                <label className="block text-sm font-black uppercase tracking-wider mb-2">
                                    {t('color')}: <span className="text-gray-500 font-normal">{selectedColor}</span>
                                    {!selectedSize && <span className="text-xs text-red-500 normal-case mx-2">({t('selectOptionsError')})</span>}
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {uniqueColors.map((color) => {
                                        const variant = selectedSize ? getVariant(selectedSize, color) : null;
                                        const stock = variant ? variant.quantity : 0;
                                        const isAvailable = selectedSize ? stock > 0 : true;

                                        return (
                                            <button
                                                key={color}
                                                disabled={!selectedSize || !isAvailable}
                                                onClick={() => {
                                                    setSelectedColor(color);
                                                    setQuantity(1);
                                                    setError('');
                                                }}
                                                className={`
                                                    h-12 flex items-center justify-center font-bold text-sm uppercase transition-all border-2
                                                    ${selectedColor === color
                                                        ? 'bg-black text-white border-black'
                                                        : 'bg-white text-black border-gray-200 hover:border-black'}
                                                    ${(!selectedSize || !isAvailable) && selectedSize ? 'opacity-40 cursor-not-allowed bg-gray-50 line-through' : ''}
                                                `}
                                            >
                                                {color}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quantity & Stock */}
                            <div className="flex items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-black uppercase tracking-wider mb-2">{t('quantity')}</label>
                                    <div className="flex items-center w-full max-w-[150px] h-12 border-2 border-black">
                                        <button
                                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                            disabled={quantity <= 1 || isOutOfStock}
                                            className="w-12 h-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="flex-1 text-center font-black text-lg">{quantity}</span>
                                        <button
                                            onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                                            disabled={quantity >= currentStock || isOutOfStock}
                                            className="w-12 h-full flex items-center justify-center hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {selectedSize && selectedColor && (
                                    <div className={`text-sm font-bold uppercase py-2 px-3 border ${currentStock < 5 ? 'border-red-200 bg-red-50 text-red-600' : 'border-green-200 bg-green-50 text-green-700'}`}>
                                        {currentStock > 0 ? (language === 'ar' ? 'متوفر' : 'In Stock') : (language === 'ar' ? 'غير متوفر' : 'Out of Stock')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Errors */}
                        {error && (
                            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 animate-pulse">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <p className="text-red-700 font-bold text-sm">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mb-8 space-y-3">
                            <button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock}
                                className={`w-full h-14 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-lg transition-all transform active:scale-[0.98]
                                    ${isOutOfStock
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-brand-yellow text-black hover:bg-[#E6C200] border-2 border-transparent hover:border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                                    }
                                `}
                            >
                                <ShoppingBag className="w-5 h-5" />
                                <span>{isOutOfStock ? 'Sold Out' : t('addToCart')}</span>
                                {!isOutOfStock && <span className="text-sm opacity-80 font-medium">| {(product.price * quantity)} {t('price')}</span>}
                            </button>
                            <button
                                onClick={handleBuyNow}
                                disabled={isOutOfStock}
                                className={`w-full h-14 flex items-center justify-center gap-3 font-black uppercase tracking-widest text-lg transition-all transform active:scale-[0.98] border-2 border-black
                                    ${isOutOfStock
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                        : 'bg-black text-white hover:bg-gray-800'
                                    }
                                `}
                            >
                                <CreditCard className="w-5 h-5" />
                                <span>{t('buyNow')}</span>
                                {!isOutOfStock && <span className="text-sm opacity-80">| {(product.price * quantity)} {t('price')}</span>}
                            </button>
                        </div>

                        {/* Buy Now - Order Form (appears when user clicks Buy Now) */}
                        {showOrderForm && buyNowCartItem && (
                            <div className="mb-10" ref={orderFormRef}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-black uppercase">{t('checkoutTitle')}</h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowOrderForm(false)}
                                        className="text-sm font-bold uppercase text-gray-500 hover:text-black"
                                    >
                                        {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                    </button>
                                </div>
                                <OrderForm
                                    items={[buyNowCartItem]}
                                    total={product.price * quantity}
                                    onClearCart={() => { }}
                                    onSuccess={() => setShowOrderForm(false)}
                                    compact
                                />
                            </div>
                        )}

                        {/* Info Accordions */}
                        <div className="border-t border-gray-200">
                            {/* Description */}
                            <div className="border-b border-gray-200">
                                <button
                                    onClick={() => toggleSection('description')}
                                    className="w-full py-4 flex items-center justify-between group"
                                >
                                    <span className="font-bold uppercase tracking-wide flex items-center gap-3">
                                        <div className="w-2 h-2 bg-black rounded-full group-hover:bg-brand-yellow transition-colors"></div>
                                        Product Description
                                    </span>
                                    {openSection === 'description' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'description' ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                                    <p className="text-gray-600 leading-relaxed text-sm md:text-base">{productDesc}</p>
                                </div>
                            </div>

                            {/* Delivery */}
                            <div className="border-b border-gray-200">
                                <button
                                    onClick={() => toggleSection('delivery')}
                                    className="w-full py-4 flex items-center justify-between group"
                                >
                                    <span className="font-bold uppercase tracking-wide flex items-center gap-3">
                                        <div className="w-2 h-2 bg-black rounded-full group-hover:bg-brand-yellow transition-colors"></div>
                                        {t('deliveryPolicy')}
                                    </span>
                                    {openSection === 'delivery' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openSection === 'delivery' ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
                                    <div className="space-y-3 text-sm text-gray-600">
                                        <div className="flex items-center gap-3">
                                            <Truck className="w-5 h-5 text-brand-black" />
                                            <span>Fast delivery to all 58 Wilayas (1-3 days).</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck className="w-5 h-5 text-brand-black" />
                                            <span>Payment on delivery (Cash on Delivery).</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* RELATED PRODUCTS SECTION */}
                {relatedProducts.length > 0 && (
                    <div className="mt-20 md:mt-32 border-t-4 border-black pt-12">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">
                                You May Also Like
                            </h2>
                            <Link to="/" className="hidden md:flex items-center gap-2 font-bold uppercase text-sm hover:text-brand-yellow transition-colors">
                                View All <ArrowIcon className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Scrollable Container on Mobile, Grid on Desktop */}
                        <div className="relative">
                            <div className="flex overflow-x-auto pb-8 -mx-4 px-4 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible md:p-0 hide-scrollbar snap-x snap-mandatory">
                                {relatedProducts.map((related) => (
                                    <Link
                                        to={`/product/${related.id}`}
                                        key={related.id}
                                        className="min-w-[260px] md:min-w-0 snap-start flex-shrink-0 group block bg-white mr-4 md:mr-0"
                                    >
                                        <div className="relative aspect-[3/4] bg-gray-100 mb-4 overflow-hidden border border-gray-100 transition-colors">
                                            <img
                                                src={related.image || null}
                                                alt={language === 'ar' ? related.nameAr : related.nameEn}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            {related.originalPrice && related.originalPrice > related.price && (
                                                <div className="absolute top-2 right-2 bg-brand-yellow text-black text-xs font-black px-2 py-1 uppercase">
                                                    {t('sale')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="font-bold uppercase text-sm md:text-base leading-tight truncate group-hover:text-brand-yellow transition-colors">
                                                {language === 'ar' ? related.nameAr : related.nameEn}
                                            </h3>
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-base md:text-lg text-black">{related.price} {t('price')}</span>
                                                {related.originalPrice && related.originalPrice > related.price && (
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {related.originalPrice}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            {/* Fade effect for scroll on mobile */}
                            <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden"></div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ products, onAddToCart }) => {
    const { id } = useParams();
    const navigate = useNavigate();

    const product = useMemo(() => products.find(p => p.id === Number(id)), [id, products]);

    const relatedProducts = useMemo(() => {
        if (!product) return [];
        return products
            .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
            .slice(0, 4);
    }, [product, products]);

    useEffect(() => {
        if (products.length > 0 && !product) {
            navigate('/');
        }
    }, [product, products.length, navigate]);

    if (!product) return null;

    return <ProductView key={product.id} product={product} relatedProducts={relatedProducts} onAddToCart={onAddToCart} />;
};

export default ProductDetails;
