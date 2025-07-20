import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import supertest from 'supertest';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

interface TestResult {
  feature: string;
  tools: string[];
  tableStatus: string;
  unitTest: string;
  chatTest: string;
  status: '✅' | '⚠️' | '❌';
}

describe('🧪 FULL-STACK QA PASS – TogNinja CRM Agent', () => {
  let devServer: ChildProcess;
  let request: supertest.SuperTest<supertest.Test>;
  const testResults: TestResult[] = [];
  const testStudioId = 'test-studio-qa';
  const testUserId = 'test-user-qa';

  beforeAll(async () => {
    // Start dev server
    console.log('🚀 Starting development server...');
    devServer = spawn('npm', ['run', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    // Wait for server to start
    await new Promise((resolve) => {
      devServer.stdout?.on('data', (data) => {
        if (data.toString().includes('successfully started')) {
          console.log('✅ Development server started');
          resolve(undefined);
        }
      });
      setTimeout(resolve, 10000); // Fallback timeout
    });

    request = supertest('http://localhost:5000');

    // Setup test studio and user
    await sql`
      INSERT INTO studios (id, name, email, phone, address, settings)
      VALUES (${testStudioId}, 'Test Studio', 'test@studio.com', '+1234567890', 'Test Address', '{}')
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      INSERT INTO users (id, email, studio_id, role, first_name, last_name, created_at)
      VALUES (${testUserId}, 'test@user.com', ${testStudioId}, 'admin', 'Test', 'User', NOW())
      ON CONFLICT (id) DO NOTHING
    `;
  }, 30000);

  afterAll(async () => {
    // Cleanup test data
    await sql`DELETE FROM studios WHERE id = ${testStudioId}`;
    await sql`DELETE FROM users WHERE id = ${testUserId}`;
    
    // Stop dev server
    if (devServer) {
      devServer.kill();
    }
  });

  // Feature 1: Voucher Sales
  test('Feature 1: Voucher Sales', async () => {
    const feature = 'Voucher Sales';
    const tools = ['create_voucher_product', 'sell_voucher', 'read_voucher_sales', 'redeem_voucher'];
    
    try {
      // Check table exists
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'voucher_products' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      // Unit test: Create voucher product
      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'create a voucher product "Gold Gift Card" €200'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('voucher') || 
                      chatResponse.body?.response?.includes('Gold') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 2: Dashboard Management
  test('Feature 2: Dashboard Management', async () => {
    const feature = 'Dashboard Management';
    const tools = ['list_top_clients', 'get_client_segments'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'crm_clients' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'list top clients by revenue'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('client') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 3: Gallery Management
  test('Feature 3: Gallery Management', async () => {
    const feature = 'Gallery Management';
    const tools = ['create_gallery', 'read_galleries', 'update_gallery', 'delete_gallery', 'manage_gallery_images'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'galleries' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'create a new gallery called "Wedding Portfolio"'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('gallery') || 
                      chatResponse.body?.response?.includes('Wedding') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 4: Calendar Operations
  test('Feature 4: Calendar Operations', async () => {
    const feature = 'Calendar Operations';
    const tools = ['create_photography_session', 'read_calendar_sessions', 'update_photography_session', 'cancel_photography_session', 'check_calendar_availability'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'photography_sessions' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'check calendar availability for tomorrow at 2pm'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('calendar') || 
                      chatResponse.body?.response?.includes('available') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 5: File Management
  test('Feature 5: File Management', async () => {
    const feature = 'File Management';
    const tools = ['upload_file', 'read_digital_files', 'update_digital_file', 'delete_digital_file', 'organize_files_by_folder'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'digital_files' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'list digital files from last week'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('file') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 6: Blog Content
  test('Feature 6: Blog Content', async () => {
    const feature = 'Blog Content';
    const tools = ['create_blog_post', 'read_blog_posts', 'update_blog_post', 'delete_blog_post', 'publish_blog_post'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'blog_posts' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'create a blog post about wedding photography tips'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('blog') || 
                      chatResponse.body?.response?.includes('post') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 7: Email Campaigns
  test('Feature 7: Email Campaigns', async () => {
    const feature = 'Email Campaigns';
    const tools = ['create_email_campaign', 'read_email_campaigns', 'send_email_campaign', 'update_email_campaign', 'delete_email_campaign'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'email_campaigns' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'create email campaign for spring photography specials'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('email') || 
                      chatResponse.body?.response?.includes('campaign') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 8: Questionnaires
  test('Feature 8: Questionnaires', async () => {
    const feature = 'Questionnaires';
    const tools = ['create_questionnaire', 'read_questionnaires', 'send_questionnaire', 'read_questionnaire_responses', 'update_questionnaire'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'questionnaires' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'create questionnaire for new wedding clients'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('questionnaire') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 9: Reports & Analytics
  test('Feature 9: Reports & Analytics', async () => {
    const feature = 'Reports & Analytics';
    const tools = ['generate_business_report', 'get_kpi_dashboard', 'export_data_analytics', 'get_performance_metrics'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'crm_invoices' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'generate monthly business report'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('report') || 
                      chatResponse.body?.response?.includes('analytics') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 10: System Administration
  test('Feature 10: System Administration', async () => {
    const feature = 'System Administration';
    const tools = ['manage_user_accounts', 'system_configuration', 'database_management', 'system_monitoring', 'audit_trail'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'users' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'check system status and performance'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('system') || 
                      chatResponse.body?.response?.includes('status') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 11: Integration Management
  test('Feature 11: Integration Management', async () => {
    const feature = 'Integration Management';
    const tools = ['manage_integrations', 'api_management', 'webhook_management', 'data_sync', 'external_service_status'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'integrations' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'check external service integration status'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('integration') || 
                      chatResponse.body?.response?.includes('service') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 12: Automation Management
  test('Feature 12: Automation Management', async () => {
    const feature = 'Automation Management';
    const tools = ['create_automation_workflow', 'manage_automated_triggers', 'schedule_automated_tasks', 'read_automation_status', 'update_automation_settings'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'automation_workflows' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'create automation workflow for client onboarding'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('automation') || 
                      chatResponse.body?.response?.includes('workflow') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  // Feature 13: Customer Portal Management
  test('Feature 13: Customer Portal Management', async () => {
    const feature = 'Customer Portal Management';
    const tools = ['create_portal_access', 'manage_portal_content', 'read_portal_analytics', 'update_portal_settings', 'send_portal_notifications'];
    
    try {
      const tableCheck = await sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name = 'client_portal_access' AND table_schema = 'public'
      `;
      const tableStatus = tableCheck.length > 0 ? '✅' : '❌';

      const chatResponse = await request
        .post('/api/crm/agent/chat')
        .send({
          studioId: testStudioId,
          userId: testUserId,
          message: 'check customer portal analytics'
        });

      const unitTest = chatResponse.status === 200 ? '✅' : '❌';
      const chatTest = chatResponse.body?.response?.includes('portal') || 
                      chatResponse.body?.response?.includes('customer') ? '✅' : '⚠️';

      const status = (tableStatus === '✅' && unitTest === '✅' && chatTest === '✅') ? '✅' : 
                    (tableStatus === '❌' || unitTest === '❌') ? '❌' : '⚠️';

      testResults.push({ feature, tools, tableStatus, unitTest, chatTest, status });
    } catch (error) {
      testResults.push({ feature, tools, tableStatus: '❌', unitTest: '❌', chatTest: '❌', status: '❌' });
    }
  });

  test('Generate Final Report', () => {
    console.log('\n📊 CRM Agent Test Matrix');
    console.log('Feature\tTools\tTable\tUnit\tChat\tStatus');
    
    let passed = 0;
    let total = testResults.length;

    testResults.forEach(result => {
      const toolsStr = result.tools.length > 2 ? 
        `${result.tools.slice(0, 2).join(', ')}, +${result.tools.length - 2}` : 
        result.tools.join(', ');
      
      console.log(`${result.feature}\t${toolsStr}\t${result.tableStatus}\t${result.unitTest}\t${result.chatTest}\t${result.status}`);
      
      if (result.status === '✅') passed++;
    });

    console.log('\n📈 Coverage');
    console.log(`Passed: ${passed} / ${total} (${((passed / total) * 100).toFixed(1)}%)`);

    const failed = testResults.filter(r => r.status === '❌');
    const partial = testResults.filter(r => r.status === '⚠️');

    if (failed.length > 0) {
      console.log('\n🔧 Next Steps');
      failed.forEach(result => {
        console.log(`- Fix ${result.feature}: ${result.unitTest === '❌' ? 'API failure' : 'table missing'}`);
      });
    }

    if (partial.length > 0) {
      console.log('\n⚠️ Partial Issues');
      partial.forEach(result => {
        console.log(`- ${result.feature}: ${result.chatTest === '⚠️' ? 'chat response unclear' : 'minor issues'}`);
      });
    }

    expect(passed / total).toBeGreaterThan(0.7); // Expect >70% pass rate
  });
});