/**
 * Level02.js
 * Research Facility 07 for Mission 02: Blackout.
 * Features 8 connected zones: Exterior Rain LZ, Maintenance Tunnels (Relay A),
 * Research Wing (Relay B), Security Control Room, Server Archive (Relay C & Incident Log),
 * Multi-tier Lockdown Arena, Central Systems Chamber (Project Singularity), and Extraction Evac Pad.
 */

import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator.js';
import { NavGraph } from './NavGraph.js';
import { PickupManager } from '../entities/Pickups.js';
import { PowerManager, PowerState } from '../systems/PowerManager.js';
import { SecurityDrone } from '../entities/SecurityDrone.js';
import { Phantom } from '../entities/Phantom.js';

export class Level02 {
  constructor(game) {
    this.game = game;
    this.meshGroup = new THREE.Group();
    this.colliders = [];
    this.doors = [];

    // Interactive Terminals & Relays
    this.relays = [];
    this.securityTerminal = null;
    this.incidentLogTerminal = null;
    this.centralSystemsCore = null;
    this.extractionZone = null;

    // Dynamic Lights
    this.emergencyLights = [];
    this.criticalFlickerLights = [];
    this.corridorLights = [];

    // Subsystems
    this.powerManager = new PowerManager(game, this);
    this.game.powerManager = this.powerManager;
    this.pickupManager = new PickupManager(game);
    this.navGraph = new NavGraph();

    // Procedural Rain Particles (Exterior)
    this.rainParticles = null;

    this._generateTextures();
    this._buildFacility();
    this._setupEncounters();
    this._setupPickups();
    this._setupRain();

    this.game.scene.add(this.meshGroup);
    this.game.colliders = this.colliders;

    // Apply initial power state (OFF)
    this.powerManager.setPowerState(PowerState.OFF);
  }

