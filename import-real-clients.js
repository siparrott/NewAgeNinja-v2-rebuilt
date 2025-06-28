// Script to parse and import all real client data from the provided file
import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function parseClientData(fileContent) {
  const lines = fileContent.split('\n').map(line => line.trim()).filter(line => line);
  const clients = [];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    
    // Skip lines that start with "Kunde seit" as they're just dates
    if (line.startsWith('Kunde seit')) {
      i++;
      continue;
    }
    
    // Look for a name line (contains letters and possibly spaces)
    if (line && !line.includes('@') && !line.match(/^\+?\d/) && !line.startsWith('Kunde seit')) {
      const fullName = line;
      let email = '';
      let phone = '';
      let address = '';
      let createdAt = '2025-06-23 09:00:00';
      
      // Parse the client block
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith('Kunde seit')) {
        const currentLine = lines[j];
        
        if (currentLine.includes('@')) {
          email = currentLine;
        } else if (currentLine.match(/^\+?\d/) || currentLine.match(/^\d/)) {
          if (!phone) phone = currentLine;
        } else if (currentLine && !currentLine.includes('@') && !currentLine.match(/^\+?\d/) && !currentLine.match(/^\d/)) {
          if (!address) address = currentLine;
        }
        j++;
      }
      
      // Skip to "Kunde seit" line to get creation date
      if (j < lines.length && lines[j].startsWith('Kunde seit')) {
        const dateMatch = lines[j].match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
          const [day, month, year] = dateMatch[1].split('/');
          createdAt = `${year}-${month}-${day} 09:00:00`;
        }
        j++;
      }
      
      // Split name into first and last name
      const nameParts = fullName.split(' ');
      let firstName = nameParts[0] || '';
      let lastName = nameParts.slice(1).join(' ') || '';
      
      // Handle special cases like "Wesely Bernadette 10.08.2024"
      if (lastName.includes('.') && lastName.match(/\d/)) {
        lastName = lastName.split(' ')[0] || lastName;
      }
      
      if (firstName && email) {
        clients.push({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          createdAt
        });
      }
      
      i = j;
    } else {
      i++;
    }
  }
  
  return clients;
}

async function importClients() {
  try {
    console.log('Reading client data file...');
    const fileContent = fs.readFileSync('./attached_assets/Pasted-Zuzana-H-fer-zuzana-hoefer-gmx-at-069919225551-Ernst-Melchior-Gasse-2-2-34-Kunde-seit-23-0-1751136404508_1751136404508.txt', 'utf8');
    
    console.log('Parsing client data...');
    const clients = parseClientData(fileContent);
    
    console.log(`Found ${clients.length} clients to import`);
    
    // Show sample of first 5 clients
    console.log('\nFirst 5 clients:');
    clients.slice(0, 5).forEach((client, index) => {
      console.log(`${index + 1}. ${client.firstName} ${client.lastName} - ${client.email}`);
    });
    
    // Clear existing clients
    console.log('\nClearing existing clients...');
    await pool.query('DELETE FROM crm_clients');
    
    // Import all clients
    console.log('Importing clients...');
    let imported = 0;
    
    for (const client of clients) {
      try {
        const insertQuery = `
          INSERT INTO crm_clients (
            first_name, last_name, email, phone, address, city, country, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;
        
        const values = [
          client.firstName,
          client.lastName,
          client.email,
          client.phone,
          client.address,
          'Vienna', // Default city for Austrian clients
          'Austria', // Default country
          'active',
          client.createdAt
        ];
        
        await pool.query(insertQuery, values);
        imported++;
        
        if (imported % 100 === 0) {
          console.log(`Imported ${imported}/${clients.length} clients...`);
        }
        
      } catch (insertError) {
        console.error(`Error importing client ${client.firstName} ${client.lastName}:`, insertError.message);
      }
    }
    
    console.log(`\n✅ Import complete! Successfully imported ${imported} clients`);
    
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

importClients();