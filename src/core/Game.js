/**
 * Game.js
 * Master engine coordinator for Null Vector:
 * Three.js scene, camera, renderer, audio, physics, level, weapons, enemies, particles, and objectives.
 */

import * as THREE from 'three';
import { InputManager } from './InputManager.js';
import { AudioManager } from './AudioManager.js';
import { StorageManager } from './StorageManager.js';
import { Player } from '../entities/Player.js';
import { WeaponManager } from '../entities/WeaponManager.js';
import { ShootingSystem } from '../systems/ShootingSystem.js';
import { Level } from '../level/Level.js';
import { EnemyManager } from '../entities/EnemyManager.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { DecalManager } from '../systems/DecalManager.js';
import { ObjectiveManager } from '../systems/ObjectiveManager.js';
import { UIManager } from '../ui/UIManager.js';

export const GameState = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  DEAD: 'DEAD',
  VICTORY: 'VICTORY'
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.state = GameState.LOADING;
    
    // Engine Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    
    // Core Subsystems
    this.input = new InputManager(this.canvas);
    this.audioManager = new AudioManager();
    this.settings = StorageManager.loadSettings();

    // Game Subsystems
    this.player = null;
    this.weaponManager = null;
    this.shootingSystem = null;
    this.level = null;
    this.enemyManager = null;
    this.particleManager = null;
    this.decalManager = null;
    this.objectiveManager = null;
    this.uiManager = null;
    
    // Colliders list
    this.colliders = [];
    
    // Mission & Combat Stats
    this.stats = {
      playTime: 0,
      kills: 0,
      headshots: 0,
      shotsFired: 0,
      shotsHit: 0
    };
    
    this._initEngine();
    this._applyLoadedSettings();
    this._initWorld();
    this._bindEvents();
  }

  _initEngine() {
    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080d);
    this.scene.fog = new THREE.FogExp2(0x06080d, 0.022);

    // 2. Camera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(this.settings.fov || 75, aspect, 0.05, 1000);
    this.camera.position.set(0, 1.65, 32);
    this.camera.rotation.order = 'YXZ';
    this.scene.add(this.camera);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    // 4. Global Lighting
    const ambientLight = new THREE.AmbientLight(0x1a2636, 0.9);
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x3a5578, 0x0a0f18, 0.6);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0x8bc4ff, 1.5);
    dirLight.position.set(15, 45, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const shadowDist = 45;
    dirLight.shadow.camera.left = -shadowDist;
    dirLight.shadow.camera.right = shadowDist;
    dirLight.shadow.camera.top = shadowDist;
    dirLight.shadow.camera.bottom = -shadowDist;
    dirLight.shadow.bias = -0.0004;
    this.scene.add(dirLight);

    console.log('[Null Vector] Engine initialized.');
  }

  _applyLoadedSettings() {
    if (this.input) {
      this.input.sensitivity = this.settings.sensitivity || 1.5;
      this.input.invertY = !!this.settings.invertY;
    }
    if (this.audioManager) {
      this.audioManager.setVolumes(
        this.settings.masterVolume ?? 80,
        this.settings.sfxVolume ?? 90,
        this.settings.musicVolume ?? 60
      );
    }
    if (this.camera) {
      this.camera.fov = this.settings.fov || 75;
      this.camera.updateProjectionMatrix();
    }
  }

  _initWorld() {
    // 1. Player
    this.player = new Player(this);
    this.player.baseFov = this.settings.fov || 75;

    // 2. Weapons & Systems
    this.weaponManager = new WeaponManager(this);
    this.shootingSystem = new ShootingSystem(this);
    this.particleManager = new ParticleSystem(this);
    this.decalManager = new DecalManager(this);

    // 3. Level Geometry & Facility
    this.level = new Level(this);

    // 4. Enemy AI Manager
    this.enemyManager = new EnemyManager(this);

    // 5. Objective System
    this.objectiveManager = new ObjectiveManager(this);

    // 6. UI Manager
    this.uiManager = new UIManager(this);
  }

  _bindEvents() {
    window.addEventListener('resize', () => this.onResize());

    this.canvas.addEventListener('click', () => {
      if (this.state === GameState.PLAYING && !this.input.isLocked) {
        this.input.requestPointerLock();
      }
    });

    this.input.onLockChange((isLocked) => {
      if (!isLocked && this.state === GameState.PLAYING) {
        this.setState(GameState.PAUSED);
      }
    });
  }

  onResize() {
    if (!this.camera || !this.renderer) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  setState(newState) {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    console.log(`[GameState] ${oldState} -> ${newState}`);

    if (this.uiManager) {
      this.uiManager.onStateChange(oldState, newState);
    }

    if (this.weaponManager) {
      this.weaponManager.showViewmodel(newState === GameState.PLAYING);
    }

    if (newState === GameState.PLAYING) {
      this.input.requestPointerLock();
      this.audioManager?.resume();
    } else {
      this.input.exitPointerLock();
    }
  }

  restartMission() {
    console.log('[Null Vector] Restarting mission...');
    // Reset stats
    this.stats = {
      playTime: 0,
      kills: 0,
      headshots: 0,
      shotsFired: 0,
      shotsHit: 0
    };

    // Reset player
    if (this.player) {
      this.player.setSpawn(0, 0, 32, 0);
    }

    // Reset weapons
    if (this.weaponManager) {
      Object.values(this.weaponManager.weapons).forEach(w => w.reset());
      this.weaponManager.equipSlot(1);
    }

    // Reset enemies
    if (this.enemyManager) {
      this.enemyManager.reset();
    }

    // Reset level pickups & doors
    if (this.level) {
      this.level.pickupManager.reset();
      this.level.doors.forEach(d => {
        d.isOpen = false;
        d.isLocked = true;
        d.openProgress = 0;
      });
      if (this.level.securityTerminal) {
        this.level.securityTerminal.isHacked = false;
      }
      this.level.isLockdown = false;
      this.level.alarmLights.forEach(l => this.scene.remove(l));
      this.level.alarmLights = [];
    }

    // Reset decals
    if (this.decalManager) {
      this.decalManager.reset();
    }

    // Reset objectives
    if (this.objectiveManager) {
      this.objectiveManager.reset();
    }

    if (this.uiManager) {
      this.uiManager.updateHUD();
    }

    this.setState(GameState.PLAYING);
  }

  start() {
    this.clock.start();
    this._loop();
  }

  _loop() {
    requestAnimationFrame(() => this._loop());

    let delta = this.clock.getDelta();
    if (delta > 0.1) delta = 0.1;

    this._update(delta);
    this._render();
  }

  _update(delta) {
    if (this.state === GameState.PLAYING) {
      this.stats.playTime += delta;

      if (this.player) this.player.update(delta);
      if (this.weaponManager) this.weaponManager.update(delta);
      if (this.enemyManager) this.enemyManager.update(delta);
      if (this.particleManager) this.particleManager.update(delta);
      if (this.level) this.level.update(delta);
      if (this.objectiveManager) this.objectiveManager.update(delta);
    }

    if (this.uiManager) this.uiManager.update(delta);
    this.input.update();
  }

  _render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
