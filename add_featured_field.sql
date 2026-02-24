-- إضافة حقل is_featured لجدول products
-- شغّل هذا الملف في Supabase SQL Editor

-- إضافة حقل is_featured للمنتجات
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- إنشاء index للحصول على أداء أفضل للمنتجات المميزة
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

-- تحديث المنتجات الموجودة في featured_products لتكون مميزة
UPDATE products 
SET is_featured = true 
WHERE id IN (
  SELECT product_id FROM order_items 
  WHERE product_id IN (SELECT id FROM featured_products)
);

-- ملاحظة: بعد تشغيل هذا الملف، يمكنك حذف جداول featured_products و featured_product_variants
-- DROP TABLE IF EXISTS featured_product_variants;
-- DROP TABLE IF EXISTS featured_products;
