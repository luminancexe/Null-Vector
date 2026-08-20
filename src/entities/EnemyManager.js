/**
 * EnemyManager.js
 * Spawns, manages, and updates enemy AI units and reinforcement waves.
 */

import * as THREE from 'three';
import { Enemy, EnemyState } from './Enemy.js';

export class EnemyManager {
  constructor(game) {
    this.game = game;
    this.enemies = [];
    this.spawnPoints = [];

    this._setupInitialEncounters();
  }

  _setupInitialEncounters() {
    // 1. Entrance / Checkpoint Patrol (Enforcer)
    const e1 = this.spawnEnemy('enforcer', 0, 0, 14);
    e1.setPatrolWaypoints([
      new THREE.Vector3(-4, 0, 14),
      new THREE.Vector3(4, 0, 14)
    ]);

    // 2. Cargo Bay Patrols
    const e2 = this.spawnEnemy('enforcer', -10, 0, -8);
    e2.setPatrolWaypoints([
      new THREE.Vector3(-10, 0, -2),
      new THREE.Vector3(-10, 0, -14)
    ]);

    const e3 = this.spawnEnemy('enforcer', 10, 0, -8);
    e3.setPatrolWaypoints([
      new THREE.Vector3(10, 0, -14),
      new THREE.Vector3(10, 0, -2)
    ]);

    const e4 = this.spawnEnemy('spectre', 0, 0, -18);
    e4.setPatrolWaypoints([
      new THREE.Vector3(-8, 0, -18),
      new THREE.Vector3(8, 0, -18)
    ]);

    // 3. Server Core Guardians (Heavy Juggernaut + Enforcer)
    const jugg = this.spawnEnemy('juggernaut', -32, 0, -12);
    jugg.setPatrolWaypoints([
      new THREE.Vector3(-36, 0, -12),
      new THREE.Vector3(-28, 0, -12)
    ]);

    const e5 = this.spawnEnemy('enforcer', -26, 0, -6);
    e5.setPatrolWaypoints([
      new THREE.Vector3(-26, 0, -6),
      new THREE.Vector3(-36, 0, -6)
    ]);

    // 4. Reactor Corridor Guards
    const e6 = this.spawnEnemy('enforcer', 0, 0, -32);
    e6.setPatrolWaypoints([
      new THREE.Vector3(-4, 0, -32),
      new THREE.Vector3(4, 0, -32)
    ]);

    const e7 = this.spawnEnemy('spectre', 0, 0, -36);
    e7.setPatrolWaypoints([
      new THREE.Vector3(4, 0, -36),
      new THREE.Vector3(-4, 0, -36)
    ]);
  }

  spawnEnemy(typeKey, x, y, z) {
    const enemy = new Enemy(this.game, typeKey, x, y, z);
    this.enemies.push(enemy);
    return enemy;
  }

  spawnReinforcementWave() {
    console.log('[EnemyManager] Alert! Spawning lockdown reinforcement wave...');
    // Spawn in Cargo Bay & Reactor
    const wave = [
      { type: 'spectre', pos: [0, 0, -16] },
      { type: 'enforcer', pos: [-12, 0, -6] },
      { type: 'enforcer', pos: [12, 0, -6] },
      { type: 'juggernaut', pos: [0, 0, -28] }
    ];

    wave.forEach(w => {
      const e = this.spawnEnemy(w.type, w.pos[0], w.pos[1], w.pos[2]);
      if (this.game.player) {
        e.lastKnownPlayerPos.copy(this.game.player.position);
        e.state = EnemyState.CHASE;
      }
    });
  }

  getRaycastMeshes() {
    const meshes = [];
    for (let i = 0; i < this.enemies.length; i++) {
      const e = this.enemies[i];
      if (e.state !== EnemyState.DEAD) {
        meshes.push(...e.getHitMeshes());
      }
    }
    return meshes;
  }

  getLivingCount() {
    return this.enemies.filter(e => e.state !== EnemyState.DEAD).length;
  }

  update(delta) {
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].update(delta);
    }
  }

  reset() {
    // Remove all old enemy groups from scene
    this.enemies.forEach(e => {
      if (e.group) this.game.scene.remove(e.group);
    });
    this.enemies = [];
    this._setupInitialEncounters();
  }
}
