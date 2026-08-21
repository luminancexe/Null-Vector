/**
 * WeaponManager.js
 * First-person presentation system with procedural 3D weapons, tactical cybernetic hands/arms,
 * weapon switching animations, dynamic recoil, weapon sway, and ADS sight alignment.
 */

import * as THREE from 'three';
import { Weapon, WEAPON_PRESETS } from './Weapon.js';

export class WeaponManager {
  constructor(game) {
    this.game = game;
    this.camera = game.camera;
    this.input = game.input;

    // Viewmodel Root Container attached to camera
    this.viewModel = new THREE.Group();
    this.weaponGroup = new THREE.Group();
    this.handsGroup = new THREE.Group();

    this.viewModel.add(this.weaponGroup);
    this.viewModel.add(this.handsGroup);
    this.camera.add(this.viewModel);

    // Weapon Inventory
    this.weapons = {};
    this.activeWeapon = null;
    this.activeSlot = 1;

    // Viewmodel Meshes & Hands keyed by weapon id
    this.weaponMeshes = {};
    this.handMeshes = {};
    this.muzzlePositions = {};

    // Muzzle Flash Light & Mesh
    this.muzzleLight = null;
    this.muzzleFlashMesh = null;
    this.muzzleFlashTimer = 0;

    // Procedural Animation State
    this.swayPos = new THREE.Vector3();
    this.swayRot = new THREE.Euler(0, 0, 0, 'YXZ');
    this.recoilOffset = new THREE.Vector3();
    this.recoilRot = new THREE.Euler(0, 0, 0, 'YXZ');
    
    // Weapon switching animation
    this.isSwitching = false;
    this.switchProgress = 0;
    this.pendingSlot = null;

    // Base Viewmodel Offsets (Hip & ADS)
    this.hipOffset = new THREE.Vector3(0.18, -0.17, -0.38);
    this.adsOffset = new THREE.Vector3(0.0, -0.118, -0.28);
    this.currentOffset = this.hipOffset.clone();

    this.isADS = false;

    this._initMuzzleEffects();
    this._initWeaponsAndHands();
  }

  showViewmodel(visible) {
    if (this.viewModel) {
      this.viewModel.visible = !!visible;
    }
  }

  _initMuzzleEffects() {
    // Dynamic point light for muzzle flare
    this.muzzleLight = new THREE.PointLight(0x00f0ff, 0, 10);
    this.viewModel.add(this.muzzleLight);

    // Muzzle flash cross sprite
    const flashGeo = new THREE.PlaneGeometry(0.22, 0.22);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.viewModel.add(this.muzzleFlashMesh);
  }

