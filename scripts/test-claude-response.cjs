const claudeService = require('../server/claude-service');

async function testClaudeResponse() {
  console.log('Testing Claude response structure...');
  
  const testPrompt = 'Say "Hello **world**!" with the word world in bold markdown';
  
  try {
    const response = await claudeService.processClaudeCodeMessage(
      testPrompt,
      [], // no tools
      'opus',
      null, // no working directory
      null, // no progress callback
      null, // no tool execution callback
      (messageType, content) => {
        console.log('onMessage callback:', { messageType, content });
      }
    );
    
    console.log('\n=== RESPONSE STRUCTURE ===');
    console.log('Type of response:', typeof response);
    console.log('Response keys:', Object.keys(response));
    console.log('Type of response.text:', typeof response.text);
    console.log('Response.text value:', response.text);
    console.log('Full response:', JSON.stringify(response, null, 2));
    console.log('========================\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testClaudeResponse();