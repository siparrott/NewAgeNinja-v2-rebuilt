// Final test of AutoBlog scheduling functionality
import fetch from 'node-fetch';
import FormData from 'form-data';

async function testSchedulingFinal() {
  try {
    console.log('=== Testing AutoBlog Scheduling (Final) ===');
    
    const testImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
    
    // Test scheduled publish with specific datetime
    const scheduleDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
    console.log('Scheduling for:', scheduleDateTime.toISOString());
    
    const scheduleFormData = new FormData();
    scheduleFormData.append('images', testImageBuffer, {
      filename: 'schedule-test.png',
      contentType: 'image/png'
    });
    scheduleFormData.append('userPrompt', 'Final scheduling test for AutoBlog system');
    scheduleFormData.append('language', 'de');
    scheduleFormData.append('publishOption', 'schedule');
    scheduleFormData.append('scheduledFor', scheduleDateTime.toISOString());
    scheduleFormData.append('siteUrl', 'https://www.newagefotografie.com');

    const response = await fetch('http://localhost:5000/api/autoblog/generate', {
      method: 'POST',
      body: scheduleFormData
    });
    
    const result = await response.json();
    console.log('Response status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ Scheduled post created successfully!');
      console.log('Post ID:', result.post.id);
      console.log('Title:', result.post.title);
      console.log('Status:', result.post.status);
      console.log('Published:', result.post.published);
      console.log('Scheduled for:', result.post.scheduledFor);
      
      // Verify in database
      const dbResponse = await fetch(`http://localhost:5000/api/blog/posts/${result.post.id}`);
      const dbPost = await dbResponse.json();
      console.log('\nDatabase verification:');
      console.log('DB Status:', dbPost.status);
      console.log('DB Scheduled for:', dbPost.scheduledFor);
    } else {
      console.log('❌ Failed:', result.error);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSchedulingFinal();