-- Q10 değeri ve 20°C'deki solunum oranı sütunlarını ekle
ALTER TABLE public.product_thermal_properties 
ADD COLUMN IF NOT EXISTS q10_value NUMERIC(3, 2) DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS respiration_rate_20c NUMERIC(6, 2) DEFAULT 0;

-- Mevcut respiration_rate değerlerini respiration_rate_20c'ye kopyala
UPDATE public.product_thermal_properties 
SET respiration_rate_20c = respiration_rate 
WHERE respiration_rate IS NOT NULL;

-- Ürün kategorilerine göre Q10 değerlerini güncelle
UPDATE public.product_thermal_properties 
SET q10_value = CASE
    -- Meyveler genellikle 2.0-3.0 arasında
    WHEN category = 'Meyveler' AND product_name IN ('Elma', 'Armut', 'Kiraz') THEN 2.5
    WHEN category = 'Meyveler' AND product_name IN ('Muz', 'Portakal', 'Limon') THEN 3.0
    WHEN category = 'Meyveler' THEN 2.3
    
    -- Sebzeler genellikle 2.0-2.5 arasında
    WHEN category = 'Sebzeler' AND product_name IN ('Domates', 'Biber', 'Salatalık') THEN 2.5
    WHEN category = 'Sebzeler' AND product_name IN ('Patates', 'Soğan', 'Havuç') THEN 2.0
    WHEN category = 'Sebzeler' THEN 2.2
    
    -- Çiçekler yüksek Q10'a sahip
    WHEN category = 'Çiçekler' THEN 3.5
    
    -- Diğer kategoriler için varsayılan
    ELSE 2.0
END
WHERE category IN ('Meyveler', 'Sebzeler', 'Çiçekler');

-- Yorum ekle
COMMENT ON COLUMN public.product_thermal_properties.q10_value IS 'Solunum oranının sıcaklık katsayısı (10°C artışta solunum oranının kaç kat arttığı)';
COMMENT ON COLUMN public.product_thermal_properties.respiration_rate_20c IS '20°C''deki solunum oranı (mg CO2/kg·h)';