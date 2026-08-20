const { spawn } = require('child_process');

async function testFullGame() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9227;

  console.log('[FullGameTest] Starting comprehensive QA test on port', port);
  const browser = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--mute-audio',
    'http://localhost:3000/'
  ]);

  const errors = [];

  const cleanup = () => {
    try { browser.kill(); } catch (e) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

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

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        if (msg.params.type === 'error') {
          console.error('[Browser Error]:', text);
          errors.push(text);
        } else {
          console.log(`[Browser ${msg.params.type}]:`, text);
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        errors.push(desc);
        console.error('[Browser Exception]:', desc);
      }
    };

    const sendMsg = (method, params = {}) => {
      return new Promise(resolve => {
        const curId = id++;
        const handler = (e) => {
          const d = JSON.parse(e.data);
          if (d.id === curId) {
            ws.removeEventListener('message', handler);
            resolve(d.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    };

    await sendMsg('Runtime.enable');
    await sendMsg('Log.enable');

    // 1. Wait for loading sequence
    await new Promise(r => setTimeout(r, 2000));
    console.log('[Test 1] Starting Mission...');
    await evalCode(`
      document.getElementById('btn-loading-start')?.click();
      document.getElementById('btn-play')?.click();
    `);

    // Verify Game State is PLAYING
    const state1 = (await evalCode('window.nullVectorGame.state')).result.value;
    console.log('[Test 1] Game State:', state1);
    if (state1 !== 'PLAYING') throw new Error('Game failed to transition to PLAYING');

    // 2. Check Player & Level
    const playerInfo = (await evalCode(`({
      hp: window.nullVectorGame.player.health,
      armor: window.nullVectorGame.player.armor,
      pos: window.nullVectorGame.player.position,
      collidersCount: window.nullVectorGame.colliders.length,
      enemiesCount: window.nullVectorGame.enemyManager.enemies.length,
      pickupsCount: window.nullVectorGame.level.pickupManager.pickups.length
    })`)).result.value;
    console.log('[Test 2] World Setup:', playerInfo);
    if (playerInfo.collidersCount < 10) throw new Error('Colliders missing');
    if (playerInfo.enemiesCount < 5) throw new Error('Enemies not spawned');
    if (playerInfo.pickupsCount < 6) throw new Error('Pickups not spawned');

    // 3. Move player into Checkpoint to trigger Step 2 (Clear Cargo Bay)
    console.log('[Test 3] Breaching Airlock...');
    await evalCode(`
      window.nullVectorGame.player.position.set(0, 0, 20);
      window.nullVectorGame.objectiveManager.update(0.016);
    `);
    const objStep = (await evalCode('window.nullVectorGame.objectiveManager.currentStep')).result.value;
    console.log('[Test 3] Objective Step after breach:', objStep);
    if (objStep !== 2) throw new Error('Failed to advance objective to Step 2 (Clear Cargo Bay)');

    // 4. Test Combat & Enemy Elimination
    console.log('[Test 4] Engaging Hostiles in Cargo Bay...');
    await evalCode(`
      const targetEnemy = window.nullVectorGame.enemyManager.enemies[0];
      targetEnemy.position.set(0, 0, 8);
      targetEnemy.group.position.set(0, 0, 8);
      targetEnemy.group.updateMatrixWorld(true);
      
      window.nullVectorGame.player.position.set(0, 0, 12);
      window.nullVectorGame.player.yaw = 0;
      window.nullVectorGame.player.pitch = 0;
      
      // Fire shotgun into enemy
      window.nullVectorGame.weaponManager.equipSlot(3);
      window.nullVectorGame.shootingSystem.fireWeapon(window.nullVectorGame.weaponManager.activeWeapon);
    `);

    const combatStats = (await evalCode(`({
      shotsHit: window.nullVectorGame.stats.shotsHit,
      shotsFired: window.nullVectorGame.stats.shotsFired,
      kills: window.nullVectorGame.stats.kills
    })`)).result.value;
    console.log('[Test 4] Combat stats:', combatStats);
    if (combatStats.shotsHit < 1) throw new Error('Combat hit detection failed');

    // 5. Complete Cargo Bay Objective by eliminating required enemies
    console.log('[Test 5] Clearing Cargo Bay Objective...');
    await evalCode(`
      window.nullVectorGame.objectiveManager.onEnemyKilled();
      window.nullVectorGame.objectiveManager.onEnemyKilled();
      window.nullVectorGame.objectiveManager.onEnemyKilled();
    `);
    const objStep3 = (await evalCode('window.nullVectorGame.objectiveManager.currentStep')).result.value;
    console.log('[Test 5] Objective Step:', objStep3);
    if (objStep3 !== 3) throw new Error('Failed to advance to Step 3 (Hack Terminal)');

    // 6. Test Security Terminal Hack & Facility Lockdown
    console.log('[Test 6] Hacking Security Terminal...');
    await evalCode(`
      window.nullVectorGame.player.position.copy(window.nullVectorGame.level.securityTerminal.position).add({ x: 0, y: 0, z: 1.5 });
      window.nullVectorGame.input.keysJustPressed["KeyE"] = true;
      window.nullVectorGame.level.update(0.016);
    `);
    const isHacked = (await evalCode('window.nullVectorGame.level.securityTerminal.isHacked')).result.value;
    const isLockdown = (await evalCode('window.nullVectorGame.level.isLockdown')).result.value;
    console.log('[Test 6] Terminal Hacked:', isHacked, '| Lockdown Active:', isLockdown);
    if (!isHacked || !isLockdown) throw new Error('Terminal hack / Lockdown failed to trigger');

    // 7. Test Lockdown Survival Countdown & Extraction Unlock
    console.log('[Test 7] Fast-forwarding Lockdown Survival...');
    await evalCode(`
      window.nullVectorGame.objectiveManager.update(31.0);
    `);
    const objStep5 = (await evalCode('window.nullVectorGame.objectiveManager.currentStep')).result.value;
    console.log('[Test 7] Objective Step after lockdown:', objStep5);
    if (objStep5 !== 5) throw new Error('Failed to advance to Step 5 (Reach Extraction)');

    // 8. Test Reaching Extraction Zone & Mission Victory
    console.log('[Test 8] Reaching Extraction LZ...');
    await evalCode(`
      window.nullVectorGame.player.position.copy(window.nullVectorGame.level.extractionZone.position);
      window.nullVectorGame.objectiveManager.update(0.016);
    `);
    const finalState = (await evalCode('window.nullVectorGame.state')).result.value;
    console.log('[Test 8] Final Game State:', finalState);
    if (finalState !== 'VICTORY') throw new Error('Failed to reach VICTORY state');

    // 9. Test Mission Restart
    console.log('[Test 9] Testing Mission Restart...');
    await evalCode(`
      document.getElementById('btn-vic-restart')?.click();
    `);
    const restartState = (await evalCode(`({
      state: window.nullVectorGame.state,
      playerZ: window.nullVectorGame.player.position.z,
      hp: window.nullVectorGame.player.health,
      kills: window.nullVectorGame.stats.kills,
      objStep: window.nullVectorGame.objectiveManager.currentStep
    })`)).result.value;
    console.log('[Test 9] Restart State:', restartState);
    if (restartState.state !== 'PLAYING' || restartState.playerZ !== 32 || restartState.objStep !== 1) {
      throw new Error('Mission restart did not reset game correctly');
    }

    // Check errors
    if (errors.length > 0) {
      console.error('❌ QA Test failed with errors:', errors);
      process.exit(1);
    }

    console.log('\n🎉 ALL QA TESTS PASSED WITH 0 ERRORS! FULL PLAYTHROUGH VERIFIED!');
    process.exit(0);

  } catch(e) {
    console.error('❌ QA Test failed:', e);
    process.exit(1);
  } finally {
    cleanup();
  }
}

testFullGame();
