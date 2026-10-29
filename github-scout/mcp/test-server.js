/**
 * Self-test script for github-scout MCP server
 * Spawns server.js as a child process and communicates via stdio JSON-RPC.
 */

const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

const serverPath = path.join(__dirname, 'server.js');
console.log(`Starting test for: ${serverPath}`);

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'inherit']
});

const rl = readline.createInterface({
  input: server.stdout,
  terminal: false
});

let testStep = 0;

function send(obj) {
  server.stdin.write(JSON.stringify(obj) + '\n');
}

rl.on('line', (line) => {
  const msg = JSON.parse(line);
  console.log(`\n[Test Step ${testStep}] Received response for ID ${msg.id}:`);

  if (testStep === 0) {
    // Expected: initialize response
    if (msg.result && msg.result.serverInfo && msg.result.serverInfo.name === 'github-scout') {
      console.log('✅ Step 0: "initialize" succeeded!');
      testStep = 1;
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      // Send tools/list request
      send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
    } else {
      console.error('❌ Step 0 Failed:', msg);
      process.exit(1);
    }
  } else if (testStep === 1) {
    // Expected: tools/list response
    if (msg.result && Array.isArray(msg.result.tools)) {
      console.log(`✅ Step 1: "tools/list" succeeded! Found ${msg.result.tools.length} tools.`);
      msg.result.tools.forEach((t) => console.log(`   - ${t.name}: ${t.description.slice(0, 60)}...`));
      
      testStep = 2;
      // Send tools/call for search_repositories
      send({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'search_repositories',
          arguments: {
            query: 'octocat/Hello-World',
            per_page: 1
          }
        }
      });
    } else {
      console.error('❌ Step 1 Failed:', msg);
      process.exit(1);
    }
  } else if (testStep === 2) {
    // Expected: tools/call response
    if (msg.result && Array.isArray(msg.result.content)) {
      console.log('✅ Step 2: "tools/call" (search_repositories) succeeded!');
      console.log('Content preview:', msg.result.content[0].text.slice(0, 200));
      console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
      server.kill();
      process.exit(0);
    } else {
      console.error('❌ Step 2 Failed:', msg);
      server.kill();
      process.exit(1);
    }
  }
});

// Send Step 0
send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-runner', version: '1.0.0' }
  }
});
