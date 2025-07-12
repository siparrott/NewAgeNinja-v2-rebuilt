import XLSX from 'xlsx';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function analyzeRemainingClients() {
  try {
    console.log('Analyzing remaining client data...');
    
    // Read the Excel file
    const workbook = XLSX.readFile('./attached_assets/new data clients_1752319132946.xls');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Total records in Excel: ${jsonData.length}`);
    
    // Analyze the data structure
    const allColumns = new Set();
    jsonData.forEach(row => {
      Object.keys(row).forEach(key => allColumns.add(key));
    });
    
    console.log('\nAll available columns:', Array.from(allColumns));
    
    // Analyze first 10 records with all fields
    console.log('\nFirst 10 complete records:');
    jsonData.slice(0, 10).forEach((row, index) => {
      console.log(`\n${index + 1}.`, JSON.stringify(row, null, 2));
    });
    
    // Count records by data completeness
    let hasFirstName = 0;
    let hasLastName = 0;
    let hasEmail = 0;
    let hasPhone = 0;
    let hasAnyName = 0;
    let hasValidEmail = 0;
    let companyRecords = 0;
    
    const skippedRecords = [];
    
    jsonData.forEach((row, index) => {
      let firstName = '';
      let lastName = '';
      let email = '';
      let phone = '';
      let company = '';
      
      // Extract data using all possible column names
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        const value = row[key] ? String(row[key]).trim() : '';
        
        if (!value) return;
        
        // First Name
        if (lowerKey.includes('first') || lowerKey === 'vorname' || lowerKey === 'firstname') {
          firstName = value;
        }
        // Last Name  
        else if (lowerKey.includes('last') || lowerKey === 'nachname' || lowerKey === 'lastname' || 
                 lowerKey === 'surname' || lowerKey === 'last name') {
          lastName = value;
        }
        // Email
        else if (lowerKey.includes('email') || lowerKey.includes('e-mail')) {
          email = value;
        }
        // Phone
        else if (lowerKey.includes('phone') || lowerKey.includes('telefon') || 
                 lowerKey.includes('tel') || lowerKey.includes('handy')) {
          phone = value;
        }
        // Company
        else if (lowerKey.includes('company') || lowerKey.includes('firma') || 
                 lowerKey.includes('unternehmen')) {
          company = value;
        }
      });
      
      // Count statistics
      if (firstName) hasFirstName++;
      if (lastName) hasLastName++;
      if (email) hasEmail++;
      if (phone) hasPhone++;
      if (firstName || lastName) hasAnyName++;
      if (email && email.includes('@')) hasValidEmail++;
      if (company && !firstName && !lastName) companyRecords++;
      
      // Track skipped records
      if (!firstName && !lastName) {
        skippedRecords.push({
          index: index + 1,
          data: row,
          reason: 'No first or last name'
        });
      } else if (!email || !email.includes('@')) {
        skippedRecords.push({
          index: index + 1,
          data: row,
          reason: 'No valid email'
        });
      }
    });
    
    console.log('\n=== DATA ANALYSIS ===');
    console.log(`Total records: ${jsonData.length}`);
    console.log(`Records with first name: ${hasFirstName}`);
    console.log(`Records with last name: ${hasLastName}`);
    console.log(`Records with any name: ${hasAnyName}`);
    console.log(`Records with email: ${hasEmail}`);
    console.log(`Records with valid email: ${hasValidEmail}`);
    console.log(`Records with phone: ${hasPhone}`);
    console.log(`Company-only records: ${companyRecords}`);
    console.log(`Currently imported: 1106`);
    console.log(`Potentially importable: ${hasValidEmail}`);
    
    console.log('\n=== SAMPLE SKIPPED RECORDS ===');
    skippedRecords.slice(0, 20).forEach(record => {
      console.log(`Row ${record.index}: ${record.reason}`);
      console.log(JSON.stringify(record.data, null, 2));
      console.log('---');
    });
    
  } catch (error) {
    console.error('Analysis failed:', error);
  } finally {
    await pool.end();
  }
}

analyzeRemainingClients();