  _generateTextures() {
    this.textures = {
      floor: TextureGenerator.createFloorTexture(),
      wall: TextureGenerator.createWallTexture(),
      hazard: TextureGenerator.createHazardTexture(),
      server: TextureGenerator.createServerTexture(),
      extraction: TextureGenerator.createExtractionPadTexture()
    };

    this.materials = {
      floor: new THREE.MeshStandardMaterial({ map: this.textures.floor, roughness: 0.8, metalness: 0.3 }),
      exteriorFloor: new THREE.MeshStandardMaterial({ map: this.textures.floor, roughness: 0.9, metalness: 0.2 }),
      wall: new THREE.MeshStandardMaterial({ map: this.textures.wall, roughness: 0.7, metalness: 0.4 }),
      darkWall: new THREE.MeshStandardMaterial({ color: 0x0c0f16, roughness: 0.85, metalness: 0.2 }),
      hazard: new THREE.MeshStandardMaterial({ map: this.textures.hazard, roughness: 0.6, metalness: 0.2 }),
      server: new THREE.MeshStandardMaterial({ map: this.textures.server, roughness: 0.5, metalness: 0.6 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.25, roughness: 0.1, metalness: 0.9 }),
      containmentGlow: new THREE.MeshBasicMaterial({ color: 0xff0044, transparent: true, opacity: 0.65 }),
      relayGlow: new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
      pipeMat: new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.4, metalness: 0.8 })
    };
  }

  _buildFacility() {
    // 1. ZONE 1: EXTERIOR RAIN LZ (Z: 36 to 54, X: -16 to 16)
    this._createRoom('exterior_lz', 0, 0, 45, 32, 8, 18, {
      floorMat: this.materials.exteriorFloor,
      wallMat: this.materials.darkWall,
      openCeiling: true
    });
    // Emergency Beacon Tower at Exterior
    this._createBeacon(10, 0, 48, 0xffaa00);

    // Entrance Blast Hatch
    this._createDoor('entrance_hatch', 0, 0, 36, 4.0, 3.5);

    // 2. ZONE 2: MAINTENANCE TUNNELS & RELAY A (Z: 18 to 36, X: -12 to 12)
    this._createRoom('maintenance_tunnel', 0, 0, 27, 20, 4.5, 18, {
      floorMat: this.materials.floor,
      wallMat: this.materials.wall
    });
    this._createRelayTerminal('A', -7, 0, 26, 'POWER RELAY A (MAINTENANCE)');

    // Tunnel to Research Wing Door
    this._createDoor('tunnel_door', -6, 0, 18, 3.5, 3.2);

    // 3. ZONE 3: RESEARCH WING & RELAY B (Z: 0 to 18, X: -26 to -4)
    this._createRoom('research_wing', -15, 0, 9, 22, 5.0, 18, {
      floorMat: this.materials.floor,
      wallMat: this.materials.wall
    });
    this._createRelayTerminal('B', -23, 0, 8, 'POWER RELAY B (RESEARCH LAB)');
    this._createBioContainment(-14, 0, 12);
    this._createBioContainment(-14, 0, 6);

    // 4. ZONE 4: SECURITY CONTROL ROOM (Z: 0 to 18, X: 4 to 26)
    this._createRoom('security_control', 15, 0, 9, 22, 5.0, 18, {
      floorMat: this.materials.floor,
      wallMat: this.materials.wall
    });
    this._createSecurityTerminal(22, 0, 9);
    // Observation Glass Window overlooking Arena
    this._createWindow(15, 1.5, 0, 10, 2.5);

    // 5. ZONE 5: SERVER ARCHIVE & RELAY C (Z: -18 to 0, X: -26 to -4)
    this._createRoom('server_archive', -15, 0, -9, 22, 5.5, 18, {
      floorMat: this.materials.floor,
      wallMat: this.materials.server
    });
    this._createRelayTerminal('C', -23, 0, -10, 'POWER RELAY C (SERVER ARCHIVE)');
    this._createIncidentLogTerminal(-8, 0, -12);

    // Server Racks
    for (let x = -20; x <= -10; x += 4) {
      this._createBox(x, 1.5, -4, 1.2, 3.0, 3.5, this.materials.server, true);
    }

    // 6. ZONE 6: LOCKDOWN ARENA (Z: -24 to 0, X: 0 to 28)
    this._createRoom('lockdown_arena', 14, 0, -12, 28, 8.0, 24, {
      floorMat: this.materials.floor,
      wallMat: this.materials.wall
    });
    // Arena Catwalks & Central Conduit
    this._createCatwalk(14, 3.2, -12, 18, 0.4, 4);
    this._createCentralConduit(14, 0, -12);
    // Arena Cover Barricades
    this._createBox(6, 0.6, -8, 2.5, 1.2, 0.8, this.materials.hazard, true);
    this._createBox(20, 0.6, -8, 2.5, 1.2, 0.8, this.materials.hazard, true);
    this._createBox(8, 0.6, -16, 2.5, 1.2, 0.8, this.materials.hazard, true);
    this._createBox(22, 0.6, -16, 2.5, 1.2, 0.8, this.materials.hazard, true);

    // Blast Door from Arena to Central Systems
    this._createDoor('arena_blast_door', 14, 0, -24, 4.5, 4.0);

    // 7. ZONE 7: CENTRAL SYSTEMS CHAMBER (Z: -48 to -24, X: -8 to 24)
    this._createRoom('central_systems', 8, 0, -36, 32, 9.0, 24, {
      floorMat: this.materials.floor,
      wallMat: this.materials.wall
    });
    this._createSingularityCore(8, 0, -36);

    // Blast Door to Extraction Evac Pad
    this._createDoor('evac_blast_door', 8, 0, -48, 5.0, 4.5);

    // 8. ZONE 8: EXTRACTION EVAC PAD (Z: -70 to -48, X: -8 to 24)
    this._createRoom('extraction_pad', 8, 0, -59, 32, 10.0, 22, {
      floorMat: this.materials.exteriorFloor,
      wallMat: this.materials.darkWall,
      openCeiling: true
    });
    this._createExtractionZone(8, 0, -60, 6.0);
    this._createBeacon(20, 0, -64, 0x00ff88);
  }

  _createRoom(name, cx, cy, cz, width, height, depth, options = {}) {
    const hw = width / 2;
    const hh = height;
    const hd = depth / 2;

    // Floor
    const floorGeo = new THREE.BoxGeometry(width, 0.2, depth);
    const floor = new THREE.Mesh(floorGeo, options.floorMat || this.materials.floor);
    floor.position.set(cx, cy - 0.1, cz);
    floor.receiveShadow = true;
    this.meshGroup.add(floor);
    this.colliders.push(floor);

    // Ceiling (if not open)
    if (!options.openCeiling) {
      const ceilGeo = new THREE.BoxGeometry(width, 0.2, depth);
      const ceil = new THREE.Mesh(ceilGeo, options.wallMat || this.materials.darkWall);
      ceil.position.set(cx, cy + hh + 0.1, cz);
      this.meshGroup.add(ceil);
    }

    // Outer boundary walls
    const wallThick = 0.4;
    // North (Z - hd)
    this._createBox(cx, cy + hh / 2, cz - hd, width, hh, wallThick, options.wallMat || this.materials.wall, true);
    // South (Z + hd)
    this._createBox(cx, cy + hh / 2, cz + hd, width, hh, wallThick, options.wallMat || this.materials.wall, true);
    // West (X - hw)
    this._createBox(cx - hw, cy + hh / 2, cz, wallThick, hh, depth, options.wallMat || this.materials.wall, true);
    // East (X + hw)
    this._createBox(cx + hw, cy + hh / 2, cz, wallThick, hh, depth, options.wallMat || this.materials.wall, true);
  }

  _createBox(x, y, z, w, h, d, material, isCollider = true) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.meshGroup.add(mesh);
    if (isCollider) this.colliders.push(mesh);
    return mesh;
  }

  _createDoor(id, x, y, z, w, h) {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(x, y, z);

    const doorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.3), this.materials.hazard);
    doorMesh.position.set(0, h / 2, 0);
    doorGroup.add(doorMesh);

    this.meshGroup.add(doorGroup);
    this.colliders.push(doorMesh);

    const doorData = {
      id,
      group: doorGroup,
      mesh: doorMesh,
      isOpen: false,
      isLocked: true,
      openProgress: 0,
      baseY: y,
      openHeight: h + 0.5
    };
    this.doors.push(doorData);
    return doorData;
  }

  _createRelayTerminal(relayId, x, y, z, label) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Console base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), this.materials.darkWall);
    base.position.y = 0.7;
    group.add(base);
    this.colliders.push(base);

    // Screen
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.05), this.materials.relayGlow);
    screen.position.set(0, 1.1, 0.41);
    group.add(screen);

    // Light
    const light = new THREE.PointLight(0x00f0ff, 1.2, 6);
    light.position.set(0, 1.2, 0.6);
    group.add(light);

    this.meshGroup.add(group);

    const relayData = {
      id: relayId,
      position: new THREE.Vector3(x, y, z),
      group,
      screen,
      light,
      label,
      isActivated: false
    };
    this.relays.push(relayData);
    return relayData;
  }

  _createSecurityTerminal(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.4, 1.0), this.materials.darkWall);
    base.position.y = 0.7;
    group.add(base);
    this.colliders.push(base);

    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 0.05), this.materials.relayGlow);
    screen.position.set(0, 1.1, 0.51);
    group.add(screen);

    const light = new THREE.PointLight(0x00f0ff, 1.5, 8);
    light.position.set(0, 1.4, 0.7);
    group.add(light);

    this.meshGroup.add(group);

    this.securityTerminal = {
      position: new THREE.Vector3(x, y, z),
      group,
      screen,
      light,
      isHacked: false
    };
  }

  _createIncidentLogTerminal(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 0.8), this.materials.darkWall);
    base.position.y = 0.7;
    group.add(base);
    this.colliders.push(base);

    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.05), this.materials.containmentGlow);
    screen.position.set(0, 1.1, 0.41);
    group.add(screen);

    this.meshGroup.add(group);

    this.incidentLogTerminal = {
      position: new THREE.Vector3(x, y, z),
      group,
      screen,
      isRead: false
    };
  }

  _createSingularityCore(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Shattered glass containment ring
    const core = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 5.0, 16, 1, true), this.materials.glass);
    core.position.y = 2.5;
    group.add(core);

    // Anomaly pulsing sphere
    const anomaly = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), this.materials.containmentGlow);
    anomaly.position.y = 2.5;
    group.add(anomaly);
    this.anomalyMesh = anomaly;

    // Glowing core light
    const coreLight = new THREE.PointLight(0xff0044, 3.5, 22);
    coreLight.position.y = 2.5;
    group.add(coreLight);
    this.singularityLight = coreLight;

    this.meshGroup.add(group);

    this.centralSystemsCore = {
      position: new THREE.Vector3(x, y, z),
      radius: 5.5,
      isDiscovered: false
    };
  }

  _createExtractionZone(x, y, z, radius = 6.0) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.1, 24), this.materials.hazard);
    pad.position.set(x, y + 0.05, z);
    this.meshGroup.add(pad);

    const marker = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.85, 0.15, 8, 24), this.materials.relayGlow);
    marker.rotation.x = Math.PI / 2;
    marker.position.set(x, y + 0.1, z);
    this.meshGroup.add(marker);

    this.extractionZone = {
      position: new THREE.Vector3(x, y, z),
      radius
    };
  }

  _createBioContainment(x, y, z) {
    const vat = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.2, 12), this.materials.glass);
    vat.position.set(x, y + 1.6, z);
    this.meshGroup.add(vat);
    this.colliders.push(vat);
  }

  _createCatwalk(x, y, z, w, h, d) {
    this._createBox(x, y, z, w, h, d, this.materials.hazard, true);
  }

  _createCentralConduit(x, y, z) {
    const conduit = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 8.0, 12), this.materials.pipeMat);
    conduit.position.set(x, y + 4.0, z);
    this.meshGroup.add(conduit);
    this.colliders.push(conduit);
  }

  _createBeacon(x, y, z, colorHex) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 6.0, 8), this.materials.darkWall);
    tower.position.set(x, y + 3.0, z);
    this.meshGroup.add(tower);
    this.colliders.push(tower);

    const light = new THREE.PointLight(colorHex, 2.5, 18);
    light.position.set(x, y + 6.2, z);
    this.meshGroup.add(light);
  }

  _createWindow(x, y, z, w, h) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), this.materials.glass);
    win.position.set(x, y, z);
    this.meshGroup.add(win);
    this.colliders.push(win);
  }

  _setupPickups() {
    // Health & Ammo in Maintenance, Labs, Server, Arena
    this.pickupManager.spawnPickup('health', -4, 0, 22);
    this.pickupManager.spawnPickup('ammo', 4, 0, 22);
    this.pickupManager.spawnPickup('armor', -18, 0, 4);
    this.pickupManager.spawnPickup('ammo', -18, 0, 14);
    this.pickupManager.spawnPickup('health', -12, 0, -12);
    this.pickupManager.spawnPickup('ammo', 8, 0, -10);
    this.pickupManager.spawnPickup('armor', 20, 0, -14);
    this.pickupManager.spawnPickup('ammo', 8, 0, -32);
    this.pickupManager.spawnPickup('health', 8, 0, -42);
  }

  _setupEncounters() {
    const em = this.game.enemyManager;
    if (!em) return;
    em.clearAll();

    // 1. Maintenance Tunnels: 1 Enforcer
    const e1 = em.spawnEnemy('enforcer', 0, 0, 22);
    e1.setPatrolWaypoints([new THREE.Vector3(-4, 0, 22), new THREE.Vector3(4, 0, 22)]);

    // 2. Research Wing: 1 Security Drone + 1 Phantom
    const drone1 = new SecurityDrone(this.game, -12, 2.8, 8);
    drone1.setPatrolWaypoints([new THREE.Vector3(-18, 2.8, 8), new THREE.Vector3(-8, 2.8, 8)]);
    em.enemies.push(drone1);

    const phantom1 = new Phantom(this.game, -20, 0, 12);
    em.enemies.push(phantom1);

    // 3. Server Archive: 1 Phantom + 1 Enforcer
    const phantom2 = new Phantom(this.game, -14, 0, -14);
    em.enemies.push(phantom2);
    const e2 = em.spawnEnemy('enforcer', -18, 0, -6);
    em.enemies.push(e2);

    // 4. Arena: 1 Security Drone + 1 Juggernaut
    const drone2 = new SecurityDrone(this.game, 14, 3.2, -12);
    drone2.setPatrolWaypoints([new THREE.Vector3(8, 3.2, -12), new THREE.Vector3(20, 3.2, -12)]);
    em.enemies.push(drone2);

    const jugg = em.spawnEnemy('juggernaut', 14, 0, -16);
    em.enemies.push(jugg);
  }

  spawnLockdownReinforcements() {
    console.log('[Level02] Alert! Spawning Mission 02 Lockdown Wave (Drones, Phantoms, Enforcers)...');
    const em = this.game.enemyManager;
    if (!em) return;

    // Spawn 2 Drones, 2 Phantoms, 2 Enforcers in Arena
    const wave = [
      { type: 'drone', x: 8, y: 3.5, z: -8 },
      { type: 'drone', x: 20, y: 3.5, z: -16 },
      { type: 'phantom', x: 6, y: 0, z: -14 },
      { type: 'phantom', x: 22, y: 0, z: -14 },
      { type: 'enforcer', x: 14, y: 0, z: -6 },
      { type: 'enforcer', x: 14, y: 0, z: -20 }
    ];

    wave.forEach(w => {
      if (w.type === 'drone') {
        const d = new SecurityDrone(this.game, w.x, w.y, w.z);
        if (this.game.player) d.lastKnownPlayerPos.copy(this.game.player.position);
        d.state = 'CHASE';
        em.enemies.push(d);
      } else if (w.type === 'phantom') {
        const p = new Phantom(this.game, w.x, w.y, w.z);
        p.phantomState = 'AMBUSH';
        em.enemies.push(p);
      } else {
        const e = em.spawnEnemy(w.type, w.x, w.y, w.z);
        if (this.game.player) e.lastKnownPlayerPos.copy(this.game.player.position);
        e.state = 'CHASE';
      }
    });
  }

  _setupRain() {
    // 250 Rain particles over exterior zone (Z: 36 to 52)
    const count = 250;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 12;
      pos[i * 3 + 2] = 36 + Math.random() * 18;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x88bbdd,
      size: 0.12,
      transparent: true,
      opacity: 0.6
    });

    this.rainParticles = new THREE.Points(geo, mat);
    this.meshGroup.add(this.rainParticles);
  }

  openDoor(doorId) {
    const door = this.doors.find(d => d.id === doorId);
    if (door) {
      door.isOpen = true;
      door.isLocked = false;
      console.log(`[Level02] Door opened: ${doorId}`);
    }
  }

  closeDoor(doorId) {
    const door = this.doors.find(d => d.id === doorId);
    if (door) {
      door.isOpen = false;
      door.isLocked = true;
      door.openProgress = 0;
      if (door.mesh) door.mesh.position.y = door.baseY + 1.75;
      console.log(`[Level02] Door closed: ${doorId}`);
    }
  }

  onRelayActivated(relayId) {
    const relay = this.relays.find(r => r.id === relayId);
    if (relay) {
      relay.isActivated = true;
      relay.screen.material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
      relay.light.color.setHex(0x00ff88);
    }
  }

  onPowerStateChange(state) {
    if (state === PowerState.AUXILIARY) {
      this.openDoor('entrance_hatch');
      this.openDoor('tunnel_door');
    } else if (state === PowerState.FULL) {
      this.openDoor('arena_blast_door');
    } else if (state === PowerState.LOCKDOWN) {
      this.closeDoor('arena_blast_door');
      this.closeDoor('evac_blast_door');
    } else if (state === PowerState.CRITICAL) {
      this.openDoor('arena_blast_door');
      this.openDoor('evac_blast_door');
    }
  }

  update(delta) {
    this.powerManager.update(delta);
    this.pickupManager.update(delta);

    // Update Rain Particles
    if (this.rainParticles) {
      const pos = this.rainParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] -= delta * 18;
        if (pos[i] < 0) pos[i] = 12;
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Update Door Animations
    this.doors.forEach(d => {
      if (d.isOpen && d.openProgress < 1) {
        d.openProgress = Math.min(1, d.openProgress + delta * 2.5);
        d.mesh.position.y = d.baseY + 1.75 + d.openProgress * d.openHeight;
      } else if (!d.isOpen && d.openProgress > 0) {
        d.openProgress = Math.max(0, d.openProgress - delta * 2.5);
        d.mesh.position.y = d.baseY + 1.75 + d.openProgress * d.openHeight;
      }
    });

    // Pulse Singularity Core Anomaly
    if (this.anomalyMesh) {
      this.anomalyMesh.rotation.y += delta * 1.5;
      const s = 1.0 + Math.sin(Date.now() * 0.005) * 0.15;
      this.anomalyMesh.scale.set(s, s, s);
    }
  }

  getRaycastMeshes() {
    return this.colliders;
  }

  cleanup() {
    this.meshGroup.children.forEach(c => this.meshGroup.remove(c));
    this.game.scene.remove(this.meshGroup);
    this.colliders = [];
    this.doors = [];
    this.relays = [];
  }

  reset() {
    this.doors.forEach(d => {
      d.isOpen = false;
      d.isLocked = true;
      d.openProgress = 0;
      d.mesh.position.y = d.baseY + 1.75;
    });
    this.powerManager.reset();
    this.pickupManager.reset();
    this._setupEncounters();
  }
}