  _createSharedMaterials() {
    return {
      darkMetal: new THREE.MeshStandardMaterial({ color: 0x151922, roughness: 0.35, metalness: 0.85 }),
      gunMetal: new THREE.MeshStandardMaterial({ color: 0x2b3340, roughness: 0.45, metalness: 0.75 }),
      gripMat: new THREE.MeshStandardMaterial({ color: 0x0a0d12, roughness: 0.85, metalness: 0.1 }),
      cyanGlow: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
      greenGlow: new THREE.MeshBasicMaterial({ color: 0x00ff88 }),
      amberGlow: new THREE.MeshBasicMaterial({ color: 0xffaa00 }),
      
      // Cybernetic Tactical Hands & Arms
      sleeveMat: new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.7, metalness: 0.2 }),
      gloveMat: new THREE.MeshStandardMaterial({ color: 0x0b0e14, roughness: 0.45, metalness: 0.4 }),
      armorPlateMat: new THREE.MeshStandardMaterial({ color: 0x253040, roughness: 0.3, metalness: 0.8 }),
      jointMat: new THREE.MeshStandardMaterial({ color: 0x080a0f, roughness: 0.9, metalness: 0.1 })
    };
  }

  _initWeaponsAndHands() {
    // Register presets
    this.weapons[1] = new Weapon(WEAPON_PRESETS.pistol);
    this.weapons[2] = new Weapon(WEAPON_PRESETS.rifle);
    this.weapons[3] = new Weapon(WEAPON_PRESETS.shotgun);
    this.weapons[4] = new Weapon(WEAPON_PRESETS.plasma);
    this.weapons[5] = new Weapon(WEAPON_PRESETS.viper);

    const mats = this._createSharedMaterials();

    // 1. Pistol (P19 Tactical) + Hands
    this._buildPistol(mats);

    // 2. Assault Rifle (AR-44 Vector) + Hands
    this._buildRifle(mats);

    // 3. Shotgun (SG-12 Breacher) + Hands
    this._buildShotgun(mats);

    // 4. Plasma Rifle (PR-9) + Hands
    this._buildPlasma(mats);

    // 5. VX-9 Viper SMG + Hands
    this._buildViper(mats);

    // Hook reload callbacks
    Object.values(this.weapons).forEach(w => {
      w.onReloadStartCallback = () => {
        if (this.game.audioManager) this.game.audioManager.playReload(w.id);
      };
      w.onReloadCompleteCallback = () => {
        if (this.game.uiManager) this.game.uiManager.updateHUD();
      };
    });

    // Equip initial weapon
    this.equipSlot(1, true);
  }

  /* ==========================================================================
     PROCEDURAL ARM & HAND BUILDER
     ========================================================================== */

  _createArm(mats, isLeft = false) {
    const arm = new THREE.Group();

    // Forearm
    const forearmGeo = new THREE.CylinderGeometry(0.042, 0.052, 0.42, 10);
    const forearm = new THREE.Mesh(forearmGeo, mats.sleeveMat);
    forearm.rotation.x = Math.PI / 2.8;
    forearm.position.set(0, -0.12, 0.18);
    arm.add(forearm);

    // Forearm armor plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.02, 0.22), mats.armorPlateMat);
    plate.position.set(0, -0.06, 0.18);
    plate.rotation.x = Math.PI / 2.8;
    arm.add(plate);

    // Wrist cuff
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.07, 10), mats.gloveMat);
    cuff.rotation.x = Math.PI / 2.8;
    cuff.position.set(0, -0.03, 0.05);
    arm.add(cuff);

    // Wrist neon trim
    const trim = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.012, 10), mats.cyanGlow);
    trim.rotation.x = Math.PI / 2.8;
    trim.position.set(0, -0.03, 0.05);
    arm.add(trim);

    // Hand palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.045, 0.075), mats.gloveMat);
    palm.position.set(0, 0, 0);
    arm.add(palm);

    // Knuckle guard
    const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.018, 0.03), mats.armorPlateMat);
    knuckles.position.set(0, 0.02, -0.02);
    arm.add(knuckles);

    // Fingers curled
    for (let f = 0; f < 4; f++) {
      const finger = new THREE.Mesh(new THREE.BoxGeometry(0.013, 0.018, 0.045), mats.gloveMat);
      finger.position.set(-0.022 + f * 0.015, -0.01, -0.04);
      finger.rotation.x = -0.6;
      arm.add(finger);
    }

    // Thumb
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.016, 0.04), mats.gloveMat);
    thumb.position.set(isLeft ? 0.032 : -0.032, 0.01, -0.01);
    thumb.rotation.y = isLeft ? 0.6 : -0.6;
    arm.add(thumb);

    return arm;
  }

  /* ==========================================================================
     WEAPON & HAND MODEL ASSEMBLIES
     ========================================================================== */

  _buildPistol(mats) {
    const root = new THREE.Group();

    // --- Weapon ---
    const gun = new THREE.Group();
    // Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.052, 0.22), mats.darkMetal);
    slide.position.set(0, 0.03, 0);
    gun.add(slide);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.23, 10), mats.gunMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.02);
    gun.add(barrel);

    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.12, 0.052), mats.gripMat);
    grip.position.set(0, -0.05, 0.055);
    grip.rotation.x = -0.25;
    gun.add(grip);

    // Glowing energy conduit
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.008, 0.13), mats.cyanGlow);
    glow.position.set(0, 0.04, -0.02);
    gun.add(glow);

    // Sights
    const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.012, 0.01), mats.cyanGlow);
    frontSight.position.set(0, 0.062, -0.1);
    gun.add(frontSight);

    const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.012, 0.01), mats.gunMetal);
    rearSight.position.set(0, 0.062, 0.09);
    gun.add(rearSight);

    root.add(gun);

    // --- Hands ---
    // Right Hand (Main Grip)
    const rightArm = this._createArm(mats, false);
    rightArm.position.set(0.01, -0.06, 0.06);
    rightArm.rotation.set(-0.25, 0.05, 0);
    root.add(rightArm);

    // Left Hand (Supporting under base of grip)
    const leftArm = this._createArm(mats, true);
    leftArm.position.set(-0.04, -0.11, 0.08);
    leftArm.rotation.set(-0.35, 0.35, -0.2);
    root.add(leftArm);

    root.visible = false;
    this.weaponGroup.add(root);
    this.weaponMeshes['pistol'] = root;
    this.muzzlePositions['pistol'] = new THREE.Vector3(0, 0.03, -0.16);
  }

  _buildRifle(mats) {
    const root = new THREE.Group();

    // --- Weapon ---
    const gun = new THREE.Group();
    // Receiver
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.085, 0.38), mats.darkMetal);
    gun.add(body);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.32, 10), mats.gunMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.02, -0.28);
    gun.add(barrel);

    // Muzzle Brake
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, 0.06), mats.darkMetal);
    brake.position.set(0, 0.02, -0.42);
    gun.add(brake);

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.08, 0.22), mats.gripMat);
    stock.position.set(0, -0.01, 0.26);
    gun.add(stock);

    // Curved Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.14, 0.065), mats.darkMetal);
    mag.position.set(0, -0.1, -0.04);
    mag.rotation.x = 0.2;
    gun.add(mag);

    // Holographic Sight Frame
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.04, 0.08), mats.gunMetal);
    sight.position.set(0, 0.068, -0.05);
    gun.add(sight);

    // Reticle Dot
    const reticle = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.005, 0.005), mats.cyanGlow);
    reticle.position.set(0, 0.072, -0.05);
    gun.add(reticle);

    root.add(gun);

    // --- Hands ---
    // Right Hand (Trigger Grip)
    const rightArm = this._createArm(mats, false);
    rightArm.position.set(0.01, -0.06, 0.1);
    rightArm.rotation.set(-0.25, 0.05, 0);
    root.add(rightArm);

    // Left Hand (Forward Handguard Grip)
    const leftArm = this._createArm(mats, true);
    leftArm.position.set(0.01, -0.03, -0.18);
    leftArm.rotation.set(0.2, 0.2, -0.3);
    root.add(leftArm);

    root.visible = false;
    this.weaponGroup.add(root);
    this.weaponMeshes['rifle'] = root;
    this.muzzlePositions['rifle'] = new THREE.Vector3(0, 0.02, -0.46);
  }

  _buildShotgun(mats) {
    const root = new THREE.Group();

    // --- Weapon ---
    const gun = new THREE.Group();
    // Receiver
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.082, 0.32), mats.darkMetal);
    gun.add(body);

    // Heavy Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.38, 10), mats.gunMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.025, -0.28);
    gun.add(barrel);

    // Pump Slide (Underbarrel)
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.052, 0.14), mats.gripMat);
    pump.position.set(0, -0.02, -0.22);
    gun.add(pump);

    // Solid Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.09, 0.24), mats.gripMat);
    stock.position.set(0, -0.02, 0.24);
    gun.add(stock);

    // Amber Indicator
    const ind = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.01, 0.08), mats.amberGlow);
    ind.position.set(0, 0.048, 0);
    gun.add(ind);

    root.add(gun);

    // --- Hands ---
    // Right Hand (Rear Grip)
    const rightArm = this._createArm(mats, false);
    rightArm.position.set(0.01, -0.06, 0.14);
    rightArm.rotation.set(-0.25, 0.05, 0);
    root.add(rightArm);

    // Left Hand (On Pump Slide)
    const leftArm = this._createArm(mats, true);
    leftArm.position.set(0.0, -0.03, -0.22);
    leftArm.rotation.set(0.15, 0.25, -0.25);
    root.add(leftArm);

    root.visible = false;
    this.weaponGroup.add(root);
    this.weaponMeshes['shotgun'] = root;
    this.muzzlePositions['shotgun'] = new THREE.Vector3(0, 0.025, -0.48);
  }

  _buildPlasma(mats) {
    const root = new THREE.Group();

    // --- Weapon ---
    const gun = new THREE.Group();
    // Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.095, 0.36), mats.darkMetal);
    gun.add(chassis);

    // Twin Energy Rails
    const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.34), mats.gunMetal);
    railTop.position.set(0.024, 0.03, -0.28);
    gun.add(railTop);

    const railBot = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.34), mats.gunMetal);
    railBot.position.set(-0.024, 0.03, -0.28);
    gun.add(railBot);

    // Glowing Plasma Core
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.18, 10), mats.greenGlow);
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 0.01, 0.02);
    gun.add(core);

    // Emitter Nozzle
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.018, 0.08, 8), mats.greenGlow);
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0.02, -0.42);
    gun.add(nozzle);

    root.add(gun);

    // --- Hands ---
    // Right Hand (Trigger)
    const rightArm = this._createArm(mats, false);
    rightArm.position.set(0.01, -0.06, 0.1);
    rightArm.rotation.set(-0.25, 0.05, 0);
    root.add(rightArm);

    // Left Hand (Side Support Rail)
    const leftArm = this._createArm(mats, true);
    leftArm.position.set(-0.03, -0.01, -0.16);
    leftArm.rotation.set(0.2, 0.35, -0.4);
    root.add(leftArm);

    root.visible = false;
    this.weaponGroup.add(root);
    this.weaponMeshes['plasma'] = root;
    this.muzzlePositions['plasma'] = new THREE.Vector3(0, 0.02, -0.46);
  }

  _buildViper(mats) {
    const root = new THREE.Group();

    // --- Weapon ---
    const gun = new THREE.Group();
    // Compact Main Receiver
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.075, 0.30), mats.darkMetal);
    gun.add(body);

    // Barrel Shroud
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 10), mats.gunMetal);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.015, -0.22);
    gun.add(barrel);

    // Muzzle Compensator
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.028, 0.04), mats.darkMetal);
    brake.position.set(0, 0.015, -0.34);
    gun.add(brake);

    // Curved 40-round Magazine
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.15, 0.055), mats.darkMetal);
    mag.position.set(0, -0.09, 0.02);
    mag.rotation.x = 0.2;
    gun.add(mag);

    // Pistol Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.048), mats.gripMat);
    grip.position.set(0, -0.045, 0.08);
    grip.rotation.x = -0.25;
    gun.add(grip);

    // Forward Angled Grip
    const fGrip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.075, 0.042), mats.gripMat);
    fGrip.position.set(0, -0.038, -0.14);
    fGrip.rotation.x = 0.3;
    gun.add(fGrip);

    // Top Picatinny Rail & Holo Sight Frame
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.035, 0.06), mats.gunMetal);
    sight.position.set(0, 0.058, -0.04);
    gun.add(sight);

    // Glowing Reticle Dot
    const reticle = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.005, 0.005), mats.cyanGlow);
    reticle.position.set(0, 0.062, -0.04);
    gun.add(reticle);

    // Glowing Cyan Energy Ammo Status Conduit
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.049, 0.008, 0.12), mats.cyanGlow);
    glow.position.set(0, 0.025, -0.02);
    gun.add(glow);

    root.add(gun);

    // --- Hands ---
    // Right Hand (Pistol Grip & Trigger)
    const rightArm = this._createArm(mats, false);
    rightArm.position.set(0.01, -0.05, 0.08);
    rightArm.rotation.set(-0.25, 0.05, 0);
    root.add(rightArm);

    // Left Hand (Forward Angled Grip)
    const leftArm = this._createArm(mats, true);
    leftArm.position.set(0.01, -0.03, -0.14);
    leftArm.rotation.set(0.25, 0.2, -0.25);
    root.add(leftArm);

    root.visible = false;
    this.weaponGroup.add(root);
    this.weaponMeshes['viper'] = root;
    this.muzzlePositions['viper'] = new THREE.Vector3(0, 0.015, -0.36);
  }

  /* ==========================================================================
     WEAPON CONTROLS & ANIMATIONS
     ========================================================================== */

  equipSlot(slotNumber, immediate = false) {
    if (!this.weapons[slotNumber]) return;
    if (this.activeSlot === slotNumber && !immediate) return;

    if (immediate) {
      this.activeSlot = slotNumber;
      this.activeWeapon = this.weapons[slotNumber];
      this._updateVisibleMesh();
      if (this.game.uiManager) {
        this.game.uiManager.updateHUD();
        this.game.uiManager.setActiveWeaponSlot(slotNumber);
      }
      return;
    }

    // Smooth switch transition
    this.isSwitching = true;
    this.switchProgress = 1.0;
    this.pendingSlot = slotNumber;
  }

  _updateVisibleMesh() {
    Object.keys(this.weaponMeshes).forEach(key => {
      this.weaponMeshes[key].visible = (key === this.activeWeapon.id);
    });
  }

  applyRecoil(kickAmount) {
    this.recoilOffset.z += kickAmount;
    this.recoilRot.x -= kickAmount * 1.6;

    // Trigger Muzzle Flash
    this._triggerMuzzleFlash();
  }

  _triggerMuzzleFlash() {
    this.muzzleFlashTimer = 0.04;
    const muzzleLocal = this.muzzlePositions[this.activeWeapon.id] || new THREE.Vector3(0, 0, -0.3);

    this.muzzleLight.position.copy(muzzleLocal);
    this.muzzleLight.color.setHex(this.activeWeapon.id === 'plasma' ? 0x00ff88 : 0x00f0ff);
    this.muzzleLight.intensity = 4.5;

    this.muzzleFlashMesh.position.copy(muzzleLocal);
    this.muzzleFlashMesh.rotation.z = Math.random() * Math.PI;
    this.muzzleFlashMesh.material.color.setHex(this.activeWeapon.id === 'plasma' ? 0x00ff88 : 0x00f0ff);
    this.muzzleFlashMesh.material.opacity = 1.0;
  }

  getMuzzleWorldPosition() {
    const muzzleLocal = this.muzzlePositions[this.activeWeapon.id] || new THREE.Vector3(0, 0, -0.3);
    const worldPos = new THREE.Vector3();
    const mesh = this.weaponMeshes[this.activeWeapon.id];
    if (mesh) {
      mesh.localToWorld(worldPos.copy(muzzleLocal));
      return worldPos;
    }
    return this.camera.position.clone();
  }

  update(delta) {
    if (!this.activeWeapon) return;

    this.activeWeapon.update(delta);
    this._handleInput(delta);
    this._updateWeaponSwitch(delta);
    this._updateProceduralAnimations(delta);
    this._updateMuzzleFlash(delta);
  }

  _updateWeaponSwitch(delta) {
    if (!this.isSwitching) return;

    this.switchProgress -= delta * 6; // Quick lower/raise
    if (this.switchProgress <= 0.5 && this.pendingSlot !== null) {
      this.activeSlot = this.pendingSlot;
      this.activeWeapon = this.weapons[this.pendingSlot];
      this.pendingSlot = null;
      this._updateVisibleMesh();

      if (this.game.uiManager) {
        this.game.uiManager.updateHUD();
        this.game.uiManager.setActiveWeaponSlot(this.activeSlot);
      }
    }

    if (this.switchProgress <= 0) {
      this.isSwitching = false;
      this.switchProgress = 0;
    }
  }

  _handleInput(delta) {
    // 1. Weapon Switching (Keys 1-5 & Mouse Wheel)
    if (this.input.wasKeyJustPressed('Digit1')) this.equipSlot(1);
    if (this.input.wasKeyJustPressed('Digit2')) this.equipSlot(2);
    if (this.input.wasKeyJustPressed('Digit3')) this.equipSlot(3);
    if (this.input.wasKeyJustPressed('Digit4')) this.equipSlot(4);
    if (this.input.wasKeyJustPressed('Digit5')) this.equipSlot(5);

    const wheel = this.input.consumeWheelDelta();
    if (wheel !== 0) {
      let nextSlot = this.activeSlot + wheel;
      if (nextSlot > 5) nextSlot = 1;
      if (nextSlot < 1) nextSlot = 5;
      this.equipSlot(nextSlot);
    }

    // 2. Reloading (Key R)
    if (this.input.wasKeyJustPressed('KeyR')) {
      if (this.activeWeapon.reload()) {
        if (this.game.uiManager) this.game.uiManager.updateHUD();
      }
    }

    // 3. Aim Down Sights (RMB)
    this.isADS = this.input.isMouseDown(2);

    // 4. Firing (LMB)
    const wantsFire = this.activeWeapon.isAutomatic ? this.input.isMouseDown(0) : this.input.wasMouseClicked(0);

    if (wantsFire) {
      if (this.activeWeapon.fire()) {
        if (this.game.shootingSystem) {
          this.game.shootingSystem.fireWeapon(this.activeWeapon);
        }
        if (this.game.uiManager) {
          this.game.uiManager.updateHUD();
        }
      } else if (this.activeWeapon.currentAmmo === 0 && this.activeWeapon.reserveAmmo === 0) {
        if (this.input.wasMouseClicked(0) && this.game.audioManager) {
          this.game.audioManager.playDryFire();
        }
      }
    }
  }

  _updateProceduralAnimations(delta) {
    const player = this.game.player;
    if (!player) return;

    // ADS Smooth Transition
    const targetOffset = this.isADS ? this.adsOffset : this.hipOffset;
    this.currentOffset.lerp(targetOffset, Math.min(1.0, 16 * delta));

    // Mouse Sway
    const mouseDeltaX = this.input.mouseDeltaX || 0;
    const mouseDeltaY = this.input.mouseDeltaY || 0;
    const targetSwayX = -mouseDeltaX * 0.0003;
    const targetSwayY = mouseDeltaY * 0.0003;
    const targetSwayRotZ = mouseDeltaX * 0.0006;
    const targetSwayRotX = mouseDeltaY * 0.0006;

    this.swayPos.x += (targetSwayX - this.swayPos.x) * Math.min(1.0, 12 * delta);
    this.swayPos.y += (targetSwayY - this.swayPos.y) * Math.min(1.0, 12 * delta);
    this.swayRot.z += (targetSwayRotZ - this.swayRot.z) * Math.min(1.0, 12 * delta);
    this.swayRot.x += (targetSwayRotX - this.swayRot.x) * Math.min(1.0, 12 * delta);

    // Idle Breathing
    const time = performance.now() * 0.002;
    const breatheY = Math.sin(time) * 0.002;
    const breatheX = Math.cos(time * 0.5) * 0.001;

    // Movement Bobbing
    const hSpeed = Math.hypot(player.velocity.x, player.velocity.z);
    let bobX = 0;
    let bobY = 0;
    if (player.isGrounded && hSpeed > 0.5) {
      const bobRate = player.bobTimer;
      bobX = Math.cos(bobRate * 0.5) * (this.isADS ? 0.003 : 0.014);
      bobY = Math.sin(bobRate) * (this.isADS ? 0.003 : 0.014);
    }

    // Sprinting Lower / Tilt
    let sprintLowerY = 0;
    let sprintTiltZ = 0;
    let sprintTiltX = 0;
    if (player.isSprinting && !this.isADS) {
      sprintLowerY = -0.08;
      sprintTiltZ = -0.35;
      sprintTiltX = -0.15;
    }

    // Switch Transition Dip
    let switchDip = 0;
    if (this.isSwitching) {
      switchDip = Math.sin(this.switchProgress * Math.PI) * 0.25;
    }

    // Recoil Spring Recovery
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, 16 * delta));
    this.recoilRot.x += (0 - this.recoilRot.x) * Math.min(1.0, 16 * delta);

    // Reload Animation Dip & Tilt
    let reloadDip = 0;
    let reloadRotX = 0;
    let reloadRotZ = 0;
    if (this.activeWeapon.isReloading) {
      const p = this.activeWeapon.reloadTimer / this.activeWeapon.reloadTime; // 1 -> 0
      reloadDip = Math.sin(p * Math.PI) * 0.16;
      reloadRotX = Math.sin(p * Math.PI) * 0.35;
      reloadRotZ = Math.sin(p * Math.PI) * 0.25;
    }

    // Apply combined transform to active weapon group
    const activeMesh = this.weaponMeshes[this.activeWeapon.id];
    if (activeMesh) {
      activeMesh.position.set(
        this.currentOffset.x + this.swayPos.x + bobX + breatheX + this.recoilOffset.x,
        this.currentOffset.y + this.swayPos.y + bobY + breatheY + this.recoilOffset.y - reloadDip - switchDip + sprintLowerY,
        this.currentOffset.z + this.recoilOffset.z
      );

      activeMesh.rotation.set(
        this.recoilRot.x + reloadRotX + this.swayRot.x + sprintTiltX,
        this.swayRot.y,
        this.swayRot.z + reloadRotZ + sprintTiltZ
      );
    }
  }

  _updateMuzzleFlash(delta) {
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= delta;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleLight.intensity = 0;
        this.muzzleFlashMesh.material.opacity = 0;
      }
    }
  }
}
