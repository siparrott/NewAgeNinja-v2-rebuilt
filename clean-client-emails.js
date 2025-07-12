import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanEmailAddresses() {
  try {
    console.log('Cleaning up email addresses...');
    
    // Find clients with multiple emails (containing semicolons)
    const { rows: clientsWithMultipleEmails } = await pool.query(`
      SELECT id, first_name, last_name, email 
      FROM crm_clients 
      WHERE email LIKE '%;%'
      LIMIT 20
    `);
    
    console.log(`Found ${clientsWithMultipleEmails.length} clients with multiple emails to clean`);
    
    let cleaned = 0;
    
    for (const client of clientsWithMultipleEmails) {
      try {
        // Take the first valid email address
        const emails = client.email.split(';').map(e => e.trim()).filter(e => e.includes('@'));
        const primaryEmail = emails[0];
        
        if (primaryEmail && primaryEmail !== client.email) {
          await pool.query(`
            UPDATE crm_clients 
            SET email = $1 
            WHERE id = $2
          `, [primaryEmail, client.id]);
          
          console.log(`Cleaned: ${client.first_name} ${client.last_name} - ${primaryEmail}`);
          cleaned++;
        }
      } catch (error) {
        console.error(`Error cleaning email for ${client.first_name} ${client.last_name}:`, error.message);
      }
    }
    
    console.log(`\n✅ Cleaned ${cleaned} email addresses`);
    
    // Get final count
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM crm_clients');
    console.log(`Total clients in database: ${rows[0].count}`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
  } finally {
    await pool.end();
  }
}

cleanEmailAddresses();