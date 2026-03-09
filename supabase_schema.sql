-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.product_variants CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.baladiyas CASCADE;
DROP TABLE IF EXISTS public.wilayas CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 0. Create table for Site Settings
CREATE TABLE public.settings (
    id SERIAL PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL DEFAULT 'YourTshirtDZ',
    site_logo TEXT,
    favicon TEXT,
    about_description_ar TEXT,
    about_description_en TEXT,
    phone_number VARCHAR(50),
    about_logo TEXT,
    store_location_url TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Create table for Wilayas
CREATE TABLE public.wilayas (
    id SERIAL PRIMARY KEY,
    code VARCHAR(5) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    delivery_price_home DECIMAL(10, 2) NOT NULL DEFAULT 0,
    delivery_price_desk DECIMAL(10, 2) NOT NULL DEFAULT 0,
    active BOOLEAN DEFAULT true
);

-- 2. Create table for Baladiyas
CREATE TABLE public.baladiyas (
    id SERIAL PRIMARY KEY,
    wilaya_id INTEGER REFERENCES public.wilayas(id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    active BOOLEAN DEFAULT true
);

-- 3. Create table for Categories (NEW)
CREATE TABLE public.categories (
    id SERIAL PRIMARY KEY,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create table for Products (Modified to link with Categories)
CREATE TABLE public.products (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    description_ar TEXT,
    description_en TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create table for Smart Variants (Size/Color/Stock)
CREATE TABLE public.product_variants (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES public.products(id) ON DELETE CASCADE,
    size VARCHAR(50) NOT NULL,
    color VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    sku VARCHAR(100),
    UNIQUE(product_id, size, color)
);

-- 6. Create table for Orders
CREATE TABLE public.orders (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    wilaya_id INTEGER REFERENCES public.wilayas(id),
    baladiya_id INTEGER REFERENCES public.baladiyas(id),
    custom_baladiya VARCHAR(255),
    address TEXT,
    instagram_handle VARCHAR(100),
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('home', 'stopdesk')),
    shipping_fee DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', 
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create table for Order Items
CREATE TABLE public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES public.products(id),
    variant_id INTEGER REFERENCES public.product_variants(id),
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- Indexes
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_baladiyas_wilaya ON public.baladiyas(wilaya_id);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baladiyas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read variants" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "Public read locations" ON public.wilayas FOR SELECT USING (true);
CREATE POLICY "Public read baladiyas" ON public.baladiyas FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- =============================================
-- DATA POPULATION
-- =============================================

-- 0. Insert Settings
INSERT INTO public.settings (id, site_name, site_logo, favicon, about_description_ar, about_description_en, phone_number, about_logo, store_location_url, instagram_url, facebook_url) VALUES
(1, 'YourTshirtDZ', 'https://dua3y4qmf.cloudinary.com/image/upload/v1740065401/PinDown.io_conrable_1771477496_p3z7m5.jpg', 'https://dua3y4qmf.cloudinary.com/image/upload/v1740065401/PinDown.io_conrable_1771477496_p3z7m5.jpg', 'انطلق متجر YourTshirtDZ في عام 2026 بمهمة بسيطة: تقديم ملابس ستريت وير أصلية وعالية الجودة للشباب الجزائري. نحن نؤمن بالتصاميم الجريئة، والأقمشة الفاخرة، والنهج الذي يضع المجتمع أولاً. من شوارع الجزائر العاصمة إلى كل ولاية، نحن نمثل الموجة الجديدة للموضة الجزائرية.', 'YourTshirtDZ started in 2026 with a simple mission: to bring authentic, high-quality streetwear to the Algerian youth. We believe in bold designs, premium fabrics, and a community-first approach. From the streets of Algiers to every Wilaya, we represent the new wave of Algerian fashion.', '0550 00 00 00', 'https://dua3y4qmf.cloudinary.com/image/upload/v1740065401/PinDown.io_conrable_1771477496_p3z7m5.jpg', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d102313.25140660686!2d3.00331455!3d36.733818!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x128fb2164279044b%3A0xb0064248f691eeeb!2sAlgiers!5e0!3m2!1sen!2sdz!4v1708460000000!5m2!1sen!2sdz', 'https://instagram.com/yourtshirtdz', 'https://facebook.com/yourtshirtdz');

-- 1. Insert Categories
INSERT INTO public.categories (id, name_ar, name_en, image_url) VALUES
(1, 'تيشيرت', 'T-Shirts', 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=800'),
(2, 'هوديز', 'Hoodies', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800'),
(3, 'سراويل', 'Pants', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&q=80&w=800'),
(4, 'قبعات', 'Headwear', 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800');

-- Reset category sequence
SELECT setval('categories_id_seq', (SELECT MAX(id) FROM public.categories));

-- 2. Insert Products (Linked to Categories)
INSERT INTO public.products (id, category_id, name_ar, name_en, description_ar, description_en, price, original_price, image_url) VALUES
(1, 1, 'تيشيرت 2026 الأساسي', '2026 Core Tee', 'قطن 100% عالي الجودة مع طباعة مميزة.', 'Premium 100% Cotton heavy weight tee with puff print.', 2500, 3000, 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800'),
(2, 2, 'هودي أسود واسع', 'Oversized Black Hoodie', 'هودي بقصة واسعة مريح جداً.', 'Ultra comfortable oversized fit hoodie suitable for all seasons.', 4500, 5500, 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?auto=format&fit=crop&q=80&w=800'),
(3, 3, 'سروال كارجو تكتيكي', 'Tactical Cargo Pants', 'سروال متعدد الجيوب بتصميم عصري.', 'Multi-pocket tactical design perfect for street styling.', 3800, 4200, 'https://images.unsplash.com/photo-1517445312582-da003544787f?auto=format&fit=crop&q=80&w=800'),
(4, 1, 'تيشيرت غرافيك أصفر', 'Yellow Graphic Tee', 'تصميم فني حصري باللون الأصفر.', 'Exclusive graphic design in brand yellow colorway.', 2800, NULL, 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&q=80&w=800'),
(5, 4, 'قبعة بيسبول سوداء', 'Classic Black Cap', 'قبعة كلاسيكية بشعار مطرز.', 'Classic baseball cap with embroidered 2026 logo.', 1500, 1800, 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=800');

-- Reset product sequence
SELECT setval('products_id_seq', (SELECT MAX(id) FROM public.products));

-- 3. Insert Variants
INSERT INTO public.product_variants (product_id, size, color, quantity) VALUES
(1, 'M', 'Black', 10), (1, 'L', 'Black', 15), (1, 'XL', 'Black', 5),
(1, 'M', 'White', 8), (1, 'L', 'White', 12),
(2, 'L', 'Black', 20), (2, 'XL', 'Black', 20),
(3, '32', 'Khaki', 10), (3, '34', 'Khaki', 10),
(4, 'L', 'Yellow', 15),
(5, 'OS', 'Black', 50);

-- Insert Wilayas (Sample of first 5 for brevity in this update, assuming previous full insert handles the rest or you run the previous script fully)
-- Note: In a real migration, we wouldn't drop the wilayas table if it was full. 
-- Since I dropped it above, I will re-insert the full list to ensure the app works.
INSERT INTO public.wilayas (id, code, name_ar, name_en, delivery_price_home, delivery_price_desk) VALUES
(1, '01', 'أدرار', 'Adrar', 1200, 800),
(2, '02', 'الشلف', 'Chlef', 700, 400),
(3, '03', 'الأغواط', 'Laghouat', 800, 500),
(4, '04', 'أم البواقي', 'Oum El Bouaghi', 700, 400),
(5, '05', 'باتنة', 'Batna', 700, 400),
(6, '06', 'بجاية', 'Béjaïa', 700, 400),
(7, '07', 'بسكرة', 'Biskra', 800, 500),
(8, '08', 'بشار', 'Béchar', 1000, 700),
(9, '09', 'البليدة', 'Blida', 500, 300),
(10, '10', 'البويرة', 'Bouira', 600, 350),
(11, '11', 'تمنراست', 'Tamanrasset', 1300, 900),
(12, '12', 'تبسة', 'Tébessa', 700, 400),
(13, '13', 'تلمسان', 'Tlemcen', 700, 400),
(14, '14', 'تيارت', 'Tiaret', 700, 400),
(15, '15', 'تيزي وزو', 'Tizi Ouzou', 600, 350),
(16, '16', 'الجزائر', 'Alger', 400, 250),
(17, '17', 'الجلفة', 'Djelfa', 800, 500),
(18, '18', 'جيجل', 'Jijel', 700, 400),
(19, '19', 'سطيف', 'Sétif', 600, 350),
(20, '20', 'سعيدة', 'Saïda', 700, 400),
(21, '21', 'سكيكدة', 'Skikda', 700, 400),
(22, '22', 'سيدي بلعباس', 'Sidi Bel Abbès', 700, 400),
(23, '23', 'عنابة', 'Annaba', 600, 350),
(24, '24', 'قالمة', 'Guelma', 700, 400),
(25, '25', 'قسنطينة', 'Constantine', 600, 350),
(26, '26', 'المدية', 'Médéa', 600, 350),
(27, '27', 'مستغانم', 'Mostaganem', 700, 400),
(28, '28', 'المسيلة', 'M''Sila', 700, 400),
(29, '29', 'معسكر', 'Mascara', 700, 400),
(30, '30', 'ورقلة', 'Ouargla', 1000, 700),
(31, '31', 'وهران', 'Oran', 600, 350),
(32, '32', 'البيض', 'El Bayadh', 800, 500),
(33, '33', 'إليزي', 'Illizi', 1300, 900),
(34, '34', 'برج بوعريريج', 'Bordj Bou Arréridj', 600, 350),
(35, '35', 'بومرداس', 'Boumerdès', 500, 300),
(36, '36', 'الطارف', 'El Tarf', 700, 400),
(37, '37', 'تندوف', 'Tindouf', 1300, 900),
(38, '38', 'تيسمسيلت', 'Tissemsilt', 700, 400),
(39, '39', 'الوادي', 'El Oued', 1000, 700),
(40, '40', 'خنشلة', 'Khenchela', 700, 400),
(41, '41', 'سوق أهراس', 'Souk Ahras', 700, 400),
(42, '42', 'تيبازة', 'Tipaza', 500, 300),
(43, '43', 'ميلة', 'Mila', 700, 400),
(44, '44', 'عين الدفلى', 'Aïn Defla', 600, 350),
(45, '45', 'النعامة', 'Naâma', 800, 500),
(46, '46', 'عين تموشنت', 'Aïn Témouchent', 700, 400),
(47, '47', 'غرداية', 'Ghardaïa', 900, 600),
(48, '48', 'غليزان', 'Relizane', 700, 400),
(49, '49', 'تيميمون', 'Timimoun', 1200, 800),
(50, '50', 'برج باجي مختار', 'Bordj Badji Mokhtar', 1300, 900),
(51, '51', 'أولاد جلال', 'Ouled Djellal', 800, 500),
(52, '52', 'بني عباس', 'Béni Abbès', 1200, 800),
(53, '53', 'عين صالح', 'In Salah', 1300, 900),
(54, '54', 'عين قزام', 'In Guezzam', 1300, 900),
(55, '55', 'تقرت', 'Touggourt', 1000, 700),
(56, '56', 'جانت', 'Djanet', 1300, 900),
(57, '57', 'المغير', 'El M''Ghair', 800, 500),
(58, '58', 'المنيعة', 'El Meniaa', 900, 600);
SELECT setval('wilayas_id_seq', (SELECT MAX(id) FROM public.wilayas));
