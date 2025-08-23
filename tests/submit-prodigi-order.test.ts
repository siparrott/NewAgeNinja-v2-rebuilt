import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { submitProdigiOrderTool } from "../agent/tools/submit-prodigi-order.js";
import type { AgentCtx } from "../agent/core/ctx.js";

// Mock the database
const mockSql = jest.fn();
jest.mock('@neondatabase/serverless', () => ({
  neon: () => mockSql
}));

// Mock fetch for Prodigi API
const server = setupServer(
  http.post('https://api.sandbox.prodigi.com/v4.0/orders', () => {
    return HttpResponse.json({
      id: 'ord_123',
      status: 'received',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      charges: [],
      shipments: [],
      items: []
    });
  })
);

beforeEach(() => {
  server.listen();
  process.env.PRODIGI_API_KEY = 'test_key_123';
  process.env.PRODIGI_ENDPOINT = 'https://api.sandbox.prodigi.com/v4.0';
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

describe('submit_prodigi_order', () => {
  const mockCtx: AgentCtx = {
    studioId: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'user123',
    chatSessionId: 'session123'
  };

  it('should successfully submit order to Prodigi', async () => {
    const galleryOrderId = 'order-123';
    const clientId = 'client-456';
    const galleryId = 'gallery-789';

    // Mock database responses
    mockSql
      .mockResolvedValueOnce([{
        id: galleryOrderId,
        gallery_id: galleryId,
        client_id: clientId,
        status: 'paid',
        total: 137,
        created_at: new Date()
      }])
      .mockResolvedValueOnce([{
        id: 'item-1',
        order_id: galleryOrderId,
        product_id: 'prod-1',
        qty: 2,
        unit_price: 29,
        line_total: 58,
        variant: {},
        product_name: 'Fine-art print A4',
        product_sku: 'PRINT-A4'
      }, {
        id: 'item-2', 
        order_id: galleryOrderId,
        product_id: 'prod-2',
        qty: 1,
        unit_price: 79,
        line_total: 79,
        variant: {},
        product_name: 'Canvas 40×60 cm',
        product_sku: 'CANVAS-40x60'
      }])
      .mockResolvedValueOnce([{
        id: clientId,
        first_name: 'Test',
        last_name: 'Client',
        email: 'test@example.com',
        phone: '+43123456789',
        address: 'Test Street 1',
        city: 'Vienna'
      }])
      .mockResolvedValueOnce([]); // Update query

    const result = await submitProdigiOrderTool.handler({
      gallery_id: galleryId,
      client_id: clientId,
      shipping_address: {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '+43123456789',
        line1: 'Test Street 1',
        postal_code: '1010',
        country_code: 'AT',
        city: 'Vienna'
      }
    }, mockCtx);

    expect(result.success).toBe(true);
    expect(result.prodigi_id).toBe('ord_123');
    expect(result.status).toBe('received');
    expect(result.items_submitted).toBe(2);
    expect(mockSql).toHaveBeenCalledTimes(4);
  });

  it('should handle missing gallery order', async () => {
    mockSql.mockResolvedValueOnce([]); // No orders found

    const result = await submitProdigiOrderTool.handler({
      gallery_id: 'gallery-789',
      client_id: 'client-456'
    }, mockCtx);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No paid gallery order found');
  });

  it('should filter out digital items', async () => {
    const galleryOrderId = 'order-123';
    
    mockSql
      .mockResolvedValueOnce([{
        id: galleryOrderId,
        status: 'paid'
      }])
      .mockResolvedValueOnce([{
        id: 'item-1',
        product_sku: 'DIGITAL-PACK-10', // Digital item
        qty: 1
      }])
      .mockResolvedValueOnce([{
        id: 'client-456',
        first_name: 'Test',
        last_name: 'Client',
        email: 'test@example.com'
      }]);

    const result = await submitProdigiOrderTool.handler({
      gallery_id: 'gallery-789',
      client_id: 'client-456'
    }, mockCtx);

    expect(result.success).toBe(false);
    expect(result.error).toContain('No physical items found for printing');
  });

  it('should handle Prodigi API errors', async () => {
    server.use(
      http.post('https://api.sandbox.prodigi.com/v4.0/orders', () => {
        return new HttpResponse(null, { status: 400 });
      })
    );

    mockSql
      .mockResolvedValueOnce([{ id: 'order-123', status: 'paid' }])
      .mockResolvedValueOnce([{
        product_sku: 'PRINT-A4',
        qty: 1,
        product_name: 'Test Print'
      }])
      .mockResolvedValueOnce([{
        first_name: 'Test',
        last_name: 'Client',
        email: 'test@example.com'
      }]);

    const result = await submitProdigiOrderTool.handler({
      gallery_id: 'gallery-789',
      client_id: 'client-456'
    }, mockCtx);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to submit order to Prodigi');
  });
});