const { spawn } = require('child_process');

async function testPlayerMovement() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9225;

  const browser = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--mute-audio',
    'http://localhost:3000/'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const targetsRes = await fetch(`http://localhost:${port}/json`);
    const targets = await targetsRes.json();
    const pageTarget = targets.find(t => t.url && t.url.includes('localhost:3000'));
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const evalCode = (expr) => new Promise(resolve => {
      const curId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === curId) {
          ws.removeEventListener('message', handler);
          resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    });

    // Start game
    await evalCode('window.nullVectorGame.setState("PLAYING")');
    const initialPos = (await evalCode('({ x: window.nullVectorGame.player.position.x, z: window.nullVectorGame.player.position.z, health: window.nullVectorGame.player.health })')).result.value;
    
    // Simulate pressing KeyW
    await evalCode('window.nullVectorGame.input.keys["KeyW"] = true');
    await new Promise(r => setTimeout(r, 600));
    await evalCode('window.nullVectorGame.input.keys["KeyW"] = false');
    
    const afterPos = (await evalCode('({ x: window.nullVectorGame.player.position.x, z: window.nullVectorGame.player.position.z, isGrounded: window.nullVectorGame.player.isGrounded })')).result.value;
    console.log('[Test] Initial Pos:', initialPos);
    console.log('[Test] After Pos:', afterPos);
    
    if (afterPos.z < initialPos.z) {
      console.log('✅ Player moved forward successfully!');
    } else {
      throw new Error('Player did not move forward');
    }

    // Test Jump
    await evalCode('window.nullVectorGame.input.keysJustPressed["Space"] = true; window.nullVectorGame.player.update(0.016);');
    await new Promise(r => setTimeout(r, 100));
    const jumpState = (await evalCode('({ velY: window.nullVectorGame.player.velocity.y, isGrounded: window.nullVectorGame.player.isGrounded })')).result.value;
    console.log('[Test] Jump State:', jumpState);

    if (jumpState.velY > 0) {
      console.log('✅ Jump physics verified!');
    } else {
      throw new Error('Jump physics failed');
    }

    console.log('✅ Phase 2 Player Controller fully verified!');
    process.exit(0);

  } catch(e) {
    console.error('❌ Test failed:', e);
    process.exit(1);
  } finally {
    browser.kill();
  }
}

testPlayerMovement();
