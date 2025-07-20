-- Gallery Shop Module Migration
-- shop catalog per studio
CREATE TABLE IF NOT EXISTS print_products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id    UUID REFERENCES studios(id),
  sku          TEXT UNIQUE,
  name         TEXT,
  base_price   NUMERIC,
  unit         TEXT DEFAULT 'EUR',
  variant_json JSONB,           -- sizes, finishes, etc.
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- orders per gallery
CREATE TABLE IF NOT EXISTS gallery_orders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id     UUID REFERENCES studios(id),
  gallery_id    UUID REFERENCES client_galleries(id),
  client_id     UUID REFERENCES crm_clients(id),
  stripe_session_id TEXT,
  status        TEXT DEFAULT 'pending',  -- pending | paid | fulfilled
  total         NUMERIC,
  currency      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gallery_order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES gallery_orders(id),
  product_id  UUID REFERENCES print_products(id),
  variant     JSONB,
  qty         INT,
  unit_price  NUMERIC,
  line_total  NUMERIC
);

-- RLS (service-role bypass)
ALTER TABLE print_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio prints" ON print_products
  FOR SELECT USING (studio_id = current_setting('request.jwt.claims',TRUE)::json->>'studio_id');

ALTER TABLE gallery_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio orders" ON gallery_orders
  FOR SELECT USING (studio_id = current_setting('request.jwt.claims',TRUE)::json->>'studio_id');

ALTER TABLE gallery_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "studio order items" ON gallery_order_items
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM gallery_orders go 
    WHERE go.id = order_id 
    AND go.studio_id = current_setting('request.jwt.claims',TRUE)::json->>'studio_id'
  ));