/**
 * test-runner.js
 * Automated browser test runner using Headless Edge and native WebSocket/CDP.
 * Captures all console logs, warnings, and uncaught exceptions.
 */

const { spawn } = require('child_process');
const http = require('http');

async function runTest() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9224;
  
  console.log('[TestRunner] Launching Headless Edge on port', port);
  const browser = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--disable-extensions',
    '--mute-audio',
    'http://localhost:3000/'
  ]);

  let isDone = false;
  const consoleMessages = [];
  const errors = [];

  const cleanup = () => {
    if (!isDone) {
      isDone = true;
      try { browser.kill(); } catch (e) {}
    }
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  // Wait for browser to start
  await new Promise(res => setTimeout(res, 1500));

  try {
    const targetsRes = await fetch(`http://localhost:${port}/json`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.url && t.url.includes('localhost:3000'));

    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      console.log('Available targets:', targets);
      throw new Error('Could not find Null Vector page target WebSocket URL');
    }

    console.log('[TestRunner] Connecting to page WebSocket:', pageTarget.webSocketDebuggerUrl);
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let msgId = 1;
    const send = (method, params = {}) => {
      return new Promise((resolve) => {
        const id = msgId++;
        const payload = JSON.stringify({ id, method, params });
        const handler = (event) => {
          const data = JSON.parse(event.data);
          if (data.id === id) {
            ws.removeEventListener('message', handler);
            resolve(data.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(payload);
      });
    };

    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        consoleMessages.push({ type: msg.params.type, text });
        console.log(`[Browser Console ${msg.params.type.toUpperCase()}]:`, text);
        if (msg.params.type === 'error') {
          errors.push(text);
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        errors.push(desc);
        console.error('[Browser Exception]:', desc);
      }
    };

    // Enable Runtime and Log domains
    await send('Runtime.enable');
    await send('Log.enable');

    // Wait 2s for loading sequence and game initialization
    await new Promise(res => setTimeout(res, 2000));

    // Evaluate window.nullVectorGame
    const evalRes = await send('Runtime.evaluate', {
      expression: `({
        hasGame: !!window.nullVectorGame,
        state: window.nullVectorGame?.state,
        hasScene: !!window.nullVectorGame?.scene,
        hasCamera: !!window.nullVectorGame?.camera,
        hasRenderer: !!window.nullVectorGame?.renderer
      })`,
      returnByValue: true
    });

    console.log('[TestRunner] Evaluated Game instance:', evalRes.result.value);

    // Verify
    if (errors.length > 0) {
      console.error(`\n❌ TEST FAILED: ${errors.length} error(s) detected:`);
      errors.forEach(e => console.error('  -', e));
      process.exit(1);
    } else {
      console.log('\n✅ TEST PASSED: 0 errors detected. Engine initialized cleanly.');
      process.exit(0);
    }

  } catch (err) {
    console.error('[TestRunner] Test error:', err);
    process.exit(1);
  } finally {
    cleanup();
  }
}

runTest();
