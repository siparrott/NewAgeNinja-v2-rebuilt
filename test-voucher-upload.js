const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

async function testVoucherImageUpload() {
  try {
    // Test uploading a family photo for the Family shoot voucher
    const imagePath = path.join(__dirname, 'attached_assets', 'image_1751111876672.png');
    
    if (!fs.existsSync(imagePath)) {
      console.log('Image file not found:', imagePath);
      return;
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    // Test the upload endpoint
    const response = await fetch('http://localhost:5000/api/upload/image', {
      method: 'POST',
      headers: {
        // Add basic auth or session token if needed
        'Authorization': 'Bearer test-token'
      },
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Upload successful:', result);
      
      // Now update the Family shoot voucher with this image
      const updateResponse = await fetch('http://localhost:5000/api/vouchers/products/81a8364d-ac85-4a1c-9056-849e583b610d', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          imageUrl: result.url
        })
      });

      if (updateResponse.ok) {
        console.log('Voucher updated with image URL');
      } else {
        console.log('Failed to update voucher:', updateResponse.status);
      }

    } else {
      console.log('Upload failed:', response.status, await response.text());
    }

  } catch (error) {
    console.error('Error testing upload:', error);
  }
}

testVoucherImageUpload();