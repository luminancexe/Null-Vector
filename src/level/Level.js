/**
 * Level.js
 * Builds and manages the complete multi-zone research facility "Null Vector Complex".
 */

import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { NavGraph } from './NavGraph.js';
import { PickupManager } from '../entities/Pickups.js';

export class Level {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;

    this.colliders = [];
    this.raycastMeshes = [];
    this.interactiveObjects = [];
    this.doors = [];

    this.navGraph = new NavGraph();
    this.pickupManager = new PickupManager(game);

    // Textures & Materials
    this.floorTex = TextureGenerator.createFloorTexture();
    this.floorTex.repeat.set(4, 4);

    this.wallTex = TextureGenerator.createWallTexture();
    this.wallTex.repeat.set(2, 2);

    this.hazardTex = TextureGenerator.createHazardTexture();
    this.hazardTex.repeat.set(8, 1);

    this.serverTex = TextureGenerator.createServerTexture();
    this.serverTex.repeat.set(2, 1);

    this.terminalTex = TextureGenerator.createTerminalScreenTexture('STANDBY');
    this.extractionTex = TextureGenerator.createExtractionPadTexture();

    this.materials = {
      floor: new THREE.MeshStandardMaterial({ map: this.floorTex, roughness: 0.7, metalness: 0.4 }),
      wall: new THREE.MeshStandardMaterial({ map: this.wallTex, roughness: 0.6, metalness: 0.5 }),
      wallDark: new THREE.MeshStandardMaterial({ color: 0x121722, roughness: 0.8, metalness: 0.3 }),
      ceiling: new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: 0.9 }),
      crate: new THREE.MeshStandardMaterial({ color: 0x2e3b4e, roughness: 0.5, metalness: 0.7 }),
      hazard: new THREE.MeshStandardMaterial({ map: this.hazardTex, roughness: 0.5 }),
      server: new THREE.MeshStandardMaterial({ map: this.serverTex, roughness: 0.4, metalness: 0.6 }),
      door: new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.4, metalness: 0.8 }),
      glassCyan: new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.4,
        roughness: 0.1,
        metalness: 0.9
      }),
      terminalScreen: new THREE.MeshBasicMaterial({ map: this.terminalTex }),
      extractionPad: new THREE.MeshBasicMaterial({ map: this.extractionTex })
    };

    // Terminal & extraction references
    this.securityTerminal = null;
    this.extractionZone = null;
    this.alarmLights = [];
    this.isLockdown = false;

    this._buildFacility();
    this._setupNavGraph();
    this._setupPickups();
  }

  _buildFacility() {
    /* ========================================================================
       ZONE 1: AIRLOCK & STAGING (Z: 20 to 35, X: -8 to 8)
       ======================================================================== */
    this._createRoom({
      x: 0, y: 0, z: 28,
      w: 16, h: 6, d: 16,
      openings: ['north']
    });

    // Airlock Entry Gate
    this._createPropCrate(-5, 0, 32, 2, 2, 2);
    this._createPropCrate(5, 0, 32, 2, 3, 2);

    // Airlock Door (slides open)
    this._createDoor(0, 0, 20, 6, 5, 'airlock_door');

    /* ========================================================================
       ZONE 2: SECURITY CHECKPOINT & CORRIDOR (Z: 8 to 20, X: -6 to 6)
       ======================================================================== */
    this._createRoom({
      x: 0, y: 0, z: 14,
      w: 12, h: 6, d: 12,
      openings: ['north', 'south']
    });

    // Security Scanner Arch
    const arch = new THREE.Mesh(new THREE.BoxGeometry(8, 0.4, 0.4), this.materials.hazard);
    arch.position.set(0, 4, 14);
    this.scene.add(arch);

    // Barrier cover
    this._createPropCrate(-3, 0, 14, 1.5, 1.5, 1.5);
    this._createPropCrate(3, 0, 14, 1.5, 1.5, 1.5);

    /* ========================================================================
       ZONE 3: MAIN CARGO WAREHOUSE (Z: -24 to 8, X: -22 to 22)
       ======================================================================== */
    this._createRoom({
      x: 0, y: 0, z: -8,
      w: 44, h: 9, d: 32,
      openings: ['south', 'north', 'west']
    });

    // Cargo Bay Pillars
    this._createPillar(-10, 0, -2, 2, 9, 2);
    this._createPillar(10, 0, -2, 2, 9, 2);
    this._createPillar(-10, 0, -14, 2, 9, 2);
    this._createPillar(10, 0, -14, 2, 9, 2);

    // Stacked Crates (Cover Positions)
    this._createPropCrate(-4, 0, 2, 3, 2.5, 3);
    this._createPropCrate(6, 0, 0, 3, 3, 3);
    this._createPropCrate(6, 3, 0, 2, 2, 2);
    this._createPropCrate(-12, 0, -8, 4, 3, 2);
    this._createPropCrate(14, 0, -10, 3, 2.5, 4);
    this._createPropCrate(0, 0, -12, 3, 2, 3);

    // Elevated Catwalk
    this._createCatwalk(-18, 3.5, -8, 6, 24);
    this._createStairs(-18, 0, 4, 3, 3.5, 6, 'north');

    // Cargo Bay Lights
    this._createPointLight(-10, 6, -8, 0x00f0ff, 1.5, 20);
    this._createPointLight(10, 6, -8, 0xffaa00, 1.5, 20);

    /* ========================================================================
       ZONE 4: SERVER CORE & CRYO-STORAGE (X: -42 to -22, Z: -18 to 2)
       ======================================================================== */
    this._createRoom({
      x: -32, y: 0, z: -8,
      w: 20, h: 6, d: 20,
      openings: ['east', 'north']
    });

    // Server Racks
    this._createServerRack(-38, 0, -4, 2, 5, 8);
    this._createServerRack(-38, 0, -12, 2, 5, 8);
    this._createServerRack(-26, 0, -12, 2, 5, 8);

    // Central Security Terminal Console
    this._createSecurityTerminal(-32, 0, -8);

    // Server room lighting
    this._createPointLight(-32, 4.5, -8, 0x00f0ff, 2.0, 15);

    /* ========================================================================
       ZONE 5: REACTOR LOCKDOWN CORRIDOR (Z: -40 to -24, X: -8 to 8)
       ======================================================================== */
    this._createRoom({
      x: 0, y: 0, z: -32,
      w: 16, h: 6, d: 16,
      openings: ['south', 'north']
    });

    // Reactor Blast Door
    this._createDoor(0, 0, -40, 6, 5, 'reactor_door');

    // Cover barriers
    this._createPropCrate(-3, 0, -32, 2, 2, 2);
    this._createPropCrate(3, 0, -32, 2, 2, 2);

    /* ========================================================================
       ZONE 6: EVACUATION EXTRACTION ZONE (Z: -65 to -40, X: -18 to 18)
       ======================================================================== */
    this._createExtractionArea(0, 0, -52, 36, 24);

    // Setup colliders for player
    this.game.colliders = this.colliders;
    if (this.game.player) {
      this.game.player.setColliders(this.colliders);
      this.game.player.setSpawn(0, 0, 32, 0); // Start in airlock
    }
  }

  _createRoom({ x, y, z, w, h, d, openings = [] }) {
    const halfW = w / 2;
    const halfH = h / 2;
    const halfD = d / 2;
    const wallThick = 0.6;

    // Floor
    const floorGeo = new THREE.BoxGeometry(w, 0.4, d);
    const floor = new THREE.Mesh(floorGeo, this.materials.floor);
    floor.position.set(x, y - 0.2, z);
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.raycastMeshes.push(floor);

    // Ceiling
    const ceilGeo = new THREE.BoxGeometry(w, 0.4, d);
    const ceiling = new THREE.Mesh(ceilGeo, this.materials.ceiling);
    ceiling.position.set(x, y + h + 0.2, z);
    this.scene.add(ceiling);

    // Walls (North, South, East, West)
    const wallDefs = [
      { side: 'north', pos: [x, y + halfH, z - halfD], size: [w, h, wallThick] },
      { side: 'south', pos: [x, y + halfH, z + halfD], size: [w, h, wallThick] },
      { side: 'east',  pos: [x + halfW, y + halfH, z], size: [wallThick, h, d] },
      { side: 'west',  pos: [x - halfW, y + halfH, z], size: [wallThick, h, d] }
    ];

    wallDefs.forEach(def => {
      if (openings.includes(def.side)) {
        // Create wall with doorway opening (left and right segments)
        const doorWidth = 6;
        if (def.side === 'north' || def.side === 'south') {
          const segW = (w - doorWidth) / 2;
          const leftWall = new THREE.Mesh(new THREE.BoxGeometry(segW, h, wallThick), this.materials.wall);
          leftWall.position.set(def.pos[0] - doorWidth/2 - segW/2, def.pos[1], def.pos[2]);
          leftWall.castShadow = true; leftWall.receiveShadow = true;
          this.scene.add(leftWall);
          this.colliders.push(new THREE.Box3().setFromObject(leftWall));
          this.raycastMeshes.push(leftWall);

          const rightWall = new THREE.Mesh(new THREE.BoxGeometry(segW, h, wallThick), this.materials.wall);
          rightWall.position.set(def.pos[0] + doorWidth/2 + segW/2, def.pos[1], def.pos[2]);
          rightWall.castShadow = true; rightWall.receiveShadow = true;
          this.scene.add(rightWall);
          this.colliders.push(new THREE.Box3().setFromObject(rightWall));
          this.raycastMeshes.push(rightWall);

          // Top lintel
          const lintel = new THREE.Mesh(new THREE.BoxGeometry(doorWidth, h - 4.5, wallThick), this.materials.wall);
          lintel.position.set(def.pos[0], def.pos[1] + 2.25, def.pos[2]);
          this.scene.add(lintel);
        } else {
          const segD = (d - doorWidth) / 2;
          const leftWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, segD), this.materials.wall);
          leftWall.position.set(def.pos[0], def.pos[1], def.pos[2] - doorWidth/2 - segD/2);
          leftWall.castShadow = true; leftWall.receiveShadow = true;
          this.scene.add(leftWall);
          this.colliders.push(new THREE.Box3().setFromObject(leftWall));
          this.raycastMeshes.push(leftWall);

          const rightWall = new THREE.Mesh(new THREE.BoxGeometry(wallThick, h, segD), this.materials.wall);
          rightWall.position.set(def.pos[0], def.pos[1], def.pos[2] + doorWidth/2 + segD/2);
          rightWall.castShadow = true; rightWall.receiveShadow = true;
          this.scene.add(rightWall);
          this.colliders.push(new THREE.Box3().setFromObject(rightWall));
          this.raycastMeshes.push(rightWall);
        }
      } else {
        // Solid wall
        const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(...def.size), this.materials.wall);
        wallMesh.position.set(...def.pos);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        this.scene.add(wallMesh);
        this.colliders.push(new THREE.Box3().setFromObject(wallMesh));
        this.raycastMeshes.push(wallMesh);
      }
    });
  }

  _createPropCrate(x, y, z, w, h, d) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.materials.crate);
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Hazard rim trim
    const trim = new THREE.Mesh(new THREE.BoxGeometry(w * 1.02, 0.2, d * 1.02), this.materials.hazard);
    trim.position.set(x, y + h - 0.1, z);
    this.scene.add(trim);

    this.colliders.push(new THREE.Box3().setFromObject(mesh));
    this.raycastMeshes.push(mesh);
  }

  _createPillar(x, y, z, w, h, d) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.materials.wallDark);
    pillar.position.set(x, y + h / 2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    this.scene.add(pillar);

    // Cyan glowing vertical accent strip
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, h * 0.8, d * 1.02), this.materials.glassCyan);
    strip.position.set(x, y + h / 2, z);
    this.scene.add(strip);

    this.colliders.push(new THREE.Box3().setFromObject(pillar));
    this.raycastMeshes.push(pillar);
  }

  _createServerRack(x, y, z, w, h, d) {
    const server = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.materials.server);
    server.position.set(x, y + h / 2, z);
    server.castShadow = true;
    server.receiveShadow = true;
    this.scene.add(server);

    this.colliders.push(new THREE.Box3().setFromObject(server));
    this.raycastMeshes.push(server);
  }

  _createCatwalk(x, y, z, w, d) {
    const plat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), this.materials.wallDark);
    plat.position.set(x, y, z);
    plat.receiveShadow = true;
    this.scene.add(plat);
    this.colliders.push(new THREE.Box3().setFromObject(plat));
    this.raycastMeshes.push(plat);

    // Railing
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, d), this.materials.glassCyan);
    rail.position.set(x + w / 2, y + 0.55, z);
    this.scene.add(rail);
  }

  _createStairs(x, y, z, w, h, d, dir = 'north') {
    const steps = 8;
    const stepH = h / steps;
    const stepD = d / steps;

    for (let i = 0; i < steps; i++) {
      const sMesh = new THREE.Mesh(new THREE.BoxGeometry(w, stepH * (i + 1), stepD), this.materials.wallDark);
      const stepZ = dir === 'north' ? z - i * stepD : z + i * stepD;
      sMesh.position.set(x, y + (stepH * (i + 1)) / 2, stepZ);
      sMesh.receiveShadow = true;
      this.scene.add(sMesh);
      this.colliders.push(new THREE.Box3().setFromObject(sMesh));
      this.raycastMeshes.push(sMesh);
    }
  }

  _createDoor(x, y, z, w, h, id) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(x, y, z);

    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(w / 2, h, 0.4), this.materials.door);
    leftPanel.position.set(-w / 4, h / 2, 0);
    leftPanel.castShadow = true;
    doorGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(w / 2, h, 0.4), this.materials.door);
    rightPanel.position.set(w / 4, h / 2, 0);
    rightPanel.castShadow = true;
    doorGroup.add(rightPanel);

    // Glowing door status stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, h * 0.8, 0.45), this.materials.glassCyan);
    stripe.position.set(0, h / 2, 0);
    doorGroup.add(stripe);

    this.scene.add(doorGroup);

    const doorData = {
      id,
      group: doorGroup,
      leftPanel,
      rightPanel,
      w,
      h,
      isOpen: false,
      isLocked: true,
      openProgress: 0,
      collider: new THREE.Box3().setFromObject(doorGroup),
      position: new THREE.Vector3(x, y, z)
    };

    this.colliders.push(doorData.collider);
    this.doors.push(doorData);
    return doorData;
  }

  _createSecurityTerminal(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Console Pedestal
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.8), this.materials.wallDark);
    base.position.y = 0.55;
    base.castShadow = true;
    group.add(base);

    // Screen
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), this.materials.terminalScreen);
    screen.position.set(0, 1.2, 0.35);
    screen.rotation.x = -0.3;
    group.add(screen);

    // Terminal light
    const tLight = new THREE.PointLight(0x00f0ff, 1.5, 6);
    tLight.position.set(0, 1.4, 0.5);
    group.add(tLight);

    this.scene.add(group);

    this.securityTerminal = {
      group,
      screen,
      light: tLight,
      position: new THREE.Vector3(x, y, z),
      isHacked: false,
      hackProgress: 0
    };

    this.colliders.push(new THREE.Box3().setFromObject(base));
  }

  _createExtractionArea(x, y, z, w, d) {
    // Open Landing Pad
    const pad = new THREE.Mesh(new THREE.BoxGeometry(w, 0.4, d), this.materials.floor);
    pad.position.set(x, y - 0.2, z);
    pad.receiveShadow = true;
    this.scene.add(pad);
    this.colliders.push(new THREE.Box3().setFromObject(pad));
    this.raycastMeshes.push(pad);

    // Glowing LZ marking
    const lz = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), this.materials.extractionPad);
    lz.rotation.x = -Math.PI / 2;
    lz.position.set(x, y + 0.02, z);
    this.scene.add(lz);

    // Landing Beacon Lights (Corner towers)
    const corners = [
      [x - w/2 + 2, y, z - d/2 + 2],
      [x + w/2 - 2, y, z - d/2 + 2],
      [x - w/2 + 2, y, z + d/2 - 2],
      [x + w/2 - 2, y, z + d/2 - 2]
    ];

    corners.forEach(c => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 8), this.materials.wallDark);
      tower.position.set(c[0], y + 1.5, c[2]);
      this.scene.add(tower);
      this.colliders.push(new THREE.Box3().setFromObject(tower));

      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      beacon.position.set(c[0], y + 3.1, c[2]);
      this.scene.add(beacon);

      const bLight = new THREE.PointLight(0x00f0ff, 1.2, 10);
      bLight.position.set(c[0], y + 3.2, c[2]);
      this.scene.add(bLight);
    });

    this.extractionZone = {
      position: new THREE.Vector3(x, y, z),
      radius: 8
    };
  }

  _createPointLight(x, y, z, color, intensity, distance) {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.set(x, y, z);
    this.scene.add(light);

    // Light bulb mesh
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), new THREE.MeshBasicMaterial({ color }));
    bulb.position.set(x, y, z);
    this.scene.add(bulb);

    return light;
  }

  _setupNavGraph() {
    const g = this.navGraph;
    // Airlock & Checkpoint
    g.addNode('airlock_start', 0, 0, 32);
    g.addNode('airlock_gate', 0, 0, 22);
    g.addNode('security_mid', 0, 0, 14);
    g.addNode('cargo_entry', 0, 0, 6);

    // Cargo Bay Arena
    g.addNode('cargo_center', 0, 0, -8);
    g.addNode('cargo_left', -12, 0, -8);
    g.addNode('cargo_right', 12, 0, -8);
    g.addNode('cargo_north', 0, 0, -20);
    g.addNode('cargo_catwalk', -18, 3.5, -8);

    // Server Hub
    g.addNode('server_door', -22, 0, -8);
    g.addNode('server_terminal', -32, 0, -8);
    g.addNode('server_back', -32, 0, -14);

    // Reactor & Evac
    g.addNode('reactor_entry', 0, 0, -26);
    g.addNode('reactor_mid', 0, 0, -34);
    g.addNode('evac_gate', 0, 0, -42);
    g.addNode('evac_pad', 0, 0, -52);

    // Connect Waypoints
    g.connect('airlock_start', 'airlock_gate');
    g.connect('airlock_gate', 'security_mid');
    g.connect('security_mid', 'cargo_entry');
    g.connect('cargo_entry', 'cargo_center');
    g.connect('cargo_center', 'cargo_left');
    g.connect('cargo_center', 'cargo_right');
    g.connect('cargo_center', 'cargo_north');
    g.connect('cargo_left', 'cargo_catwalk');
    g.connect('cargo_left', 'server_door');
    g.connect('server_door', 'server_terminal');
    g.connect('server_terminal', 'server_back');
    g.connect('cargo_north', 'reactor_entry');
    g.connect('reactor_entry', 'reactor_mid');
    g.connect('reactor_mid', 'evac_gate');
    g.connect('evac_gate', 'evac_pad');

    g.setColliders(this.colliders);
  }

  _setupPickups() {
    const pm = this.pickupManager;
    // Security checkpoint supplies
    pm.spawnPickup('ammo', 3, 0, 16);
    pm.spawnPickup('armor', -3, 0, 16);

    // Cargo bay supplies
    pm.spawnPickup('health', -16, 0, -8);
    pm.spawnPickup('ammo', 16, 0, -8);
    pm.spawnPickup('health', -18, 3.5, -8); // On catwalk
    pm.spawnPickup('armor', 0, 0, -14);

    // Server room supplies
    pm.spawnPickup('health', -36, 0, -14);
    pm.spawnPickup('ammo', -28, 0, -14);

    // Reactor supplies
    pm.spawnPickup('armor', -4, 0, -34);
    pm.spawnPickup('ammo', 4, 0, -34);
  }

  openDoor(id) {
    const door = this.doors.find(d => d.id === id);
    if (door) {
      door.isLocked = false;
      door.isOpen = true;
      if (this.game.audioManager) this.game.audioManager.playDoorOpen();
    }
  }

  triggerLockdown() {
    this.isLockdown = true;
    this.materials.terminalScreen.map = TextureGenerator.createTerminalScreenTexture('ALERT: LOCKDOWN');
    this.materials.terminalScreen.needsUpdate = true;

    // Red alarm lights
    const alarmL1 = new THREE.PointLight(0xff2a4b, 3.0, 30);
    alarmL1.position.set(0, 7, -8);
    this.scene.add(alarmL1);
    this.alarmLights.push(alarmL1);

    const alarmL2 = new THREE.PointLight(0xff2a4b, 3.0, 25);
    alarmL2.position.set(-32, 5, -8);
    this.scene.add(alarmL2);
    this.alarmLights.push(alarmL2);

    if (this.game.audioManager) {
      this.game.audioManager.playAlarm();
    }
  }

  update(delta) {
    // 1. Update interactive sliding doors
    const player = this.game.player;
    const pPos = player ? player.position : new THREE.Vector3();

    for (let i = 0; i < this.doors.length; i++) {
      const d = this.doors[i];
      const dist = d.position.distanceTo(pPos);

      // Auto-open if unlocked and player nearby
      if (!d.isLocked && dist < 6.0) {
        d.isOpen = true;
      } else if (!d.isLocked && dist > 8.0) {
        d.isOpen = false;
      }

      // Smooth slide animation
      const targetProg = d.isOpen ? 1.0 : 0.0;
      d.openProgress += (targetProg - d.openProgress) * Math.min(1.0, 5 * delta);

      d.leftPanel.position.x = -d.w / 4 - d.openProgress * (d.w / 2.2);
      d.rightPanel.position.x = d.w / 4 + d.openProgress * (d.w / 2.2);

      // Update collider
      if (d.openProgress > 0.7) {
        // Move collider away when opened
        d.collider.min.set(999, 999, 999);
        d.collider.max.set(999, 999, 999);
      } else {
        d.collider.setFromObject(d.group);
      }
    }

    // 2. Update Pickups
    this.pickupManager.update(delta);

    // 3. Alarm lights pulse
    if (this.isLockdown) {
      const pulse = (Math.sin(performance.now() * 0.008) + 1) * 1.5;
      this.alarmLights.forEach(l => {
        l.intensity = pulse;
      });
    }

    // 4. Terminal interaction check
    if (this.securityTerminal && player) {
      const dist = this.securityTerminal.position.distanceTo(pPos);
      if (dist < 2.5 && !this.securityTerminal.isHacked) {
        if (this.game.uiManager) {
          this.game.uiManager.showInteraction('HACK TERMINAL', 'E');
        }

        if (this.game.input.wasKeyJustPressed('KeyE')) {
          this.securityTerminal.isHacked = true;
          if (this.game.uiManager) this.game.uiManager.hideInteraction();
          if (this.game.audioManager) this.game.audioManager.playTerminalHack();
          if (this.game.objectiveManager) {
            this.game.objectiveManager.onTerminalHacked();
          }
        }
      } else if (dist < 2.5 && this.securityTerminal.isHacked) {
        if (this.game.uiManager) this.game.uiManager.hideInteraction();
      }
    }
  }

  getRaycastMeshes() {
    return this.raycastMeshes;
  }
}
