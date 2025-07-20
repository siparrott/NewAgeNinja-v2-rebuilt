#!/usr/bin/env node

/**
 * Comprehensive System Test Suite
 * Tests all 63 CRM tools across 14 feature areas
 */

const baseURL = 'http://localhost:5000';

// Test configuration
const testConfig = {
  studioId: 'test-studio',
  userId: 'test-user',
  timeout: 45000,
  maxRetries: 2
};

// Test categories mapping to tools
const testCategories = {
  'Core Operations': [
    'send_email',
    'global_search', 
    'find_entity',
    'count_invoices',
    'count_sessions',
    'count_leads'
  ],
  'Calendar Management': [
    'create_photography_session',
    'read_calendar_sessions',
    'update_photography_session',
    'cancel_photography_session',
    'check_calendar_availability'
  ],
  'File Management': [
    'upload_file',
    'read_digital_files',
    'update_digital_file',
    'delete_digital_file',
    'organize_files_by_folder'
  ],
  'Blog Management': [
    'create_blog_post',
    'read_blog_posts',
    'update_blog_post',
    'delete_blog_post',
    'publish_blog_post'
  ],
  'Email Campaigns': [
    'create_email_campaign',
    'read_email_campaigns',
    'send_email_campaign',
    'update_email_campaign',
    'delete_email_campaign'
  ],
  'Questionnaires': [
    'create_questionnaire',
    'read_questionnaires',
    'send_questionnaire',
    'read_questionnaire_responses',
    'update_questionnaire'
  ],
  'Reports & Analytics': [
    'generate_business_report',
    'get_kpi_dashboard',
    'export_data_analytics',
    'get_performance_metrics'
  ],
  'System Administration': [
    'manage_user_accounts',
    'system_configuration',
    'database_management',
    'system_monitoring',
    'audit_trail'
  ],
  'Integration Management': [
    'manage_integrations',
    'api_management',
    'webhook_management',
    'data_sync',
    'external_service_status'
  ],
  'Automation Management': [
    'create_automation_workflow',
    'manage_automated_triggers',
    'schedule_automated_tasks',
    'read_automation_status',
    'update_automation_settings'
  ],
  'Customer Portal': [
    'create_portal_access',
    'manage_portal_content',
    'read_portal_analytics',
    'update_portal_settings',
    'send_portal_notifications'
  ],
  'Voucher Management': [
    'create_voucher_product',
    'sell_voucher',
    'read_voucher_sales',
    'redeem_voucher'
  ],
  'Dashboard Analytics': [
    'list_top_clients',
    'get_client_segments'
  ],
  'Email Operations': [
    'reply_email',
    'create_invoice'
  ]
};

// Test commands for each category
const testCommands = {
  'Core Operations': [
    'search for clients named John',
    'count all invoices for 2025',
    'find entity Simon Parrott',
    'count photography sessions this year',
    'search for leads from last month',
    'send email to test@example.com about booking'
  ],
  'Calendar Management': [
    'check calendar availability for next week',
    'show me all calendar sessions',
    'create a family photography session for tomorrow',
    'update session notes for session ID 123',
    'cancel photography session'
  ],
  'File Management': [
    'show me digital files in galleries folder',
    'organize files by client folders',
    'upload a new file to portfolio',
    'update file metadata for image',
    'delete old temp files'
  ],
  'Blog Management': [
    'show me all blog posts',
    'create a new blog post about family photography',
    'publish the latest blog post',
    'update blog post content',
    'delete draft blog post'
  ],
  'Email Campaigns': [
    'show me all email campaigns',
    'create a summer promotion campaign',
    'send newsletter to all subscribers',
    'update campaign content',
    'delete old campaign'
  ],
  'Questionnaires': [
    'show me questionnaires',
    'create client intake questionnaire',
    'send questionnaire to new clients',
    'read questionnaire responses',
    'update questionnaire questions'
  ],
  'Reports & Analytics': [
    'generate business report for this year',
    'show KPI dashboard',
    'export analytics data',
    'get performance metrics for Q1'
  ],
  'System Administration': [
    'show system monitoring status',
    'check database health',
    'view audit trail',
    'manage user permissions',
    'configure system settings'
  ],
  'Integration Management': [
    'check external service status',
    'manage API integrations',
    'sync data with external systems',
    'configure webhooks',
    'update integration settings'
  ],
  'Automation Management': [
    'show automation status',
    'create booking reminder workflow',
    'schedule automated tasks',
    'manage automation triggers',
    'update automation settings'
  ],
  'Customer Portal': [
    'create portal access for client',
    'update portal settings',
    'read portal analytics',
    'manage portal content',
    'send portal notifications'
  ],
  'Voucher Management': [
    'create voucher product Platinum Gift €300',
    'show voucher sales data',
    'process voucher sale',
    'redeem gift voucher'
  ],
  'Dashboard Analytics': [
    'list top clients by revenue',
    'show client segments',
    'analyze customer demographics'
  ],
  'Email Operations': [
    'reply to last email',
    'create invoice for family session €450'
  ]
};

async function makeRequest(message, retries = 0) {
  try {
    const response = await fetch(`${baseURL}/api/crm/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studioId: testConfig.studioId,
        userId: testConfig.userId,
        message
      }),
      signal: AbortSignal.timeout(testConfig.timeout)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      response: data.response,
      status: data.status,
      timestamp: data.timestamp
    };
  } catch (error) {
    if (retries < testConfig.maxRetries) {
      console.log(`  ⏳ Retry ${retries + 1}/${testConfig.maxRetries} for: ${message.substring(0, 30)}...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeRequest(message, retries + 1);
    }
    
    return {
      success: false,
      error: error.message,
      message
    };
  }
}

async function testCategory(categoryName, commands) {
  console.log(`\n🧪 Testing: ${categoryName}`);
  console.log('=' .repeat(50));
  
  const results = [];
  let passed = 0;
  let failed = 0;
  
  for (const command of commands) {
    process.stdout.write(`  Testing: ${command.substring(0, 40)}... `);
    
    const result = await makeRequest(command);
    
    if (result.success) {
      const hasResponse = result.response && result.response.length > 50;
      const isGeneric = result.response?.includes('Task completed but no detailed response');
      
      if (hasResponse && !isGeneric) {
        console.log('✅ PASS');
        passed++;
        results.push({ command, status: 'PASS', response: result.response.substring(0, 100) + '...' });
      } else {
        console.log('⚠️  PARTIAL');
        failed++;
        results.push({ command, status: 'PARTIAL', response: result.response || 'No detailed response' });
      }
    } else {
      console.log('❌ FAIL');
      failed++;
      results.push({ command, status: 'FAIL', error: result.error });
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const passRate = ((passed / commands.length) * 100).toFixed(1);
  console.log(`\n📊 ${categoryName} Results: ${passed}/${commands.length} passed (${passRate}%)`);
  
  return { categoryName, passed, failed, total: commands.length, passRate: parseFloat(passRate), results };
}

async function runSystemTests() {
  console.log('🚀 COMPREHENSIVE SYSTEM TEST SUITE');
  console.log('Testing all 63 CRM tools across 14 feature areas');
  console.log(`Target: ${baseURL}`);
  console.log(`Timeout: ${testConfig.timeout}ms per request`);
  console.log('=' .repeat(70));
  
  const allResults = [];
  let totalPassed = 0;
  let totalTests = 0;
  
  // Test each category
  for (const [categoryName, commands] of Object.entries(testCommands)) {
    const categoryResult = await testCategory(categoryName, commands);
    allResults.push(categoryResult);
    totalPassed += categoryResult.passed;
    totalTests += categoryResult.total;
  }
  
  // Summary report
  console.log('\n' + '=' .repeat(70));
  console.log('📋 SYSTEM TEST SUMMARY');
  console.log('=' .repeat(70));
  
  allResults.forEach(result => {
    const status = result.passRate >= 80 ? '✅' : result.passRate >= 50 ? '⚠️' : '❌';
    console.log(`${status} ${result.categoryName.padEnd(25)} ${result.passed}/${result.total} (${result.passRate}%)`);
  });
  
  const overallPassRate = ((totalPassed / totalTests) * 100).toFixed(1);
  console.log('\n' + '=' .repeat(70));
  console.log(`🎯 OVERALL SYSTEM HEALTH: ${totalPassed}/${totalTests} (${overallPassRate}%)`);
  
  if (parseFloat(overallPassRate) >= 70) {
    console.log('✅ SYSTEM READY FOR DEVELOPMENT DEPLOYMENT');
  } else if (parseFloat(overallPassRate) >= 50) {
    console.log('⚠️  SYSTEM PARTIALLY READY - OPTIMIZATION RECOMMENDED');
  } else {
    console.log('❌ SYSTEM NEEDS CRITICAL FIXES BEFORE DEPLOYMENT');
  }
  
  // Detailed failure analysis
  const failures = allResults.flatMap(r => r.results.filter(t => t.status === 'FAIL'));
  if (failures.length > 0) {
    console.log('\n🔍 FAILURE ANALYSIS:');
    failures.slice(0, 5).forEach(failure => {
      console.log(`  ❌ ${failure.command}: ${failure.error}`);
    });
    if (failures.length > 5) {
      console.log(`  ... and ${failures.length - 5} more failures`);
    }
  }
  
  return {
    totalTests,
    totalPassed,
    overallPassRate: parseFloat(overallPassRate),
    categoryResults: allResults,
    readyForDeployment: parseFloat(overallPassRate) >= 70
  };
}

// Health check first
async function healthCheck() {
  try {
    const response = await fetch(`${baseURL}/api/health`);
    if (response.ok) {
      console.log('✅ Server health check passed');
      return true;
    }
  } catch (error) {
    console.log('❌ Server health check failed:', error.message);
    return false;
  }
}

// Run tests
(async () => {
  if (await healthCheck()) {
    const results = await runSystemTests();
    process.exit(results.readyForDeployment ? 0 : 1);
  } else {
    console.log('❌ Cannot run tests - server not available');
    process.exit(1);
  }
})();