/**
 * test_mission_02.js
 * Comprehensive automated QA test suite for Mission 02: Blackout
 * & Mission 01 regression test in Null Vector.
 */

const { spawn } = require('child_process');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runQA() {
  console.log('===============================================================');
  console.log('  NULL VECTOR — MISSION 02: BLACKOUT AUTOMATED QA SUITE');
  console.log('===============================================================');

  const browserPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9235;
  const browserProcess = spawn(browserPath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--disable-gpu',
    '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1280,720',
    'http://localhost:3000/'
  ]);

  const cleanup = () => {
    try { browserProcess.kill(); } catch (e) {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  await delay(2000);

  const targetsRes = await fetch(`http://localhost:${port}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.url && t.url.includes('localhost:3000'));
  if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
    throw new Error('Could not find Null Vector page target WebSocket URL');
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let idSeq = 1;
  const evalCode = (expr) => new Promise((resolve, reject) => {
    const curId = idSeq++;
    const handler = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === curId) {
        ws.removeEventListener('message', handler);
        if (d.error) reject(d.error);
        else if (d.result?.exceptionDetails) {
          console.error('[Browser Eval Exception]:', d.result.exceptionDetails.exception?.description || d.result.exceptionDetails.text);
          reject(new Error(d.result.exceptionDetails.exception?.description || d.result.exceptionDetails.text));
        } else {
          resolve(d.result.result ? d.result.result.value : undefined);
        }
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({
      id: curId,
      method: 'Runtime.evaluate',
      params: { expression: expr, returnByValue: true, awaitPromise: true }
    }));
  });

  ws.addEventListener('message', (e) => {
    const d = JSON.parse(e.data);
    if (d.method === 'Runtime.consoleAPICalled') {
      const text = d.params.args.map(a => a.value || JSON.stringify(a)).join(' ');
      console.log(`[Browser console]: ${text}`);
    }
  });

  await delay(1500);

  try {
    // 1. Initial State Check
    console.log('\n--- 1. Initial Engine & Main Menu Check ---');
    await evalCode(`
      document.getElementById('btn-loading-start')?.click();
    `);
    await delay(300);

    const initialMenu = await evalCode(`({
      gameState: window.nullVectorGame.state,
      mainMenuVisible: document.getElementById('main-menu').classList.contains('active'),
      crosshairDisplay: getComputedStyle(document.getElementById('crosshair-container')).display
    })`);
    console.log('Initial Menu State:', initialMenu);
    if (!initialMenu.mainMenuVisible) throw new Error('Main Menu not active after loading screen');

    // 2. Select Mission 02 (Blackout) and View Briefing
    console.log('\n--- 2. Mission Selection & Briefing ---');
    await evalCode(`
      document.getElementById('btn-mission-select').click();
    `);
    await delay(200);

    const missionSelectActive = await evalCode(`document.getElementById('mission-select-menu').classList.contains('active')`);
    console.log('Mission Select Menu Visible:', missionSelectActive);

    // Select Mission 02 Card
    await evalCode(`
      document.getElementById('card-mission-02').click();
      document.getElementById('btn-mission-select-deploy').click();
    `);
    await delay(300);

    const briefingState = await evalCode(`({
      briefingActive: document.getElementById('briefing-menu').classList.contains('active'),
      title: document.getElementById('briefing-mission-title').textContent,
      location: document.getElementById('briefing-loc').textContent,
      status: document.getElementById('briefing-status').textContent,
      power: document.getElementById('briefing-power').textContent
    })`);
    console.log('Briefing Modal State:', briefingState);
    if (!briefingState.briefingActive) throw new Error('Briefing menu did not open');
    if (!briefingState.title.includes('BLACKOUT')) throw new Error('Briefing title does not contain BLACKOUT');

    // 3. Launch Mission 02: Blackout
    console.log('\n--- 3. Launching Mission 02: Blackout ---');
    await evalCode(`
      document.getElementById('btn-briefing-launch').click();
    `);
    await delay(500);

    const m2World = await evalCode(`({
      activeMission: window.nullVectorGame.missionManager.activeMission.title,
      gameState: window.nullVectorGame.state,
      playerPos: window.nullVectorGame.player.position,
      collidersCount: window.nullVectorGame.colliders.length,
      powerState: window.nullVectorGame.level.powerManager.state,
      relaysCount: window.nullVectorGame.level.relays.length,
      enemiesCount: window.nullVectorGame.enemyManager.enemies.length,
      hudTitle: document.getElementById('hud-objective-title').textContent,
      hudObjText: document.getElementById('hud-objective-text').textContent
    })`);
    console.log('Mission 02 World Setup:', m2World);
    if (m2World.activeMission !== 'BLACKOUT') throw new Error('Active mission is not BLACKOUT');
    if (m2World.powerState !== 'OFF') throw new Error('Initial power state is not OFF');
    if (m2World.relaysCount < 3) throw new Error('Level02 relays missing');

    // 4. Flashlight Mechanic Test
    console.log('\n--- 4. Testing Flashlight Toggle [F] ---');
    const lightToggledOn = await evalCode(`
      window.nullVectorGame.flashlight.toggle();
      ({
        isOn: window.nullVectorGame.flashlight.isOn,
        spotVisible: window.nullVectorGame.flashlight.spotLight.visible,
        hudText: document.getElementById('hud-flashlight-indicator').textContent
      })
    `);
    console.log('Flashlight Toggle ON:', lightToggledOn);
    if (!lightToggledOn.isOn || !lightToggledOn.spotVisible) throw new Error('Flashlight did not turn on');

    // 5. Objective 01: Infiltrate Facility Entrance
    console.log('\n--- 5. Objective 01: Infiltrating Entrance ---');
    await evalCode(`
      window.nullVectorGame.player.position.set(0, 0, 34);
      window.nullVectorGame.objectiveManager.update(0.016);
    `);
    const stepAfterInfiltrate = await evalCode(`window.nullVectorGame.objectiveManager.currentStep`);
    console.log('Objective Step after infiltration:', stepAfterInfiltrate);
    if (stepAfterInfiltrate !== 2) throw new Error('Failed to advance to Step 2 (Restore Aux Power)');

    // 6. Power Relays Activation (Relay A, B, C)
    console.log('\n--- 6. Activating Power Relays A, B, C ---');
    // Activate Relay A (Maintenance Wing)
    await evalCode(`
      window.nullVectorGame.objectiveManager.onRelayActivated('A');
    `);
    const powerAfterA = await evalCode(`({
      powerState: window.nullVectorGame.level.powerManager.state,
      relaysActive: window.nullVectorGame.level.powerManager.getRelaysActiveCount(),
      objStep: window.nullVectorGame.objectiveManager.currentStep,
      hatchOpen: window.nullVectorGame.level.doors.find(d => d.id === 'entrance_hatch').isOpen
    })`);
    console.log('Power after Relay A:', powerAfterA);
    if (powerAfterA.powerState !== 'AUXILIARY') throw new Error('Power state did not transition to AUXILIARY');
    if (!powerAfterA.hatchOpen) throw new Error('Entrance hatch did not unlock');

    // Activate Relay B (Research Wing)
    await evalCode(`
      window.nullVectorGame.objectiveManager.onRelayActivated('B');
    `);
    const powerAfterB = await evalCode(`({
      powerState: window.nullVectorGame.level.powerManager.state,
      relaysActive: window.nullVectorGame.level.powerManager.getRelaysActiveCount()
    })`);
    console.log('Power after Relay B:', powerAfterB);
    if (powerAfterB.powerState !== 'PARTIAL') throw new Error('Power state did not transition to PARTIAL');

    // Activate Relay C (Server Archive)
    await evalCode(`
      window.nullVectorGame.objectiveManager.onRelayActivated('C');
    `);
    const powerAfterC = await evalCode(`({
      powerState: window.nullVectorGame.level.powerManager.state,
      relaysActive: window.nullVectorGame.level.powerManager.getRelaysActiveCount(),
      objStep: window.nullVectorGame.objectiveManager.currentStep,
      arenaDoorOpen: window.nullVectorGame.level.doors.find(d => d.id === 'arena_blast_door').isOpen
    })`);
    console.log('Power after Relay C:', powerAfterC);
    if (powerAfterC.powerState !== 'FULL') throw new Error('Power state did not transition to FULL');
    if (powerAfterC.objStep !== 4) throw new Error('Did not advance to Step 4 (Security Override)');

    // 7. Security Control Override
    console.log('\n--- 7. Overriding Security Lockdown in Control Room ---');
    await evalCode(`
      window.nullVectorGame.objectiveManager.onSecurityOverridden();
    `);
    const stepAfterSecurity = await evalCode(`window.nullVectorGame.objectiveManager.currentStep`);
    console.log('Objective Step after Security Override:', stepAfterSecurity);
    if (stepAfterSecurity !== 5) throw new Error('Did not advance to Step 5 (Recover Logs)');

    // 8. Incident Logs & Project Singularity
    console.log('\n--- 8. Accessing Incident Log Terminal (Project Singularity) ---');
    await evalCode(`
      window.nullVectorGame.uiManager.showIncidentLogModal();
      window.nullVectorGame.objectiveManager.onIncidentLogsRead();
    `);
    const terminalState = await evalCode(`({
      modalActive: document.getElementById('terminal-log-modal').classList.contains('active'),
      objStep: window.nullVectorGame.objectiveManager.currentStep,
      powerState: window.nullVectorGame.level.powerManager.state,
      isLockdownActive: window.nullVectorGame.objectiveManager.isLockdownActive,
      lockdownTimer: window.nullVectorGame.objectiveManager.lockdownTimer
    })`);
    console.log('Incident Log & Lockdown Trigger State:', terminalState);
    if (!terminalState.modalActive) throw new Error('Terminal Log Modal is not active');
    if (terminalState.powerState !== 'LOCKDOWN') throw new Error('Power state did not enter LOCKDOWN');
    if (terminalState.objStep !== 6) throw new Error('Did not advance to Step 6 (Survive Lockdown)');

    // Close terminal modal
    await evalCode(`
      document.getElementById('btn-terminal-close').click();
    `);

    // 9. Weapon Slot 5: VX-9 Viper SMG Test
    console.log('\n--- 9. Testing VX-9 Viper SMG ---');
    const viperTest = await evalCode(`
      window.nullVectorGame.weaponManager.equipSlot(5, true);
      const activeWp = window.nullVectorGame.weaponManager.activeWeapon;
      const viperMesh = window.nullVectorGame.weaponManager.weaponMeshes['viper'];
      
      // Fire Viper
      activeWp.fire();
      window.nullVectorGame.shootingSystem.fireWeapon(activeWp);

      ({
        activeId: activeWp.id,
        name: activeWp.name,
        slot: activeWp.slot,
        currentAmmo: activeWp.currentAmmo,
        magSize: activeWp.magSize,
        meshVisible: viperMesh.visible,
        hudWeaponName: document.getElementById('hud-weapon-name').textContent
      })
    `);
    console.log('VX-9 Viper Stats & Fire Test:', viperTest);
    if (viperTest.activeId !== 'viper') throw new Error('Active weapon is not viper');
    if (viperTest.slot !== 5) throw new Error('Viper slot is not 5');
    if (!viperTest.meshVisible) throw new Error('Viper 3D viewmodel is not visible');
    if (viperTest.currentAmmo !== 39) throw new Error('Viper did not decrement ammo on fire');

    // 10. Test Security Drone and Phantom Combat
    console.log('\n--- 10. Testing Security Drone and Phantom Entities ---');
    const enemyEntities = await evalCode(`({
      drones: window.nullVectorGame.enemyManager.enemies.filter(e => e.searchlight !== undefined).length,
      phantoms: window.nullVectorGame.enemyManager.enemies.filter(e => e.phantomState !== undefined).length,
      totalLiving: window.nullVectorGame.enemyManager.getLivingCount()
    })`);
    console.log('Enemies in Facility:', enemyEntities);
    if (enemyEntities.drones < 1) throw new Error('No Security Drones spawned');
    if (enemyEntities.phantoms < 1) throw new Error('No Phantoms spawned');

    // Damage a Phantom
    await evalCode(`
      const phantom = window.nullVectorGame.enemyManager.enemies.find(e => e.phantomState !== undefined);
      if (phantom) {
        phantom.takeDamage(70, phantom.position, true);
      }
    `);
    const phantomDead = await evalCode(`window.nullVectorGame.enemyManager.enemies.find(e => e.phantomState !== undefined).isDead`);
    console.log('Phantom Elimination Test:', phantomDead);
    if (!phantomDead) throw new Error('Phantom did not die after lethal headshot damage');

    // 11. Complete 45s Lockdown & Discover Central Systems Core
    console.log('\n--- 11. Surviving Lockdown & Central Systems Anomaly ---');
    await evalCode(`
      // Fast forward lockdown timer
      window.nullVectorGame.objectiveManager.lockdownTimer = 0.1;
      window.nullVectorGame.objectiveManager.update(0.2);
    `);
    const postLockdownStep = await evalCode(`window.nullVectorGame.objectiveManager.currentStep`);
    console.log('Step after 45s lockdown:', postLockdownStep);
    if (postLockdownStep !== 7) throw new Error('Did not advance to Step 7 (Investigate Core)');

    // Trigger Central Systems Discovery
    await evalCode(`
      window.nullVectorGame.player.position.set(8, 0, -36);
      window.nullVectorGame.objectiveManager.update(0.016);
    `);
    const evacState = await evalCode(`({
      objStep: window.nullVectorGame.objectiveManager.currentStep,
      isEvacActive: window.nullVectorGame.objectiveManager.isExtractionActive,
      evacTimer: window.nullVectorGame.objectiveManager.extractionTimer,
      powerState: window.nullVectorGame.level.powerManager.state
    })`);
    console.log('Extraction Evacuation Trigger State:', evacState);
    if (evacState.objStep !== 8) throw new Error('Did not advance to Step 8 (Evacuate)');
    if (!evacState.isEvacActive) throw new Error('Extraction countdown timer not active');
    if (evacState.powerState !== 'CRITICAL') throw new Error('Power state not CRITICAL during evacuation');

    // 12. Complete Mission 02 Extraction & Victory Screen
    console.log('\n--- 12. Reaching Extraction LZ & Mission 02 Victory ---');
    await evalCode(`
      window.nullVectorGame.player.position.set(8, 0, -60);
      window.nullVectorGame.objectiveManager.update(0.016);
    `);
    await delay(300);

    const m2Victory = await evalCode(`({
      gameState: window.nullVectorGame.state,
      victoryActive: document.getElementById('victory-menu').classList.contains('active'),
      vicSubtitle: document.getElementById('victory-subtitle').textContent,
      singularityCardVisible: getComputedStyle(document.getElementById('vic-singularity-card')).display !== 'none',
      singularityText: document.getElementById('vic-singularity-card').textContent
    })`);
    console.log('Mission 02 Victory & "TO BE CONTINUED" Screen:', m2Victory);
    if (m2Victory.gameState !== 'VICTORY') throw new Error('Game state did not transition to VICTORY');
    if (!m2Victory.singularityCardVisible) throw new Error('Project Singularity / TO BE CONTINUED card is not visible');
    if (!m2Victory.singularityText.includes('TO BE CONTINUED')) throw new Error('Card does not include TO BE CONTINUED');

    // 13. Mission 01 Regression Test
    console.log('\n===============================================================');
    console.log('  REGRESSION TEST — MISSION 01: OPERATION: BLACKSITE');
    console.log('===============================================================');
    await evalCode(`
      document.getElementById('btn-vic-menu').click();
    `);
    await delay(300);

    // Select Mission 01
    await evalCode(`
      document.getElementById('btn-mission-select').click();
    `);
    await delay(200);
    await evalCode(`
      document.getElementById('card-mission-01').click();
      document.getElementById('btn-mission-select-deploy').click();
    `);
    await delay(200);
    await evalCode(`
      document.getElementById('btn-briefing-launch').click();
    `);
    await delay(500);

    const m1Setup = await evalCode(`({
      missionTitle: window.nullVectorGame.missionManager.activeMission.title,
      gameState: window.nullVectorGame.state,
      playerPos: window.nullVectorGame.player.position,
      collidersCount: window.nullVectorGame.colliders.length,
      objStep: window.nullVectorGame.objectiveManager.currentStep
    })`);
    console.log('Mission 01 Regression Setup:', m1Setup);
    if (m1Setup.missionTitle !== 'OPERATION: BLACKSITE') throw new Error('Active mission is not OPERATION: BLACKSITE');
    if (m1Setup.objStep !== 1) throw new Error('Mission 01 initial step is not 1');

    // Fast play through Mission 01
    console.log('Playing through Mission 01: Airlock -> Cargo -> Hack -> Lockdown -> Extraction...');
    await evalCode(`
      // 1. Airlock
      window.nullVectorGame.player.position.set(0, 0, 20);
      window.nullVectorGame.objectiveManager.update(0.016);
      
      // 2. Cargo Bay (kill 3)
      window.nullVectorGame.objectiveManager.onEnemyKilled({});
      window.nullVectorGame.objectiveManager.onEnemyKilled({});
      window.nullVectorGame.objectiveManager.onEnemyKilled({});
      
      // 3. Hack terminal
      window.nullVectorGame.objectiveManager.onTerminalHacked();
      
      // 4. Lockdown countdown
      window.nullVectorGame.objectiveManager.lockdownTimer = 0.1;
      window.nullVectorGame.objectiveManager.update(0.2);
      
      // 5. Extraction
      window.nullVectorGame.player.position.set(0, 0, -50);
      window.nullVectorGame.objectiveManager.update(0.016);
    `);
    await delay(300);

    const m1Victory = await evalCode(`({
      gameState: window.nullVectorGame.state,
      vicSubtitle: document.getElementById('victory-subtitle').textContent,
      singularityCardVisible: getComputedStyle(document.getElementById('vic-singularity-card')).display !== 'none'
    })`);
    console.log('Mission 01 Victory State:', m1Victory);
    if (m1Victory.gameState !== 'VICTORY') throw new Error('Mission 01 failed to reach VICTORY');
    if (m1Victory.singularityCardVisible) throw new Error('Singularity card should NOT be visible in Mission 01');

    console.log('\n===============================================================');
    console.log('  🎉 ALL MISSION 02 & MISSION 01 REGRESSION TESTS PASSED! 100%');
    console.log('===============================================================');

  } finally {
    ws.close();
    cleanup();
  }
}

runQA().catch(err => {
  console.error('\n❌ QA TEST FAILED:', err);
  process.exit(1);
});
