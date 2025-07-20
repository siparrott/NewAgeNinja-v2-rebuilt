-- Voucher Products Table
CREATE TABLE voucher_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    validity_months INTEGER DEFAULT 12,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Voucher Sales Table
CREATE TABLE voucher_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID NOT NULL,
    voucher_product_id UUID NOT NULL REFERENCES voucher_products(id),
    client_id UUID REFERENCES crm_clients(id),
    buyer_name VARCHAR(255),
    buyer_email VARCHAR(255),
    voucher_code VARCHAR(50) UNIQUE,
    purchase_date TIMESTAMP DEFAULT NOW(),
    expiry_date TIMESTAMP,
    amount_paid DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_voucher_products_studio_id ON voucher_products(studio_id);
CREATE INDEX idx_voucher_sales_studio_id ON voucher_sales(studio_id);
CREATE INDEX idx_voucher_sales_voucher_code ON voucher_sales(voucher_code);
CREATE INDEX idx_voucher_sales_client_id ON voucher_sales(client_id);

-- Insert sample voucher products
INSERT INTO voucher_products (studio_id, name, description, price, validity_months) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Gold Gift Card', 'Premium photography session package', 200.00, 12),
('550e8400-e29b-41d4-a716-446655440001', 'Silver Gift Card', 'Standard photography session package', 150.00, 12),
('550e8400-e29b-41d4-a716-446655440001', 'Bronze Gift Card', 'Basic photography session package', 100.00, 6);