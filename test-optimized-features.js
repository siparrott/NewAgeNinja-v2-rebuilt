/**
 * Test script to verify the 4 optimized features with enhanced response clarity
 * Tests: Dashboard Management, Gallery Management, Questionnaires, Reports & Analytics
 */

const TEST_STUDIO_ID = "test-studio-123";
const TEST_USER_ID = "test-user-456";

async function testOptimizedFeatures() {
  console.log("🔬 Testing Optimized CRM Agent Features");
  console.log("=" * 50);

  const testCases = [
    {
      feature: "Dashboard Management (Top Clients)",
      message: "list top clients by revenue",
      expectedKeywords: ["Successfully retrieved", "ranked by", "Total combined revenue", "Top client"]
    },
    {
      feature: "Gallery Management", 
      message: "show me all galleries",
      expectedKeywords: ["Successfully retrieved", "galleries with complete details", "Latest gallery"]
    },
    {
      feature: "Questionnaires",
      message: "show questionnaires",
      expectedKeywords: ["Successfully retrieved", "comprehensive analytics", "Active questionnaires"]
    },
    {
      feature: "Reports & Analytics",
      message: "generate revenue report",
      expectedKeywords: ["Business report generated successfully", "comprehensive", "analytics", "Report covers"]
    }
  ];

  const results = [];
  
  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.feature}`);
    console.log(`📝 Command: "${testCase.message}"`);
    
    try {
      const response = await fetch('http://localhost:5000/api/crm/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioId: TEST_STUDIO_ID,
          userId: TEST_USER_ID,
          message: testCase.message
        })
      });

      const data = await response.json();
      
      if (data.success && data.assistant_response) {
        // Check for clarity improvements
        const responseText = data.assistant_response;
        let clarityScore = 0;
        const foundKeywords = [];
        
        for (const keyword of testCase.expectedKeywords) {
          if (responseText.toLowerCase().includes(keyword.toLowerCase())) {
            clarityScore++;
            foundKeywords.push(keyword);
          }
        }
        
        const clarityPercentage = (clarityScore / testCase.expectedKeywords.length) * 100;
        const status = clarityPercentage >= 75 ? "✅ PASS" : clarityPercentage >= 50 ? "⚠️ PARTIAL" : "❌ FAIL";
        
        results.push({
          feature: testCase.feature,
          status,
          clarityScore: `${clarityScore}/${testCase.expectedKeywords.length} (${clarityPercentage.toFixed(1)}%)`,
          foundKeywords,
          responseLength: responseText.length
        });
        
        console.log(`${status} - Clarity: ${clarityPercentage.toFixed(1)}%`);
        console.log(`📋 Found keywords: ${foundKeywords.join(', ')}`);
        console.log(`📏 Response length: ${responseText.length} characters`);
        
      } else {
        results.push({
          feature: testCase.feature,
          status: "❌ FAIL",
          error: data.error || "No assistant response",
          clarityScore: "0/0 (0%)"
        });
        console.log(`❌ FAIL - ${data.error || "No response"}`);
      }
      
    } catch (error) {
      results.push({
        feature: testCase.feature,
        status: "❌ ERROR",
        error: error.message,
        clarityScore: "0/0 (0%)"
      });
      console.log(`❌ ERROR - ${error.message}`);
    }
  }

  // Generate summary report
  console.log("\n" + "=" * 60);
  console.log("📊 OPTIMIZATION RESULTS SUMMARY");
  console.log("=" * 60);
  
  console.log("\nFeature                    Status    Clarity    Keywords Found");
  console.log("-" * 65);
  
  let passCount = 0;
  for (const result of results) {
    const statusPadded = result.status.padEnd(9);
    const featurePadded = result.feature.padEnd(26);
    const clarityPadded = result.clarityScore.padEnd(10);
    const keywords = result.foundKeywords ? result.foundKeywords.length : 0;
    
    console.log(`${featurePadded} ${statusPadded} ${clarityPadded} ${keywords}`);
    
    if (result.status.includes("PASS")) passCount++;
  }
  
  const successRate = (passCount / results.length) * 100;
  console.log(`\n🎯 Success Rate: ${passCount}/${results.length} (${successRate.toFixed(1)}%)`);
  
  if (successRate >= 75) {
    console.log("🎉 OPTIMIZATION SUCCESSFUL - Enhanced response clarity achieved!");
  } else if (successRate >= 50) {
    console.log("⚠️ PARTIAL SUCCESS - Some improvements needed");
  } else {
    console.log("❌ OPTIMIZATION FAILED - Significant improvements required");
  }
  
  return results;
}

// Run the test
testOptimizedFeatures()
  .then(results => {
    console.log("\n✅ Test completed successfully");
    process.exit(0);
  })
  .catch(error => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });