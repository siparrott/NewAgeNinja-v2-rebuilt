/**
 * SKU Normalizer - Prevents invoice creation failures from case/spacing mismatches
 */
export function normalizeSku(sku: string): string {
  if (!sku || typeof sku !== 'string') {
    return '';
  }
  
  return sku
    .trim()                          // Remove leading/trailing spaces
    .toUpperCase()                   // Convert to uppercase for consistency
    .replace(/[\u2010-\u2015]/g, '-') // Convert unicode hyphens to ASCII hyphen
    .replace(/\s+/g, '-')            // Replace spaces with hyphens
    .replace(/-+/g, '-')             // Collapse multiple hyphens to single
    .replace(/[^A-Z0-9-]/g, '');     // Remove non-alphanumeric except hyphens
}

/**
 * Validate SKU format
 */
export function isValidSku(sku: string): boolean {
  const normalized = normalizeSku(sku);
  return /^[A-Z0-9]([A-Z0-9-]*[A-Z0-9])?$/.test(normalized) && normalized.length >= 2;
}

/**
 * Common SKU mappings for fallback
 */
export const STANDARD_SKU_MAPPINGS: Record<string, string> = {
  'DIGI10': 'DIGI-10',
  'DIGI_10': 'DIGI-10', 
  'DIGITAL10': 'DIGI-10',
  'CANVAS_A4': 'CANVAS-A4',
  'CANVASA4': 'CANVAS-A4',
  'PRINTS20': 'PRINTS-20',
  'PRINTS_20': 'PRINTS-20'
};

/**
 * Apply common SKU mappings
 */
export function mapCommonSkuVariants(sku: string): string {
  const normalized = normalizeSku(sku);
  return STANDARD_SKU_MAPPINGS[normalized] || normalized;
}