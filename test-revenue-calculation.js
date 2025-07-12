// Simple test to verify revenue calculation logic
const testInvoice = {
  "id": "2527d6a5-9b64-4d90-bbd4-52852a0d27a0",
  "total": "583.10",
  "status": "paid",
  "createdAt": "2025-07-12T04:30:56.043Z"
};

console.log('Testing revenue calculation:');
console.log('Invoice total:', testInvoice.total);
console.log('Parsed as float:', parseFloat(testInvoice.total));
console.log('Status:', testInvoice.status);
console.log('Is paid?', testInvoice.status === 'paid');

// Test date filtering (invoice is from today, should be included in last 12 months)
const invoiceDate = new Date(testInvoice.createdAt);
const startDate = new Date();
startDate.setMonth(startDate.getMonth() - 12);
console.log('Invoice date:', invoiceDate);
console.log('Start date (12 months ago):', startDate);
console.log('Is in date range?', invoiceDate >= startDate);

// Final result should be: true for paid status AND true for date range = revenue of 583.10
const shouldInclude = testInvoice.status === 'paid' && invoiceDate >= startDate;
const revenue = shouldInclude ? parseFloat(testInvoice.total) : 0;
console.log('Final revenue calculation:', revenue);