const http = require('http');

async function makeRequest(path, method = 'GET', body = null) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path,
    method,
    headers: {},
  };

  if (body) {
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
  }

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testMarkdownRendering() {
  console.log('Testing Claude Code markdown rendering...\n');

  try {
    // 1. Start a new session
    console.log('1. Starting new Claude Code session...');
    const startRes = await makeRequest('/api/claude/code/start', 'POST', {
      projectId: 'project--home-dzearing-workspace-projects-apisurf',
      projectPath: '/home/dzearing/workspace/projects/apisurf',
      repoName: 'apisurf-1',
      userName: 'test-user',
    });

    console.log('Session started:', startRes.data);
    const sessionId = startRes.data.sessionId;

    if (!sessionId) {
      throw new Error('Failed to get session ID');
    }

    // 2. Set up SSE connection to receive messages
    console.log('\n2. Setting up SSE connection...');
    const sseOptions = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/claude/code/stream?sessionId=${sessionId}&connectionId=test-${Date.now()}`,
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    };

    const messages = [];
    const sseReq = http.request(sseOptions, (res) => {
      console.log('SSE connected, status:', res.statusCode);

      res.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('event: message-chunk')) {
            const dataLine = lines[lines.indexOf(line) + 1];
            if (dataLine && dataLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(dataLine.substring(6));
                messages.push(data);
                process.stdout.write(data.chunk || '');
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      });
    });

    sseReq.on('error', (err) => {
      console.error('SSE error:', err);
    });

    sseReq.end();

    // 3. Wait for greeting message
    console.log('\n3. Waiting for greeting message...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 4. Send test message
    console.log('\n\n4. Sending test message...');
    const testMessage = 'Say "Hello **world**!" with the word world in bold markdown';

    await makeRequest('/api/claude/code/message', 'POST', {
      sessionId,
      message: testMessage,
      mode: 'default',
    });

    // 5. Wait for response
    console.log('\n5. Waiting for response...');
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 6. Check results
    console.log('\n\n6. Checking results...');
    console.log('Total message chunks received:', messages.length);

    // Reconstruct the full message
    const fullMessage = messages
      .filter((m) => m.chunk)
      .map((m) => m.chunk)
      .join('');

    console.log('\nFull reconstructed message:');
    console.log(fullMessage);

    // Check for issues
    if (fullMessage.includes('[object Object]')) {
      console.error('\n❌ ERROR: Response contains [object Object]');
    } else if (fullMessage.includes('**world**')) {
      console.log('\n✅ SUCCESS: Markdown formatting preserved!');
    } else if (fullMessage.toLowerCase().includes('world')) {
      console.log('\n⚠️  WARNING: Response contains "world" but markdown may not be preserved');
    } else {
      console.log('\n❓ UNKNOWN: Could not determine if markdown is working');
    }

    // 7. Clean up
    console.log('\n7. Closing session...');
    await makeRequest('/api/claude/code/end', 'POST', { sessionId });

    sseReq.destroy();
  } catch (error) {
    console.error('\nError during test:', error);
  }
}

testMarkdownRendering();
