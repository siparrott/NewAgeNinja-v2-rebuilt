import XLSX from 'xlsx';
import fs from 'fs';
import pg from 'pg';
const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importExcelClients() {
  try {
    console.log('Reading Excel file...');
    
    // Read the Excel file
    const workbook = XLSX.readFile('./attached_assets/new data clients_1752319132946.xls');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${jsonData.length} clients in Excel file`);
    console.log('First 3 clients:');
    jsonData.slice(0, 3).forEach((client, index) => {
      console.log(`${index + 1}.`, JSON.stringify(client, null, 2));
    });
    
    // Detect column names
    console.log('\nDetected columns:', Object.keys(jsonData[0] || {}));
    
    let imported = 0;
    let errors = 0;
    
    for (const row of jsonData) {
      try {
        // Map Excel columns to database fields
        let firstName = '';
        let lastName = '';
        let email = '';
        let phone = '';
        let address = '';
        let company = '';
        let clientId = '';
        
        // Try to map common column names
        Object.keys(row).forEach(key => {
          const lowerKey = key.toLowerCase().trim();
          const value = row[key] ? String(row[key]).trim() : '';
          
          if (!value) return;
          
          // First Name mapping
          if (lowerKey.includes('first') && lowerKey.includes('name') || 
              lowerKey === 'vorname' || lowerKey === 'firstname') {
            firstName = value;
          }
          // Last Name mapping
          else if (lowerKey.includes('last') && lowerKey.includes('name') || 
                   lowerKey === 'nachname' || lowerKey === 'lastname' || lowerKey === 'surname') {
            lastName = value;
          }
          // Full Name mapping (split if needed)
          else if (lowerKey === 'name' || lowerKey === 'full name' || lowerKey === 'kunde') {
            if (!firstName && !lastName) {
              const nameParts = value.split(' ');
              if (nameParts.length >= 2) {
                firstName = nameParts[0];
                lastName = nameParts.slice(1).join(' ');
              } else {
                firstName = value;
                lastName = '';
              }
            }
          }
          // Email mapping
          else if (lowerKey.includes('email') || lowerKey.includes('e-mail')) {
            email = value;
          }
          // Phone mapping
          else if (lowerKey.includes('phone') || lowerKey.includes('telefon') || 
                   lowerKey.includes('tel') || lowerKey.includes('handy')) {
            phone = value;
          }
          // Address mapping
          else if (lowerKey.includes('address') || lowerKey.includes('adresse') || 
                   lowerKey.includes('straße') || lowerKey.includes('street')) {
            address = value;
          }
          // Company mapping
          else if (lowerKey.includes('company') || lowerKey.includes('firma') || 
                   lowerKey.includes('unternehmen')) {
            company = value;
          }
          // Client ID mapping
          else if (lowerKey.includes('id') || lowerKey.includes('nummer') || 
                   lowerKey.includes('kundennummer')) {
            clientId = value;
          }
        });
        
        // Validate required fields
        if (!firstName || !email) {
          console.log(`Skipping row - missing firstName (${firstName}) or email (${email})`);
          errors++;
          continue;
        }
        
        // Insert into database
        const insertQuery = `
          INSERT INTO crm_clients (
            first_name, last_name, email, phone, address, company, client_id, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        const values = [
          firstName,
          lastName || '',
          email,
          phone || null,
          address || null,
          company || null,
          clientId || null,
          'active',
          new Date()
        ];
        
        await pool.query(insertQuery, values);
        imported++;
        
        if (imported % 50 === 0) {
          console.log(`Imported ${imported} clients...`);
        }
        
      } catch (insertError) {
        console.error(`Error importing client:`, insertError.message);
        console.error('Row data:', row);
        errors++;
      }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`Successfully imported: ${imported} clients`);
    console.log(`Errors: ${errors}`);
    
    // Verify the import
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM crm_clients');
    console.log(`Total clients in database: ${rows[0].count}`);
    
    // Show sample of imported clients
    const { rows: sampleClients } = await pool.query('SELECT first_name, last_name, email FROM crm_clients LIMIT 10');
    console.log('\nSample imported clients:');
    sampleClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.first_name} ${client.last_name} - ${client.email}`);
    });
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

importExcelClients();