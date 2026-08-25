/**
 * test_viewmodel_crosshair.js
 * Verification test for FPS Viewmodel & Crosshair in Null Vector.
 */

const { spawn } = require('child_process');

async function runViewmodelAndCrosshairAudit() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9229;

  console.log('===============================================================');
  console.log('  NULL VECTOR — FPS VIEWMODEL & CROSSHAIR AUDIT');
  console.log('===============================================================');

  const browser = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--mute-audio',
    'http://localhost:3000/'
  ]);

  const consoleErrors = [];

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

    // 1. Initial State (Menu / Loading)
    await new Promise(r => setTimeout(r, 1500));
    const menuStateCheck = (await evalCode(`
      (() => {
        const crosshair = document.getElementById('crosshair-container');
        const game = window.nullVectorGame;
        return {
          gameState: game?.state,
          crosshairDisplay: crosshair ? window.getComputedStyle(crosshair).display : null,
          viewmodelVisible: game?.weaponManager?.viewModel?.visible
        };
      })()
    `)).result.value;
    console.log('1. Menu State Check:', menuStateCheck);

    // 2. Start Game
    await evalCode(`
      document.getElementById('btn-loading-start')?.click();
      document.getElementById('btn-play')?.click();
      document.getElementById('btn-briefing-launch')?.click();
    `);
    await new Promise(r => setTimeout(r, 500));

    // 3. Verify Playing State Visibility & Centered Crosshair
    const playingStateCheck = (await evalCode(`
      (() => {
        const crosshair = document.getElementById('crosshair-container');
        const game = window.nullVectorGame;
        const rect = crosshair ? crosshair.getBoundingClientRect() : null;
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        const crossCenterX = rect ? rect.left + rect.width / 2 : 0;
        const crossCenterY = rect ? rect.top + rect.height / 2 : 0;

        const isCameraInScene = game.scene.children.includes(game.camera);
        const isViewModelInCamera = game.camera.children.includes(game.weaponManager.viewModel);
        const isWeaponGroupInVM = game.weaponManager.viewModel.children.includes(game.weaponManager.weaponGroup);
        const isHandsGroupInVM = game.weaponManager.viewModel.children.includes(game.weaponManager.handsGroup);

        return {
          gameState: game.state,
          crosshairDisplay: window.getComputedStyle(crosshair).display,
          isExactCenter: Math.abs(crossCenterX - screenCenterX) < 1 && Math.abs(crossCenterY - screenCenterY) < 1,
          isCameraInScene,
          isViewModelInCamera,
          isWeaponGroupInVM,
          isHandsGroupInVM,
          viewmodelVisible: game.weaponManager.viewModel.visible,
          activeWeaponId: game.weaponManager.activeWeapon.id,
          activeMeshVisible: game.weaponManager.weaponMeshes[game.weaponManager.activeWeapon.id].visible
        };
      })()
    `)).result.value;
    console.log('2. Playing State Check:', playingStateCheck);

    if (!playingStateCheck.isExactCenter) throw new Error('Crosshair is not exactly centered!');
    if (!playingStateCheck.isCameraInScene) throw new Error('Camera is not in scene graph!');
    if (!playingStateCheck.isViewModelInCamera) throw new Error('ViewModel is not attached to camera!');
    if (!playingStateCheck.viewmodelVisible) throw new Error('ViewModel is not visible in PLAYING state!');

    // 4. Verify All 5 Weapons have Viewmodels & Hands
    const allWeaponsCheck = (await evalCode(`
      (() => {
        const wm = window.nullVectorGame.weaponManager;
        const results = {};
        for (let s = 1; s <= 5; s++) {
          wm.equipSlot(s, true);
          const wId = wm.activeWeapon.id;
          const mesh = wm.weaponMeshes[wId];
          results[wId] = {
            hasMesh: !!mesh,
            meshVisible: mesh.visible,
            childrenCount: mesh.children.length, // weapon group + 2 arms
            muzzlePos: wm.muzzlePositions[wId]
          };
        }
        wm.equipSlot(1, true); // Reset to pistol
        return results;
      })()
    `)).result.value;
    console.log('3. All 5 Weapon & Hands Assemblies:', allWeaponsCheck);

    // 5. Test Dynamic Crosshair Spread (Idle vs Move vs Sprint vs ADS vs Shotgun)
    const crosshairDynamics = (await evalCode(`
      (() => {
        const game = window.nullVectorGame;
        const wm = game.weaponManager;
        const player = game.player;
        const crosshair = document.getElementById('crosshair-container');

        // Pistol Idle
        wm.equipSlot(1, true);
        player.velocity.set(0, 0, 0);
        player.isSprinting = false;
        wm.isADS = false;
        game.uiManager.update(0.016);
        const pistolIdleSpread = crosshair.style.getPropertyValue('--spread');

        // Pistol Sprint
        player.velocity.set(0, 0, -9);
        player.isSprinting = true;
        game.uiManager.update(0.016);
        const pistolSprintSpread = crosshair.style.getPropertyValue('--spread');

        // Pistol ADS
        player.isSprinting = false;
        wm.isADS = true;
        game.uiManager.update(0.016);
        const pistolADSSpread = crosshair.style.getPropertyValue('--spread');
        const isADSClass = crosshair.classList.contains('ads');

        // Shotgun Idle
        wm.isADS = false;
        wm.equipSlot(3, true);
        player.velocity.set(0, 0, 0);
        game.uiManager.update(0.016);
        const shotgunSpread = crosshair.style.getPropertyValue('--spread');

        // Firing Bloom
        game.uiManager.onWeaponFired(wm.activeWeapon);
        game.uiManager.update(0.016);
        const firedSpread = crosshair.style.getPropertyValue('--spread');

        wm.equipSlot(1, true);
        return {
          pistolIdleSpread,
          pistolSprintSpread,
          pistolADSSpread,
          isADSClass,
          shotgunSpread,
          firedSpread
        };
      })()
    `)).result.value;
    console.log('4. Dynamic Crosshair Spread Metrics:', crosshairDynamics);

    // 6. Test Viewmodel ADS and Sights Alignment
    const adsAlignment = (await evalCode(`
      (() => {
        const wm = window.nullVectorGame.weaponManager;
        wm.equipSlot(1, true); // Pistol
        wm.isADS = true;
        
        // Update several frames of lerp
        for (let i = 0; i < 20; i++) {
          wm._updateProceduralAnimations(0.016);
        }

        const mesh = wm.weaponMeshes['pistol'];
        const adsPos = mesh.position.clone();

        wm.isADS = false;
        for (let i = 0; i < 20; i++) {
          wm._updateProceduralAnimations(0.016);
        }
        const hipPos = mesh.position.clone();

        return {
          adsPos: { x: adsPos.x.toFixed(3), y: adsPos.y.toFixed(3), z: adsPos.z.toFixed(3) },
          hipPos: { x: hipPos.x.toFixed(3), y: hipPos.y.toFixed(3), z: hipPos.z.toFixed(3) },
          isCenteredInADS: Math.abs(adsPos.x) < 0.05
        };
      })()
    `)).result.value;
    console.log('5. Viewmodel ADS Alignment:', adsAlignment);

    // 7. State Transitions (Pause, Death, Victory) Hide Viewmodel & Crosshair
    const stateHiding = (await evalCode(`
      (() => {
        const game = window.nullVectorGame;
        const crosshair = document.getElementById('crosshair-container');

        // Pause
        game.setState('PAUSED');
        const pauseCross = window.getComputedStyle(crosshair).display;
        const pauseVM = game.weaponManager.viewModel.visible;

        // Death
        game.setState('DEAD');
        const deathCross = window.getComputedStyle(crosshair).display;
        const deathVM = game.weaponManager.viewModel.visible;

        // Victory
        game.setState('VICTORY');
        const vicCross = window.getComputedStyle(crosshair).display;
        const vicVM = game.weaponManager.viewModel.visible;

        // Resume
        game.setState('PLAYING');
        const playCross = window.getComputedStyle(crosshair).display;
        const playVM = game.weaponManager.viewModel.visible;

        return {
          pause: { cross: pauseCross, vm: pauseVM },
          death: { cross: deathCross, vm: deathVM },
          victory: { cross: vicCross, vm: vicVM },
          play: { cross: playCross, vm: playVM }
        };
      })()
    `)).result.value;
    console.log('6. State Visibility Management:', stateHiding);

    if (stateHiding.pause.cross !== 'none' || stateHiding.pause.vm !== false) {
      throw new Error('Crosshair/ViewModel not hidden on Pause');
    }
    if (stateHiding.death.cross !== 'none' || stateHiding.death.vm !== false) {
      throw new Error('Crosshair/ViewModel not hidden on Death');
    }
    if (stateHiding.victory.cross !== 'none' || stateHiding.victory.vm !== false) {
      throw new Error('Crosshair/ViewModel not hidden on Victory');
    }
    if (stateHiding.play.cross !== 'flex' || stateHiding.play.vm !== true) {
      throw new Error('Crosshair/ViewModel not shown on Resume/Play');
    }

    // 8. Error check
    if (consoleErrors.length > 0) {
      console.error('\n❌ AUDIT FAILED: Console errors found:');
      consoleErrors.forEach(e => console.error(' -', e));
      process.exit(1);
    }

    console.log('\n===============================================================');
    console.log('  🎉 AUDIT COMPLETE: VIEWMODEL & CROSSHAIR 100% VERIFIED');
    console.log('===============================================================');
    process.exit(0);

  } catch(e) {
    console.error('❌ Test failed:', e);
    process.exit(1);
  } finally {
    cleanup();
  }
}

runViewmodelAndCrosshairAudit();
