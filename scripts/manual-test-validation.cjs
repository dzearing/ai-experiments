const fs = require('fs').promises;
const path = require('path');

async function validateClaudeCodeState() {
  console.log('🔍 Claude Code Manual Validation Test');
  console.log('=====================================\n');
  
  console.log('Please follow these steps manually in your browser:\n');
  
  console.log('1. 🧹 Clear browser console (F12 → Console → Clear)');
  console.log('2. 🌐 Go to http://localhost:5173');
  console.log('3. 📁 Click "Projects" in the sidebar');
  console.log('4. 🎯 Click on "apisurf" project');
  console.log('5. 💬 Click "Claude Code" button');
  console.log('6. ⏰ Wait 10 seconds and observe...\n');
  
  console.log('What to look for:');
  console.log('✅ Should see greeting message like "Hey dzearing! Good afternoon..."');
  console.log('❌ Should NOT see empty chat area\n');
  
  console.log('Console logs to watch for:');
  console.log('✅ [ClaudeCodeProvider] MOUNTED');
  console.log('✅ [ClaudeCodeProvider] setupSSEConnection called');
  console.log('❌ [ClaudeCodeProvider] Component cleanup running (should NOT appear during navigation)');
  console.log('❌ Message not found for chunk (should NOT appear)\n');
  
  // Analyze recent server logs
  try {
    const serverLogsPath = path.join(__dirname, '..', 'server', 'logs');
    const eventsLogPath = path.join(serverLogsPath, 'events.log');
    const claudeLogPath = path.join(serverLogsPath, 'claude-messages.log');
    
    const eventsLog = await fs.readFile(eventsLogPath, 'utf-8');
    const claudeLog = await fs.readFile(claudeLogPath, 'utf-8');
    
    const eventsLines = eventsLog.split('\n').filter(Boolean);
    const claudeLines = claudeLog.split('\n').filter(Boolean);
    
    // Get recent SSE events
    const recentSSEEvents = eventsLines
      .filter(line => 
        line.includes('CLAUDE_SSE_CONNECTED') || 
        line.includes('CLAUDE_SSE_DISCONNECTED') ||
        line.includes('CLAUDE_GREETING_GENERATED')
      )
      .slice(-10);
    
    // Get recent greeting events
    const recentGreetingEvents = claudeLines
      .filter(line => 
        line.includes('No active connections to send greeting to') ||
        line.includes('Sending greeting to') ||
        line.includes('Sent message-start to connection')
      )
      .slice(-10);
    
    console.log('📊 Recent Server Activity Analysis:');
    console.log('==================================\n');
    
    if (recentSSEEvents.length > 0) {
      console.log('🔗 Recent SSE Connection Events:');
      recentSSEEvents.forEach(line => {
        if (line.includes('CONNECTED')) {
          console.log(`✅ ${line.split('|')[0].trim()} - SSE Connected`);
        } else if (line.includes('DISCONNECTED')) {
          console.log(`❌ ${line.split('|')[0].trim()} - SSE Disconnected`);
        } else if (line.includes('GREETING_GENERATED')) {
          const match = line.match(/activeConnections:(\d+)/);
          const activeConnections = match ? match[1] : '?';
          console.log(`📨 ${line.split('|')[0].trim()} - Greeting sent to ${activeConnections} connections`);
        }
      });
      console.log('');
    }
    
    if (recentGreetingEvents.length > 0) {
      console.log('💬 Recent Greeting Events:');
      recentGreetingEvents.forEach(line => {
        if (line.includes('No active connections')) {
          console.log(`❌ ${line.split(']')[0]}] - No active connections for greeting`);
        } else if (line.includes('Sending greeting to')) {
          console.log(`📤 ${line.split(']')[0]}] - Attempting to send greeting`);
        } else if (line.includes('Sent message-start')) {
          console.log(`✅ ${line.split(']')[0]}] - Message start sent successfully`);
        }
      });
      console.log('');
    }
    
    // Analyze the pattern
    const recentEvents = eventsLines.slice(-20);
    const hasConnectedDisconnectedPattern = recentEvents.some((line, index) => {
      if (line.includes('CLAUDE_SSE_CONNECTED')) {
        // Check if there are disconnects within the next few lines
        const nextFewLines = recentEvents.slice(index + 1, index + 5);
        const disconnectCount = nextFewLines.filter(l => l.includes('CLAUDE_SSE_DISCONNECTED')).length;
        return disconnectCount >= 3;
      }
      return false;
    });
    
    const hasNoActiveConnections = recentGreetingEvents.some(line => 
      line.includes('No active connections to send greeting to')
    );
    
    console.log('🎯 Problem Analysis:');
    console.log('===================');
    
    if (hasConnectedDisconnectedPattern) {
      console.log('❌ ISSUE DETECTED: Rapid SSE connect/disconnect pattern found');
      console.log('   → This indicates component mount/unmount cycles');
    } else {
      console.log('✅ No rapid SSE connect/disconnect pattern detected');
    }
    
    if (hasNoActiveConnections) {
      console.log('❌ ISSUE DETECTED: Greetings being sent to 0 active connections');
      console.log('   → This confirms the SSE connection is closed before greeting arrives');
    } else {
      console.log('✅ No "No active connections" issues detected');
    }
    
    if (hasConnectedDisconnectedPattern && hasNoActiveConnections) {
      console.log('\n🚨 ROOT CAUSE CONFIRMED:');
      console.log('  1. SSE connection is established');
      console.log('  2. Component unmounts/remounts causing SSE to close');
      console.log('  3. Greeting generated ~3-5 seconds later');
      console.log('  4. No active connections to receive greeting');
      console.log('\n💡 SOLUTION NEEDED:');
      console.log('  → Prevent component unmounting during navigation');
      console.log('  → OR delay SSE connection until component is stable');
      console.log('  → OR move SSE connection to higher-level component');
    }
    
  } catch (error) {
    console.log('⚠️ Could not analyze server logs:', error.message);
  }
  
  console.log('\n📝 After testing, report your findings:');
  console.log('======================================');
  console.log('• Did you see the greeting message? (Yes/No)');
  console.log('• What console logs appeared?');
  console.log('• Did you see any mount/unmount logs?');
}

validateClaudeCodeState();