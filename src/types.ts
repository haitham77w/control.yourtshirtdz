export interface Category {
  id: number;
  name_ar: string;
  name_en: string;
  image_url: string;
  created_at: string;
}

export interface Product {
  id: number;
  category_id: number | null;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  original_price: number | null;
  image_url?: string;
  images_urls: string[];
  images_public_ids: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: number;
  product_id: number;
  size: string;
  color: string;
  quantity: number;  // المخزون - يُخصم منه عند تأكيد الطلبية
  reserved_quantity?: number;
}

export interface Wilaya {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
  delivery_price_home: number;
  delivery_price_desk: number;
  active: boolean;
}

export interface Baladiya {
  id: number;
  wilaya_id: number;
  name_ar: string;
  name_en: string | null;
  active: boolean;
}

export interface Order {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  wilaya_id: number;
  baladiya_id: number;
  address: string;
  instagram_handle: string | null;
  delivery_method: 'home' | 'stopdesk';
  shipping_fee: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  stock_deduction_type?: 'normal' | 'reserved';
  created_at: string;
  updated_at: string;
  wilaya?: Wilaya;
  baladiya?: Baladiya;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  price_at_purchase: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface FeaturedProduct {
  id: number;
  category_id: number | null;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  image_url: string | null;
  price: number;
  original_price: number | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants?: FeaturedProductVariant[];
}

export interface FeaturedProductVariant {
  id: number;
  featured_product_id: number;
  size: string;
  color: string;
  quantity: number;
  sku: string | null;
  created_at: string;
}

export interface Settings {
  id: number;
  site_name: string;
  site_logo: string | null;
  favicon: string | null;
  about_description_ar: string | null;
  about_description_en: string | null;
  phone_number: string | null;
  about_logo: string | null;
  store_location_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  updated_at: string;
}
