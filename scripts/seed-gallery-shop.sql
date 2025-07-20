-- Seed data for Gallery Shop module
-- Insert sample print products for the studio

INSERT INTO print_products (studio_id, sku, name, base_price, variant_json) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'PRINT-A4', 'Fine-art print A4', 29, '{}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'PRINT-A3', 'Fine-art print A3', 45, '{}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'CANVAS-40x60', 'Canvas 40×60 cm', 79, '{}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'CANVAS-50x70', 'Canvas 50×70 cm', 95, '{}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'PRINT-20x30', 'Premium print 20×30 cm', 35, '{}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'FRAME-A4-WOOD', 'Wooden frame A4', 65, '{}'),
  ('550e8400-e29b-41d4-a716-446655440000', 'DIGITAL-PACK-10', 'Digital image pack (10 photos)', 149, '{}')
ON CONFLICT (sku) DO NOTHING;