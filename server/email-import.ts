import { storage } from './storage';

export async function importEmailsFromIMAP(config: any) {
  const imap = (await import('imap')).default;
  const { simpleParser } = await import('mailparser');
  
  return new Promise((resolve, reject) => {
    console.log('Connecting to IMAP server...');
    
    const connection = new imap(config);
    let newEmails = 0;
    let totalEmails = 0;
    let processedEmails = 0;
    
    connection.once('ready', () => {
      console.log('IMAP connection ready');
      
      connection.openBox('INBOX', true, (err, box) => {
        if (err) {
          console.error('Failed to open inbox:', err);
          return reject(err);
        }
        
        console.log(`INBOX opened - ${box.messages.total} total messages`);
        totalEmails = box.messages.total;
        
        if (box.messages.total === 0) {
          connection.end();
          return resolve({ newEmails: 0, totalEmails: 0, processedEmails: 0 });
        }
        
        // Fetch recent emails (last 50)
        const recent = Math.max(1, box.messages.total - 49);
        const fetchRange = `${recent}:${box.messages.total}`;
        
        console.log(`Fetching emails ${fetchRange}`);
        
        const fetch = connection.fetch(fetchRange, {
          bodies: '',
          struct: true,
          markSeen: false
        });
        
        const emailPromises: Promise<void>[] = [];
        
        fetch.on('message', (msg, seqno) => {
          const emailPromise = new Promise<void>((emailResolve) => {
            let buffer = '';
            
            msg.on('body', (stream, info) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              
              stream.once('end', async () => {
                try {
                  const parsed = await simpleParser(buffer);
                  
                  // Check if email already exists (more precise matching)
                  const existingMessages = await storage.getCrmMessages();
                  const fromEmail = parsed.from?.value[0]?.address || parsed.from?.text || 'unknown@unknown.com';
                  const exists = existingMessages.some(m => 
                    m.senderEmail === fromEmail && 
                    m.subject === (parsed.subject || 'No Subject') &&
                    !m.subject.startsWith('[SENT]') // Don't duplicate sent items
                  );
                  
                  if (!exists) {
                    await storage.createCrmMessage({
                      senderName: parsed.from?.text?.split('<')[0]?.trim() || 'Unknown',
                      senderEmail: parsed.from?.value[0]?.address || 'unknown@unknown.com',
                      subject: parsed.subject || 'No Subject',
                      content: parsed.text || parsed.html || 'No content',
                      status: 'unread'
                    });
                    
                    newEmails++;
                    console.log(`Imported new email: ${parsed.subject}`);
                  }
                  
                  processedEmails++;
                  emailResolve();
                } catch (error) {
                  console.error('Error processing email:', error);
                  emailResolve();
                }
              });
            });
            
            msg.once('attributes', (attrs) => {
              // Can process email attributes if needed
            });
          });
          
          emailPromises.push(emailPromise);
        });
        
        fetch.once('error', (err) => {
          console.error('Fetch error:', err);
          reject(err);
        });
        
        fetch.once('end', async () => {
          console.log('Fetch completed, processing emails...');
          
          try {
            await Promise.all(emailPromises);
            connection.end();
            
            console.log(`Email import completed: ${newEmails} new emails, ${processedEmails} processed, ${totalEmails} total`);
            resolve({ newEmails, totalEmails, processedEmails });
          } catch (error) {
            console.error('Error processing emails:', error);
            connection.end();
            reject(error);
          }
        });
      });
    });
    
    connection.once('error', (err) => {
      console.error('IMAP connection error:', err);
      reject(err);
    });
    
    connection.once('end', () => {
      console.log('IMAP connection ended');
    });
    
    connection.connect();
  });
}