-- إضافة حقل المخزون المقيد ومثل خصم الطلب
-- شغّل هذا الملف في Supabase SQL Editor

-- 1. إضافة reserved_quantity لجدول product_variants (المخزون المشتري المقيد)
ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS reserved_quantity integer DEFAULT 0;

-- 2. إضافة stock_deduction_type لجدول orders (عادي = خصم من المخزون، قيد = مخزون مقيد)
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS stock_deduction_type text DEFAULT 'normal' 
CHECK (stock_deduction_type IN ('normal', 'reserved'));
