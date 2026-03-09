
export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  quantity: number; // Stock quantity for this specific combo
  sku?: string;
}

export interface Category {
  id: number;
  nameEn: string;
  nameAr: string;
  image: string;
}

export interface Product {
  id: number;
  categoryId?: number; // Optional to handle old data if any, but ideally required
  nameEn: string;
  nameAr: string;
  price: number; // Current selling price (Sale Price)
  originalPrice?: number; // Original price (if discount exists)
  image: string; // Keep for backward compatibility, will be images_urls[0]
  imagesUrls?: string[];
  imagesPublicIds?: string[];
  descriptionEn: string;
  descriptionAr: string;
  variants: ProductVariant[];
  category: string; // Keeping for display fallback, derived from categoryId in new logic
  isFeatured?: boolean; // Flag from products.is_featured to show in featured/best section
}

export interface CartItem extends Product {
  selectedVariantId: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  cartId: string;
}

export interface WilayaData {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string; // Transliterated or kept same if not available
  deliveryPriceHome: number;
  deliveryPriceDesk: number; // Stop Desk
}

export interface BaladiyaData {
  id: number;
  wilayaId: number;
  nameAr: string;
  nameEn?: string;
}

export interface SiteSettings {
  id: number;
  siteName: string;
  siteLogo: string;
  favicon: string;
  aboutDescriptionAr: string;
  aboutDescriptionEn: string;
  phoneNumber: string;
  aboutLogo: string;
  storeLocationUrl: string; // Google Maps Embed URL
  instagramUrl: string;
  facebookUrl: string;
}

export interface OrderFormState {
  firstName: string;
  lastName: string;
  phone: string;
  wilayaId: number;
  baladiya: string;
  instagram?: string;
  deliveryMethod: 'home' | 'stopdesk';
  address?: string;
}
