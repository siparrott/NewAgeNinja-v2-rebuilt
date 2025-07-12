import XLSX from 'xlsx';
import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function importRemainingClients() {
  try {
    console.log('Importing remaining clients with more flexible requirements...');
    
    // Read the Excel file
    const workbook = XLSX.readFile('./attached_assets/new data clients_1752319132946.xls');
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Total records in Excel: ${jsonData.length}`);
    
    // Get already imported emails to avoid duplicates
    const { rows: existingClients } = await pool.query('SELECT email FROM crm_clients WHERE email IS NOT NULL');
    const existingEmails = new Set(existingClients.map(c => c.email.toLowerCase()));
    
    console.log(`Already imported: ${existingEmails.size} clients`);
    
    let imported = 0;
    let skipped = 0;
    let duplicates = 0;
    
    for (const row of jsonData) {
      try {
        let firstName = '';
        let lastName = '';
        let email = '';
        let phone = '';
        let address = '';
        let city = '';
        let postalCode = '';
        
        // Extract data using exact column names from Excel
        Object.keys(row).forEach(key => {
          const value = row[key] ? String(row[key]).trim() : '';
          if (!value) return;
          
          switch (key) {
            case 'First Name':
              firstName = value;
              break;
            case 'Last Name':
              lastName = value;
              break;
            case 'E-Mail Address':
              // Take first email if multiple
              email = value.split(';')[0].trim();
              break;
            case 'Phone (Main)':
              phone = value;
              break;
            case 'City':
              city = value;
              break;
            case 'Postal Code':
              postalCode = value;
              break;
          }
        });
        
        // Create address from city and postal code if available
        if (city || postalCode) {
          address = [postalCode, city].filter(Boolean).join(' ');
        }
        
        // More flexible validation:
        // 1. Must have at least a last name (many companies use last name field)
        // 2. Must have a valid email address
        if (!lastName || !email || !email.includes('@')) {
          skipped++;
          continue;
        }
        
        // Check for duplicates
        if (existingEmails.has(email.toLowerCase())) {
          duplicates++;
          continue;
        }
        
        // If no first name, check if last name looks like a company name
        if (!firstName) {
          // Use last name as first name for companies/single names
          firstName = lastName;
          lastName = '';
        }
        
        // Insert into database
        const insertQuery = `
          INSERT INTO crm_clients (
            first_name, last_name, email, phone, address, city, zip, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        const values = [
          firstName,
          lastName,
          email,
          phone || null,
          address || null,
          city || null,
          postalCode || null,
          'active',
          new Date()
        ];
        
        await pool.query(insertQuery, values);
        existingEmails.add(email.toLowerCase()); // Track to avoid duplicates in this session
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`Imported ${imported} additional clients...`);
        }
        
      } catch (insertError) {
        if (insertError.message.includes('duplicate') || insertError.message.includes('unique')) {
          duplicates++;
        } else {
          console.error(`Error importing client:`, insertError.message);
          skipped++;
        }
      }
    }
    
    console.log(`\n✅ Import complete!`);
    console.log(`Newly imported: ${imported} clients`);
    console.log(`Skipped (missing data): ${skipped}`);
    console.log(`Duplicates avoided: ${duplicates}`);
    
    // Verify the total count
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM crm_clients');
    console.log(`Total clients in database: ${rows[0].count}`);
    
    // Show some sample newly imported clients
    const { rows: sampleClients } = await pool.query(`
      SELECT first_name, last_name, email, city 
      FROM crm_clients 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    console.log('\nRecently imported clients:');
    sampleClients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.first_name} ${client.last_name} - ${client.email} (${client.city || 'No city'})`);
    });
    
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

importRemainingClients();