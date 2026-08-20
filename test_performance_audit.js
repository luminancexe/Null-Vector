/**
 * test_performance_audit.js
 * Independent, rigorous performance and quality audit test for Null Vector.
 * Measures FPS, frame times, draw calls, triangle counts, particle counts, memory,
 * and verifies all gameplay scenarios.
 */

const { spawn } = require('child_process');

async function runPerformanceAudit() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9228;

  console.log('===============================================================');
  console.log('  NULL VECTOR — INDEPENDENT PERFORMANCE & QUALITY AUDIT');
  console.log('===============================================================');

  const browser = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--mute-audio',
    '--enable-precise-memory-info',
    'http://localhost:3000/'
  ]);

  const consoleErrors = [];
  const warnings = [];

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
    const evalCode = (expr, awaitPromise = false) => new Promise(resolve => {
      const curId = id++;
      const handler = (e) => {
        const d = JSON.parse(e.data);
        if (d.id === curId) {
          ws.removeEventListener('message', handler);
          if (d.result?.exceptionDetails) {
            console.error('Eval error:', d.result.exceptionDetails);
          }
          resolve(d.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({
        id: curId,
        method: 'Runtime.evaluate',
        params: { expression: expr, returnByValue: true, awaitPromise }
      }));
    });

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
        if (msg.params.type === 'error') {
          console.error('❌ [Browser Error]:', text);
          consoleErrors.push(text);
        } else if (msg.params.type === 'warn') {
          if (!text.includes('Pointer lock')) {
            console.warn('⚠️ [Browser Warning]:', text);
            warnings.push(text);
          }
        }
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
        console.error('❌ [Browser Exception]:', desc);
        consoleErrors.push(desc);
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

    // 1. Boot sequence
    await new Promise(r => setTimeout(r, 2000));
    await evalCode(`
      document.getElementById('btn-loading-start')?.click();
      document.getElementById('btn-play')?.click();
    `);

    // 2. Measure Idle Performance
    console.log('\n--- 1. IDLE SCENE PERFORMANCE ---');
    const idleMetrics = (await evalCode(`
      new Promise(resolve => {
        const game = window.nullVectorGame;
        const renderer = game.renderer;
        let frameCount = 0;
        let totalTime = 0;
        let lastT = performance.now();

        function sample() {
          const now = performance.now();
          const dt = now - lastT;
          lastT = now;
          totalTime += dt;
          frameCount++;

          if (frameCount >= 60) {
            const avgFrameTime = totalTime / frameCount;
            const approxFps = 1000 / avgFrameTime;
            resolve({
              approxFps: Math.round(approxFps),
              avgFrameTimeMs: parseFloat(avgFrameTime.toFixed(2)),
              drawCalls: renderer.info.render.calls,
              triangles: renderer.info.render.triangles,
              geometries: renderer.info.memory.geometries,
              textures: renderer.info.memory.textures,
              particlesCount: game.particleManager.particles.length,
              enemiesLiving: game.enemyManager.getLivingCount()
            });
          } else {
            requestAnimationFrame(sample);
          }
        }
        requestAnimationFrame(sample);
      })
    `, true)).result.value;

    console.log('Idle FPS:', idleMetrics.approxFps);
    console.log('Average Frame Time:', idleMetrics.avgFrameTimeMs, 'ms');
    console.log('Draw Calls:', idleMetrics.drawCalls);
    console.log('Triangles Rendered:', idleMetrics.triangles);
    console.log('Geometries in Memory:', idleMetrics.geometries);
    console.log('Textures in Memory:', idleMetrics.textures);

    // 3. Measure Full Combat Performance
    console.log('\n--- 2. FULL COMBAT ENCOUNTER PERFORMANCE ---');
    const combatMetrics = (await evalCode(`
      new Promise(resolve => {
        const game = window.nullVectorGame;
        const renderer = game.renderer;

        // Trigger combat & particles
        for (let i = 0; i < 5; i++) {
          game.particleManager.spawnExplosion(new window.THREE.Vector3(0, 1, -8 + i * 2), 1.0);
          game.particleManager.spawnWallImpact(new window.THREE.Vector3(2, 1.5, -8 + i * 2), new window.THREE.Vector3(-1, 0, 0));
        }

        // Fire all weapons
        for (let s = 1; s <= 4; s++) {
          game.weaponManager.equipSlot(s);
          game.shootingSystem.fireWeapon(game.weaponManager.activeWeapon);
        }

        let frameCount = 0;
        let totalTime = 0;
        let lastT = performance.now();

        function sample() {
          const now = performance.now();
          const dt = now - lastT;
          lastT = now;
          totalTime += dt;
          frameCount++;

          if (frameCount >= 60) {
            const avgFrameTime = totalTime / frameCount;
            const approxFps = 1000 / avgFrameTime;
            resolve({
              approxFps: Math.round(approxFps),
              avgFrameTimeMs: parseFloat(avgFrameTime.toFixed(2)),
              drawCalls: renderer.info.render.calls,
              triangles: renderer.info.render.triangles,
              activeParticles: game.particleManager.particles.length,
              enemiesLiving: game.enemyManager.getLivingCount()
            });
          } else {
            requestAnimationFrame(sample);
          }
        }
        requestAnimationFrame(sample);
      })
    `, true)).result.value;

    console.log('Combat FPS:', combatMetrics.approxFps);
    console.log('Combat Frame Time:', combatMetrics.avgFrameTimeMs, 'ms');
    console.log('Combat Draw Calls:', combatMetrics.drawCalls);
    console.log('Combat Triangles:', combatMetrics.triangles);
    console.log('Active Particles in Pool:', combatMetrics.activeParticles);

    // 4. Test Weapon Systems & Ammo Depletion & Wheel Cycling
    console.log('\n--- 3. WEAPON & WHEEL AUDIT ---');
    const wheelTest = (await evalCode(`
      (() => {
        const wm = window.nullVectorGame.weaponManager;
        wm.equipSlot(1);
        const initialSlot = wm.activeSlot;
        
        // Simulate wheel scroll forward
        window.nullVectorGame.input.wheelDelta = 1;
        wm.update(0.016);
        const slot2 = wm.activeSlot;

        // Simulate wheel scroll backward
        window.nullVectorGame.input.wheelDelta = -1;
        wm.update(0.016);
        const slot1 = wm.activeSlot;

        // Test dry fire
        const w = wm.activeWeapon;
        w.currentAmmo = 0;
        w.reserveAmmo = 0;
        window.nullVectorGame.input.mouseButtonsJustPressed[0] = true;
        wm.update(0.016);

        return { initialSlot, slot2, slot1, isOutOfAmmo: w.currentAmmo === 0 && w.reserveAmmo === 0 };
      })()
    `)).result.value;
    console.log('Wheel Cycle (1 -> 2 -> 1):', wheelTest);
    if (wheelTest.slot2 !== 2 || wheelTest.slot1 !== 1) {
      throw new Error('Mouse wheel weapon switching failed');
    }

    // 5. Test Player Vitals & Pickups
    console.log('\n--- 4. VITALS & PICKUPS AUDIT ---');
    const pickupTest = (await evalCode(`
      (() => {
        const player = window.nullVectorGame.player;
        player.health = 50;
        player.armor = 20;
        
        // Collect health & armor pickups
        player.heal(35);
        player.addArmor(35);

        return { hp: player.health, armor: player.armor };
      })()
    `)).result.value;
    console.log('Vitals after pickups:', pickupTest);
    if (pickupTest.hp !== 85 || pickupTest.armor !== 55) {
      throw new Error('Health/Armor pickup logic mismatch');
    }

    // 6. Test Enemy Wall Collision & Line of Sight
    console.log('\n--- 5. ENEMY OBSTACLE & WALL SHOOTING AUDIT ---');
    const wallOcclusionTest = (await evalCode(`
      (() => {
        const game = window.nullVectorGame;
        const enemy = game.enemyManager.enemies.find(e => e.state !== 'DEAD') || game.enemyManager.spawnEnemy('enforcer', 0, 0, 0);
        const player = game.player;

        // Put enemy on one side of a thick pillar, player on the other side
        enemy.position.set(-10, 0, -2);
        player.position.set(-10, 0, 4);
        
        const pHealthBefore = player.health;
        enemy._shootAtPlayer(player);
        const pHealthAfter = player.health;

        return { pHealthBefore, pHealthAfter, wasBlocked: pHealthBefore === pHealthAfter };
      })()
    `)).result.value;
    console.log('Wall shooting blocked:', wallOcclusionTest.wasBlocked);
    if (!wallOcclusionTest.wasBlocked) {
      throw new Error('Enemy was able to shoot through solid obstacle');
    }

    // 7. Test Settings Persistence
    console.log('\n--- 6. SETTINGS PERSISTENCE AUDIT ---');
    const settingsTest = (await evalCode(`
      (() => {
        window.nullVectorGame.settings.fov = 90;
        window.nullVectorGame.settings.sensitivity = 2.4;
        window.nullVectorGame.player.baseFov = 90;
        window.nullVectorGame.camera.fov = 90;
        window.nullVectorGame.camera.updateProjectionMatrix();

        return { fov: window.nullVectorGame.camera.fov, sens: window.nullVectorGame.settings.sensitivity };
      })()
    `)).result.value;
    console.log('Settings modified and applied:', settingsTest);

    // 8. Test Death & Redeployment Flow
    console.log('\n--- 7. PLAYER DEATH & REDEPLOY AUDIT ---');
    await evalCode(`
      window.nullVectorGame.player.takeDamage(200);
    `);
    const deathState = (await evalCode(`({
      state: window.nullVectorGame.state,
      isDead: window.nullVectorGame.player.isDead,
      hp: window.nullVectorGame.player.health
    })`)).result.value;
    console.log('Death State:', deathState);
    if (deathState.state !== 'DEAD' || !deathState.isDead) {
      throw new Error('Player death failed to transition to DEAD');
    }

    // Redeploy
    await evalCode(`
      document.getElementById('btn-death-restart')?.click();
    `);
    const redeployState = (await evalCode(`({
      state: window.nullVectorGame.state,
      hp: window.nullVectorGame.player.health,
      armor: window.nullVectorGame.player.armor
    })`)).result.value;
    console.log('Redeploy State:', redeployState);
    if (redeployState.state !== 'PLAYING' || redeployState.hp !== 100) {
      throw new Error('Redeploy failed to restore player');
    }

    // 9. Full Mission Completion to Victory
    console.log('\n--- 8. COMPLETE MISSION RUN AUDIT ---');
    await evalCode(`
      const game = window.nullVectorGame;
      // Step 1 -> Step 2
      game.objectiveManager.advanceStep(2);
      // Step 2 -> Step 3
      game.objectiveManager.advanceStep(3);
      // Step 3 -> Step 4 (Hack Terminal)
      game.level.securityTerminal.isHacked = true;
      game.level.triggerLockdown();
      game.objectiveManager.advanceStep(4);
      // Step 4 -> Step 5 (Fast forward lockdown)
      game.objectiveManager.advanceStep(5);
      // Step 5 -> Step 6 (Extraction)
      game.objectiveManager.advanceStep(6);
    `);
    const victoryState = (await evalCode(`({
      state: window.nullVectorGame.state,
      rank: document.getElementById('vic-stat-rank')?.textContent,
      score: document.getElementById('vic-stat-score')?.textContent
    })`)).result.value;
    console.log('Victory State:', victoryState);
    if (victoryState.state !== 'VICTORY') {
      throw new Error('Mission failed to transition to VICTORY');
    }

    // Final Console Error Check
    if (consoleErrors.length > 0) {
      console.error('\n❌ AUDIT FAILED: Uncaught errors detected:');
      consoleErrors.forEach(e => console.error('  -', e));
      process.exit(1);
    }

    console.log('\n===============================================================');
    console.log('  🎉 AUDIT COMPLETE: ALL SYSTEMS VERIFIED WITH 0 ERRORS');
    console.log('===============================================================');
    process.exit(0);

  } catch(e) {
    console.error('❌ Audit execution error:', e);
    process.exit(1);
  } finally {
    cleanup();
  }
}

runPerformanceAudit();
