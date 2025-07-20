// agent/integrations/pricing.js - Pricing system for CRM agent
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export async function getPriceBySku(studioId, sku) {
  try {
    console.log(`🔧 Getting price for SKU: ${sku} in studio: ${studioId}`);
    
    // Standard price mapping for common SKUs
    const standardPrices = {
      'DIGI-10': { label: '10x Digital Files', unit_price: 35.00 },
      'DIGI-50': { label: '50x Digital Files', unit_price: 295.00 },
      'CANVAS-A4': { label: 'A4 Canvas Print', unit_price: 75.00 },
      'PRINTS-20': { label: '20x Photo Prints', unit_price: 145.00 },
      'FAMILY-BASIC': { label: 'Family Photo Session', unit_price: 295.00 },
      'NEWBORN-DELUXE': { label: 'Newborn Photography Session', unit_price: 450.00 }
    };

    // Check standard prices first
    if (standardPrices[sku]) {
      console.log(`✅ Found standard price for ${sku}: €${standardPrices[sku].unit_price}`);
      return standardPrices[sku];
    }

    // Try to get from database price list if available
    try {
      const dbResults = await sql`
        SELECT label, unit_price FROM price_list 
        WHERE sku = ${sku} AND studio_id = ${studioId}
      `;
      
      if (dbResults.length > 0) {
        console.log(`✅ Found database price for ${sku}: €${dbResults[0].unit_price}`);
        return {
          label: dbResults[0].label,
          unit_price: parseFloat(dbResults[0].unit_price)
        };
      }
    } catch (dbError) {
      console.log(`⚠️ Database price lookup failed: ${dbError.message}`);
    }

    console.log(`❌ No price found for SKU: ${sku}`);
    return null;

  } catch (error) {
    console.error('❌ getPriceBySku error:', error);
    return null;
  }
}