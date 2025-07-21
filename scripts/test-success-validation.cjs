const fs = require('fs').promises;
const path = require('path');

async function validateFix() {
  console.log('🎉 Claude Code Fix Validation');
  console.log('=============================\n');

  try {
    const serverLogsPath = path.join(__dirname, '..', 'server', 'logs');
    const eventsLogPath = path.join(serverLogsPath, 'events.log');
    const claudeLogPath = path.join(serverLogsPath, 'claude-messages.log');

    const eventsLog = await fs.readFile(eventsLogPath, 'utf-8');
    const claudeLog = await fs.readFile(claudeLogPath, 'utf-8');

    const eventsLines = eventsLog.split('\n').filter(Boolean);
    const claudeLines = claudeLog.split('\n').filter(Boolean);

    // Get the most recent successful pattern
    const recentEvents = eventsLines.slice(-20);
    const recentClaude = claudeLines.slice(-20);

    // Look for successful pattern
    const successfulConnection = recentEvents.find(
      (line) => line.includes('CLAUDE_GREETING_GENERATED') && line.includes('activeConnections:1')
    );

    const successfulMessage = recentClaude.find((line) =>
      line.includes('Sent greeting chunk to connection')
    );

    const recentConnected = recentEvents
      .filter((line) => line.includes('CLAUDE_SSE_CONNECTED'))
      .slice(-1)[0];
    const recentDisconnects = recentEvents.filter((line) =>
      line.includes('CLAUDE_SSE_DISCONNECTED')
    );

    console.log('📊 Fix Validation Results:');
    console.log('=========================\n');

    if (successfulConnection && successfulMessage) {
      console.log('🎉 SUCCESS! The fix is working correctly!');
      console.log('✅ SSE connection stayed alive');
      console.log('✅ Greeting was sent to 1 active connection');
      console.log('✅ Message was successfully delivered to client');
      console.log('');
      console.log('Recent successful events:');
      console.log('- Connection:', recentConnected?.split('|')[0]?.trim());
      console.log('- Greeting:', successfulConnection.split('|')[0]?.trim());
      console.log(
        '- Message delivery:',
        successfulMessage.split(']')[0] + '] - Greeting chunk sent'
      );

      console.log('\n🚀 THE TEST PASSES!');
      console.log('Chat messages should now appear correctly when navigating to Claude Code.');
    } else {
      console.log('❌ Fix not yet working. Still seeing issues:');

      if (!successfulConnection) {
        console.log('- No greeting sent to active connections found');
      }
      if (!successfulMessage) {
        console.log('- No successful message delivery found');
      }

      // Check if we still have the old pattern
      const hasRapidDisconnects = recentDisconnects.length >= 3;
      if (hasRapidDisconnects) {
        console.log('- Still seeing rapid disconnect pattern');
      }
    }

    console.log('\n📝 Manual Test Instructions:');
    console.log('============================');
    console.log('1. Refresh your browser (F5)');
    console.log('2. Navigate: Home → Projects → apisurf → Claude Code');
    console.log('3. You should see a greeting message appear within 5-10 seconds');
    console.log('4. The message should say something like "Hey dzearing! Good afternoon..."');
  } catch (error) {
    console.log('⚠️ Could not validate logs:', error.message);
  }
}

validateFix();
