import nodemailer from 'nodemailer';

async function testEmailDelivery() {
  console.log('=== Testing Email Delivery Configuration ===');
  
  // Test multiple configurations
  const configs = [
    {
      name: 'STARTTLS Port 587',
      config: {
        host: 'smtp.easyname.com',
        port: 587,
        secure: false,
        auth: { user: '30840mail10', pass: 'HoveBN41!' },
        tls: { rejectUnauthorized: false }
      }
    },
    {
      name: 'SSL Port 465',
      config: {
        host: 'smtp.easyname.com', 
        port: 465,
        secure: true,
        auth: { user: '30840mail10', pass: 'HoveBN41!' },
        tls: { rejectUnauthorized: false }
      }
    }
  ];
  
  for (const { name, config } of configs) {
    try {
      console.log(`\n--- Testing ${name} ---`);
      const transporter = nodemailer.createTransport(config);
      await transporter.verify();
      console.log(`✓ ${name}: Connection verified`);
      
      const info = await transporter.sendMail({
        from: 'hallo@newagefotografie.com',
        to: 'siparrott@yahoo.co.uk',
        subject: `Test from ${name} - ${new Date().toISOString()}`,
        text: `This is a delivery test using ${name}`,
        headers: {
          'Return-Path': 'hallo@newagefotografie.com',
          'Reply-To': 'hallo@newagefotografie.com'
        }
      });
      
      console.log(`✓ ${name}: Email sent - ID: ${info.messageId}`);
      console.log(`✓ ${name}: Response: ${info.response}`);
      
    } catch (error) {
      console.log(`✗ ${name}: Failed - ${error.message}`);
    }
  }
}

testEmailDelivery().catch(console.error);