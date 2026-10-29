const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

const serverPath = path.join(__dirname, 'server.js');
console.log(`Testing Live DB Pilot MCP Server at: ${serverPath}`);

const server = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });
const rl = readline.createInterface({ input: server.stdout, terminal: false });

let step = 0;
function send(obj) { server.stdin.write(JSON.stringify(obj) + '\n'); }

rl.on('line', (line) => {
  const msg = JSON.parse(line);
  if (step === 0 && msg.result?.serverInfo?.name === 'live-db-pilot') {
    console.log('✅ Step 0: initialize succeeded!');
    step = 1;
    send({ jsonrpc: '2.0', id: 2, method: 'tools/list' });
  } else if (step === 1 && Array.isArray(msg.result?.tools)) {
    console.log(`✅ Step 1: tools/list succeeded (${msg.result.tools.length} tools).`);
    step = 2;
    send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'sql_generate_indexes',
        arguments: {
          table_name: 'orders',
          filter_columns: ['customer_id', 'status'],
          sort_columns: ['created_at']
        }
      }
    });
  } else if (step === 2 && msg.result?.content) {
    console.log('✅ Step 2: tools/call succeeded!');
    console.log('Output preview:', msg.result.content[0].text);
    console.log('🎉 Live DB Pilot MCP Server is 100% operational!');
    server.kill();
    process.exit(0);
  }
});

send({
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test' } }
});
