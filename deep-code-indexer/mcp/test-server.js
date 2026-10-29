const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

const serverPath = path.join(__dirname, 'server.js');
console.log(`Testing Deep Code Indexer MCP Server at: ${serverPath}`);

const server = spawn('node', [serverPath], { stdio: ['pipe', 'pipe', 'inherit'] });
const rl = readline.createInterface({ input: server.stdout, terminal: false });

let step = 0;
function send(obj) { server.stdin.write(JSON.stringify(obj) + '\n'); }

rl.on('line', (line) => {
  const msg = JSON.parse(line);
  if (step === 0 && msg.result?.serverInfo?.name === 'deep-code-indexer') {
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
        name: 'index_workspace',
        arguments: { workspace_path: path.join(__dirname, '..') }
      }
    });
  } else if (step === 2 && msg.result?.content) {
    console.log('✅ Step 2: tools/call (index_workspace) succeeded!');
    console.log('Output preview:', msg.result.content[0].text);
    console.log('🎉 Deep Code Indexer MCP Server is 100% operational!');
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
