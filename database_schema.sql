-- MASTER SQL SCRIPT TO RECREATE DATABASE TABLES
-- This script should be run in the Supabase SQL Editor.

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    image_url TEXT,
    image_public_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    images_urls TEXT[] DEFAULT '{}',
    images_public_ids TEXT[] DEFAULT '{}',
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for featured products performance
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- 3. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    size TEXT,
    color TEXT,
    quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0,
    sku TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create wilayas table
CREATE TABLE IF NOT EXISTS wilayas (
    id BIGSERIAL PRIMARY KEY,
    code TEXT,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    delivery_price_home NUMERIC DEFAULT 0,
    delivery_price_desk NUMERIC DEFAULT 0,
    active BOOLEAN DEFAULT TRUE
);

-- 5. Create baladiyas table
CREATE TABLE IF NOT EXISTS baladiyas (
    id BIGSERIAL PRIMARY KEY,
    wilaya_id BIGINT REFERENCES wilayas(id) ON DELETE CASCADE,
    name_ar TEXT NOT NULL,
    name_en TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- 6. Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    wilaya_id BIGINT REFERENCES wilayas(id) ON DELETE SET NULL,
    baladiya_id BIGINT REFERENCES baladiyas(id) ON DELETE SET NULL,
    address TEXT,
    instagram_handle TEXT,
    delivery_method TEXT CHECK (delivery_method IN ('home', 'stopdesk')),
    shipping_fee NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    stock_deduction_type TEXT DEFAULT 'normal' CHECK (stock_deduction_type IN ('normal', 'reserved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    variant_id BIGINT REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price_at_purchase NUMERIC NOT NULL
);

-- 8. Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    site_name TEXT DEFAULT 'متجر يور تيشرت',
    site_logo TEXT,
    favicon TEXT,
    about_description_ar TEXT,
    about_description_en TEXT,
    phone_number TEXT,
    about_logo TEXT,
    store_location_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Insert Algerian Wilayas data
INSERT INTO wilayas (id, code, name_ar, name_en, delivery_price_home, delivery_price_desk, active) VALUES
(1, '01', 'أدرار', 'Adrar', 1000, 800, true),
(2, '02', 'الشلف', 'Chlef', 600, 400, true),
(3, '03', 'الأغواط', 'Laghouat', 700, 500, true),
(4, '04', 'أم البواقي', 'Oum El Bouaghi', 700, 500, true),
(5, '05', 'باتنة', 'Batna', 600, 400, true),
(6, '06', 'بجاية', 'Béjaïa', 600, 400, true),
(7, '07', 'بسكرة', 'Biskra', 700, 500, true),
(8, '08', 'بشار', 'Béchar', 900, 700, true),
(9, '09', 'البليدة', 'Blida', 500, 300, true),
(10, '10', 'البويرة', 'Bouira', 500, 300, true),
(11, '11', 'تمنراست', 'Tamanrasset', 1200, 1000, true),
(12, '12', 'تبسة', 'Tébessa', 700, 500, true),
(13, '13', 'تلمسان', 'Tlemcen', 700, 500, true),
(14, '14', 'تيارت', 'Tiaret', 600, 400, true),
(15, '15', 'تيزي وزو', 'Tizi Ouzou', 500, 300, true),
(16, '16', 'الجزائر', 'Alger', 400, 200, true),
(17, '17', 'الجلفة', 'Djelfa', 600, 400, true),
(18, '18', 'جيجل', 'Jijel', 600, 400, true),
(19, '19', 'سطيف', 'Sétif', 600, 400, true),
(20, '20', 'سعيدة', 'Saïda', 700, 500, true),
(21, '21', 'سكيكدة', 'Skikda', 600, 400, true),
(22, '22', 'سيدي بلعباس', 'Sidi Bel Abbès', 700, 500, true),
(23, '23', 'عنابة', 'Annaba', 600, 400, true),
(24, '24', 'قالمة', 'Guelma', 600, 400, true),
(25, '25', 'قسنطينة', 'Constantine', 600, 400, true),
(26, '26', 'المدية', 'Médéa', 500, 300, true),
(27, '27', 'مستغانم', 'Mostaganem', 600, 400, true),
(28, '28', 'المسيلة', 'M''Sila', 600, 400, true),
(29, '29', 'معسكر', 'Mascara', 700, 500, true),
(30, '30', 'ورقلة', 'Ouargla', 800, 600, true),
(31, '31', 'وهران', 'Oran', 600, 400, true),
(32, '32', 'البيض', 'El Bayadh', 800, 600, true),
(33, '33', 'إليزي', 'Illizi', 1200, 1000, true),
(34, '34', 'برج بوعريريج', 'Bordj Bou Arréridj', 600, 400, true),
(35, '35', 'بومرداس', 'Boumerdès', 400, 200, true),
(36, '36', 'الطارف', 'El Tarf', 700, 500, true),
(37, '37', 'تندوف', 'Tindouf', 1200, 1000, true),
(38, '38', 'تيسمسيلت', 'Tissemsilt', 600, 400, true),
(39, '39', 'الوادي', 'El Oued', 800, 600, true),
(40, '40', 'خنشلة', 'Khenchela', 700, 500, true),
(41, '41', 'سوق أهراس', 'Souk Ahras', 700, 500, true),
(42, '42', 'تيبازة', 'Tipaza', 400, 200, true),
(43, '43', 'ميلة', 'Mila', 600, 400, true),
(44, '44', 'عين الدفلى', 'Aïn Defla', 500, 300, true),
(45, '45', 'النعامة', 'Naâma', 800, 600, true),
(46, '46', 'عين تموشنت', 'Aïn Témouchent', 700, 500, true),
(47, '47', 'غرداية', 'Ghardaïa', 800, 600, true),
(48, '48', 'غليزان', 'Relizane', 600, 400, true),
(49, '49', 'المغير', 'El M''Ghair', 800, 600, true),
(50, '50', 'المنيعة', 'El Meniaa', 900, 700, true),
(51, '51', 'أولاد جلال', 'Ouled Djellal', 700, 500, true),
(52, '52', 'برج باجي مختار', 'Bordj Badji Mokhtar', 1500, 1300, true),
(53, '53', 'بني عباس', 'Béni Abbès', 900, 700, true),
(54, '54', 'تيميمون', 'Timimoun', 1000, 800, true),
(55, '55', 'تقرت', 'Touggourt', 800, 600, true),
(56, '56', 'جانت', 'Djanet', 1500, 1300, true),
(57, '57', 'إن صالح', 'In Salah', 1200, 1000, true),
(58, '58', 'إن قزام', 'In Guezzam', 1500, 1300, true)
ON CONFLICT (id) DO UPDATE SET
    delivery_price_home = EXCLUDED.delivery_price_home,
    delivery_price_desk = EXCLUDED.delivery_price_desk;

-- Note: You may need to enable Row Level Security (RLS) and set policies
-- or disable RLS for public access depending on your security requirements.
