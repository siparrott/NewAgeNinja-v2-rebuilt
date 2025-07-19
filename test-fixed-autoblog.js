// Simple test to verify the AutoBlog fixes work correctly
const testAutoBlogFixes = async () => {
  console.log('🧪 Testing AutoBlog fixes with actual API call...');
  
  const formData = new FormData();
  formData.append('userPrompt', 'Test German blog post about family photography in Vienna');
  formData.append('language', 'de');
  formData.append('publishOption', 'draft');
  
  // Create a simple test image buffer
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 100, 100);
  
  canvas.toBlob(async (blob) => {
    formData.append('images', blob, 'test-image.jpg');
    
    try {
      console.log('📡 Sending test request to fixed AutoBlog API...');
      const response = await fetch('/api/autoblog/generate', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ AUTOBLOG FIXES WORKING!');
        console.log('✅ Generated content length:', data.ai?.content_html?.length || 0);
        console.log('✅ Method used:', data.ai?.method || 'unknown');
        console.log('✅ Blog post created:', !!data.post);
      } else {
        console.log('❌ AutoBlog test failed:', data.error);
      }
    } catch (error) {
      console.log('❌ Test request failed:', error.message);
    }
  }, 'image/jpeg');
};

// Auto-run when page loads
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', testAutoBlogFixes);
}