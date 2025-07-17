// Test AutoBlog scheduling functionality
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testAutoBlogScheduling() {
  try {
    console.log('Testing AutoBlog scheduling functionality...');
    
    // Create test image buffer
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    // Test 1: Draft mode
    console.log('\n=== Test 1: Draft Mode ===');
    const draftFormData = new FormData();
    draftFormData.append('images', testImageBuffer, {
      filename: 'family-session-draft.png',
      contentType: 'image/png'
    });
    draftFormData.append('userPrompt', 'Professional family photography session test for draft mode');
    draftFormData.append('language', 'de');
    draftFormData.append('publishOption', 'draft');
    draftFormData.append('siteUrl', 'https://www.newagefotografie.com');

    const draftResponse = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: draftFormData
    });
    
    const draftResult = await draftResponse.json();
    console.log('Draft Response status:', draftResponse.status);
    console.log('Draft success:', draftResult.success);
    if (draftResult.success) {
      console.log('✅ Draft created successfully');
      console.log('Status:', draftResult.post.status);
      console.log('Published:', draftResult.post.published);
    } else {
      console.log('❌ Draft failed:', draftResult.error);
    }

    // Test 2: Immediate publish
    console.log('\n=== Test 2: Immediate Publish ===');
    const publishFormData = new FormData();
    publishFormData.append('images', testImageBuffer, {
      filename: 'family-session-publish.png',
      contentType: 'image/png'
    });
    publishFormData.append('userPrompt', 'Professional family photography session test for immediate publish');
    publishFormData.append('language', 'de');
    publishFormData.append('publishOption', 'publish');
    publishFormData.append('siteUrl', 'https://www.newagefotografie.com');

    const publishResponse = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: publishFormData
    });
    
    const publishResult = await publishResponse.json();
    console.log('Publish Response status:', publishResponse.status);
    console.log('Publish success:', publishResult.success);
    if (publishResult.success) {
      console.log('✅ Published successfully');
      console.log('Status:', publishResult.post.status);
      console.log('Published:', publishResult.post.published);
      console.log('Published at:', publishResult.post.publishedAt);
    } else {
      console.log('❌ Publish failed:', publishResult.error);
    }

    // Test 3: Scheduled publish
    console.log('\n=== Test 3: Scheduled Publish ===');
    const scheduleFormData = new FormData();
    scheduleFormData.append('images', testImageBuffer, {
      filename: 'family-session-schedule.png',
      contentType: 'image/png'
    });
    scheduleFormData.append('userPrompt', 'Professional family photography session test for scheduled publish');
    scheduleFormData.append('language', 'de');
    scheduleFormData.append('publishOption', 'schedule');
    scheduleFormData.append('scheduledFor', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()); // Schedule for tomorrow
    scheduleFormData.append('siteUrl', 'https://www.newagefotografie.com');

    const scheduleResponse = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: scheduleFormData
    });
    
    const scheduleResult = await scheduleResponse.json();
    console.log('Schedule Response status:', scheduleResponse.status);
    console.log('Schedule success:', scheduleResult.success);
    if (scheduleResult.success) {
      console.log('✅ Scheduled successfully');
      console.log('Status:', scheduleResult.post.status);
      console.log('Published:', scheduleResult.post.published);
      console.log('Scheduled for:', scheduleResult.post.scheduledFor);
    } else {
      console.log('❌ Schedule failed:', scheduleResult.error);
    }

    // Test 4: Verify all posts in database
    console.log('\n=== Test 4: Database Verification ===');
    const blogResponse = await fetch('http://localhost:5000/api/blog/posts');
    const blogData = await blogResponse.json();
    console.log('Total blog posts:', blogData.count);
    console.log('Posts found:', blogData.posts.length);
    
    // Show status breakdown
    const statusCount = {};
    blogData.posts.forEach(post => {
      statusCount[post.status || 'UNKNOWN'] = (statusCount[post.status || 'UNKNOWN'] || 0) + 1;
    });
    console.log('Status breakdown:', statusCount);
    
    // Show recent posts
    console.log('\nRecent AutoBlog posts:');
    const recentPosts = blogData.posts.filter(p => p.title.includes('Test') || p.title.includes('test')).slice(0, 3);
    recentPosts.forEach(post => {
      console.log(`- ${post.title} (${post.status}, published: ${post.published})`);
    });
    
    console.log('\n✅ AutoBlog scheduling tests completed');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAutoBlogScheduling();