const { spawn } = require('child_process');

async function testShooting() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9226;

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

    // Align player directly facing target dummy (dummy is at 0, 0, 0; player is at 0, 0, 8, looking along -Z)
    await evalCode(`
      window.nullVectorGame.player.position.set(0, 0, 6);
      window.nullVectorGame.player.yaw = 0;
      window.nullVectorGame.player.pitch = 0;
    `);

    // Verify initial weapon
    const weaponState1 = (await evalCode(`({
      name: window.nullVectorGame.weaponManager.activeWeapon.name,
      ammo: window.nullVectorGame.weaponManager.activeWeapon.currentAmmo,
      reserve: window.nullVectorGame.weaponManager.activeWeapon.reserveAmmo
    })`)).result.value;
    console.log('[Test] Initial Weapon State:', weaponState1);

    // Simulate firing pistol at target dummy
    await evalCode(`
      window.nullVectorGame.input.mouseButtonsJustPressed[0] = true;
      window.nullVectorGame.weaponManager.update(0.016);
    `);

    const weaponStateAfterFire = (await evalCode(`({
      ammo: window.nullVectorGame.weaponManager.activeWeapon.currentAmmo,
      shotsFired: window.nullVectorGame.stats.shotsFired,
      shotsHit: window.nullVectorGame.stats.shotsHit
    })`)).result.value;
    console.log('[Test] After Shot:', weaponStateAfterFire);

    if (weaponStateAfterFire.ammo !== weaponState1.ammo - 1) {
      throw new Error('Ammo was not decremented properly');
    }
    if (weaponStateAfterFire.shotsHit < 1) {
      throw new Error('Raycast shot did not hit target dummy');
    }
    console.log('✅ Pistol shooting and hit detection verified!');

    // Test Reload
    await evalCode(`
      window.nullVectorGame.input.keysJustPressed["KeyR"] = true;
      window.nullVectorGame.weaponManager.update(0.016);
    `);
    const reloadingState = (await evalCode(`window.nullVectorGame.weaponManager.activeWeapon.isReloading`)).result.value;
    console.log('[Test] Is Reloading:', reloadingState);
    if (!reloadingState) throw new Error('Reloading did not trigger');

    // Fast-forward reload
    await evalCode(`
      window.nullVectorGame.weaponManager.activeWeapon.update(2.0);
      window.nullVectorGame.uiManager.updateHUD();
    `);
    const reloadedState = (await evalCode(`({
      ammo: window.nullVectorGame.weaponManager.activeWeapon.currentAmmo,
      isReloading: window.nullVectorGame.weaponManager.activeWeapon.isReloading
    })`)).result.value;
    console.log('[Test] After Reload:', reloadedState);
    if (reloadedState.ammo !== 12 || reloadedState.isReloading) throw new Error('Reload failed to complete');
    console.log('✅ Reload mechanics verified!');

    // Test Weapon Switching (Slot 2 AR, Slot 3 Shotgun, Slot 4 Plasma)
    for (let slot = 2; slot <= 4; slot++) {
      await evalCode(`
        window.nullVectorGame.weaponManager.equipSlot(${slot});
      `);
      const slotState = (await evalCode(`({
        slot: window.nullVectorGame.weaponManager.activeSlot,
        name: window.nullVectorGame.weaponManager.activeWeapon.name,
        damage: window.nullVectorGame.weaponManager.activeWeapon.damage
      })`)).result.value;
      console.log(`[Test] Switched to Slot ${slot}:`, slotState);
      if (slotState.slot !== slot) throw new Error(`Failed to switch to slot ${slot}`);
    }
    console.log('✅ Complete weapon inventory & switching verified!');

    process.exit(0);

  } catch(e) {
    console.error('❌ Test failed:', e);
    process.exit(1);
  } finally {
    browser.kill();
  }
}

testShooting();
