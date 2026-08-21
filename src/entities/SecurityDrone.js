/**
 * SecurityDrone.js
 * Airborne robotic security unit for Mission 02: Blackout.
 * Features hovering flight dynamics, tilt-rotor animations, searchlight detection cone,
 * rapid plasma blasters, alert broadcast to ground units, and crash/explosion death physics.
 */

import * as THREE from 'three';
import { EnemyState } from './Enemy.js';

export class SecurityDrone {
  constructor(game, x = 0, y = 2.5, z = 0) {
    this.game = game;
    this.position = new THREE.Vector3(x, y, z);
    this.targetAltitude = y;
    this.hoverTime = Math.random() * Math.PI * 2;

    this.health = 80;
    this.maxHealth = 80;
    this.isDead = false;
    this.state = EnemyState.PATROL;

    // Combat & Detection
    this.detectionRadius = 22;
    this.attackRange = 18;
    this.fireTimer = 0;
    this.burstCount = 0;
    this.isBursting = false;
    this.burstTimer = 0;
    this.damagePerShot = 6;

    // Movement & Waypoints
    this.speed = 6.5;
    this.waypoints = [];
    this.currentWaypointIdx = 0;
    this.lastKnownPlayerPos = new THREE.Vector3();
    this.strafeAngle = Math.random() * Math.PI * 2;

    // 3D Scene Graph
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.hitMeshes = [];

    this._buildModel();
    this.game.scene.add(this.group);
  }

  _buildModel() {
    const darkMetal = new THREE.MeshStandardMaterial({ color: 0x181e28, roughness: 0.35, metalness: 0.85 });
    const gunMetal = new THREE.MeshStandardMaterial({ color: 0x2e3b4e, roughness: 0.5, metalness: 0.7 });
    const rotorMat = new THREE.MeshStandardMaterial({ color: 0x0c0f14, roughness: 0.8, metalness: 0.2 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const alertEyeMat = new THREE.MeshBasicMaterial({ color: 0xff2244 });
    this.eyeMat = eyeMat;
    this.alertEyeMat = alertEyeMat;

    // 1. Central Chassis Sphere
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), darkMetal);
    body.scale.set(1.2, 0.8, 1.0);
    this.group.add(body);
    this.hitMeshes.push(body);

    // 2. Optical Sensor Eye
    this.eyeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), eyeMat);
    this.eyeMesh.position.set(0, 0, -0.32);
    this.group.add(this.eyeMesh);

    // 3. Left Thruster Rotor
    this.leftRotor = new THREE.Group();
    this.leftRotor.position.set(-0.55, 0.1, 0);
    const podL = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10), gunMetal);
    const bladesL = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.06), rotorMat);
    this.bladesL = bladesL;
    this.leftRotor.add(podL);
    this.leftRotor.add(bladesL);
    this.group.add(this.leftRotor);

    // 4. Right Thruster Rotor
    this.rightRotor = new THREE.Group();
    this.rightRotor.position.set(0.55, 0.1, 0);
    const podR = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10), gunMetal);
    const bladesR = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.06), rotorMat);
    this.bladesR = bladesR;
    this.rightRotor.add(podR);
    this.rightRotor.add(bladesR);
    this.group.add(this.rightRotor);

    // 5. Underside Twin Blaster Cannons
    const gunL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), darkMetal);
    gunL.rotation.x = Math.PI / 2;
    gunL.position.set(-0.16, -0.22, -0.15);
    this.group.add(gunL);

    const gunR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 8), darkMetal);
    gunR.rotation.x = Math.PI / 2;
    gunR.position.set(0.16, -0.22, -0.15);
    this.group.add(gunR);

    // 6. Searchlight Cone (Visual + Spot)
    this.searchlight = new THREE.SpotLight(0x00f0ff, 2.5, 20, 0.45, 0.5);
    this.searchlight.position.set(0, -0.2, 0);
    this.searchlightTarget = new THREE.Object3D();
    this.searchlightTarget.position.set(0, -10, -5);
    this.group.add(this.searchlightTarget);
    this.searchlight.target = this.searchlightTarget;
    this.group.add(this.searchlight);

    // Link hit meshes to instance
    this.hitMeshes.forEach(m => {
      m.userData = { enemy: this, isHeadshot: false };
    });
    this.eyeMesh.userData = { enemy: this, isHeadshot: true };
    this.hitMeshes.push(this.eyeMesh);
  }

  setPatrolWaypoints(waypoints) {
    this.waypoints = waypoints;
    this.currentWaypointIdx = 0;
  }

  getHitMeshes() {
    return this.isDead ? [] : this.hitMeshes;
  }

  takeDamage(amount, hitPos, isHeadshot = false) {
    if (this.isDead) return;

    const actualDmg = isHeadshot ? amount * 1.5 : amount;
    this.health -= actualDmg;

    // Flash hit
    if (this.game.particleManager) {
      this.game.particleManager.spawnSparks(hitPos, 6);
    }

    if (this.state === EnemyState.PATROL || this.state === EnemyState.SEARCH) {
      this.state = EnemyState.CHASE;
      this._alertNearbyEnemies();
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  _alertNearbyEnemies() {
    if (this.game.audioManager) {
      this.game.audioManager.playDroneAlert();
    }
    this.eyeMesh.material = this.alertEyeMat;
    this.searchlight.color.setHex(0xff2244);

    // Alert other enemies within 25m
    if (this.game.enemyManager) {
      this.game.enemyManager.enemies.forEach(e => {
        if (e !== this && e.state !== EnemyState.DEAD) {
          if (e.position.distanceTo(this.position) < 25) {
            if (e.state === EnemyState.PATROL) {
              e.state = EnemyState.CHASE;
              if (this.game.player) e.lastKnownPlayerPos.copy(this.game.player.position);
            }
          }
        }
      });
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.state = EnemyState.DEAD;

    if (this.game.particleManager) {
      this.game.particleManager.spawnExplosion(this.position, 0x00f0ff);
      this.game.particleManager.spawnSparks(this.position, 16);
    }

    if (this.game.stats) {
      this.game.stats.kills++;
    }

    if (this.game.objectiveManager && typeof this.game.objectiveManager.onEnemyKilled === 'function') {
      this.game.objectiveManager.onEnemyKilled(this);
    }

    // Drop to floor and remove
    this.searchlight.visible = false;
    this.group.position.y = 0.2;
    this.group.rotation.z = 0.8;

    setTimeout(() => {
      this.game.scene.remove(this.group);
    }, 4000);
  }

  update(delta) {
    if (this.isDead) return;

    // Hover Sine wave & Rotor Spin
    this.hoverTime += delta * 4;
    const hoverY = Math.sin(this.hoverTime) * 0.15;
    if (this.bladesL) this.bladesL.rotation.y += delta * 25;
    if (this.bladesR) this.bladesR.rotation.y -= delta * 25;

    const player = this.game.player;
    if (!player || player.isDead) return;

    const distToPlayer = this.position.distanceTo(player.position);

    // State Machine
    switch (this.state) {
      case EnemyState.PATROL:
        this._updatePatrol(delta);
        if (distToPlayer < this.detectionRadius && this._hasLineOfSight(player.position)) {
          this.state = EnemyState.DETECT;
          this._alertNearbyEnemies();
        }
        break;

      case EnemyState.DETECT:
      case EnemyState.CHASE:
        this._updateChase(delta, player.position, distToPlayer);
        if (distToPlayer <= this.attackRange && this._hasLineOfSight(player.position)) {
          this.state = EnemyState.ATTACK;
        }
        break;

      case EnemyState.ATTACK:
        this._updateAttack(delta, player, distToPlayer);
        break;
    }

    this.group.position.copy(this.position);
    this.group.position.y = this.targetAltitude + hoverY;
  }

  _updatePatrol(delta) {
    if (this.waypoints.length === 0) return;
    const targetWp = this.waypoints[this.currentWaypointIdx];
    const dir = new THREE.Vector3().subVectors(targetWp, this.position);
    dir.y = 0;
    const dist = dir.length();

    if (dist < 1.0) {
      this.currentWaypointIdx = (this.currentWaypointIdx + 1) % this.waypoints.length;
    } else {
      dir.normalize();
      this.position.x += dir.x * (this.speed * 0.6) * delta;
      this.position.z += dir.z * (this.speed * 0.6) * delta;
      this.group.rotation.y = Math.atan2(-dir.x, -dir.z);
    }
  }

  _updateChase(delta, targetPos, distToPlayer) {
    const dir = new THREE.Vector3().subVectors(targetPos, this.position);
    dir.y = 0;
    dir.normalize();

    this.position.x += dir.x * this.speed * delta;
    this.position.z += dir.z * this.speed * delta;

    // Face player
    this.group.rotation.y = Math.atan2(
      -(targetPos.x - this.position.x),
      -(targetPos.z - this.position.z)
    );
  }

  _updateAttack(delta, player, distToPlayer) {
    // Face player
    this.group.rotation.y = Math.atan2(
      -(player.position.x - this.position.x),
      -(player.position.z - this.position.z)
    );

    // Orbit/strafe around player
    this.strafeAngle += delta * 0.8;
    const idealDist = 12;
    const strafeX = player.position.x + Math.cos(this.strafeAngle) * idealDist;
    const strafeZ = player.position.z + Math.sin(this.strafeAngle) * idealDist;

    this.position.x += (strafeX - this.position.x) * delta * 1.5;
    this.position.z += (strafeZ - this.position.z) * delta * 1.5;

    // Firing Bursts (3 rapid shots)
    this.fireTimer -= delta;
    if (this.fireTimer <= 0 && !this.isBursting) {
      this.isBursting = true;
      this.burstCount = 3;
      this.burstTimer = 0;
      this.fireTimer = 1.4;
    }

    if (this.isBursting) {
      this.burstTimer -= delta;
      if (this.burstTimer <= 0) {
        this.burstTimer = 0.12;
        this.burstCount--;
        this._shootAtPlayer(player);
        if (this.burstCount <= 0) {
          this.isBursting = false;
        }
      }
    }

    if (distToPlayer > this.attackRange + 5 || !this._hasLineOfSight(player.position)) {
      this.state = EnemyState.CHASE;
    }
  }

  _shootAtPlayer(player) {
    if (this.game.audioManager) {
      this.game.audioManager.playDroneShoot();
    }

    const startPos = this.position.clone();
    startPos.y += 0.2;
    const targetPos = player.position.clone();
    targetPos.y += 1.4;

    // Inaccuracy spread
    targetPos.x += (Math.random() - 0.5) * 0.8;
    targetPos.y += (Math.random() - 0.5) * 0.6;
    targetPos.z += (Math.random() - 0.5) * 0.8;

    if (this.game.particleManager) {
      this.game.particleManager.spawnBulletTracer(startPos, targetPos, 0x00f0ff);
    }

    // Damage check
    const dir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
    const ray = new THREE.Raycaster(startPos, dir, 0, 30);
    const colliders = this.game.colliders || [];
    const hits = ray.intersectObjects(colliders, false);

    const playerDist = startPos.distanceTo(player.position);
    let wallBlocked = false;
    if (hits.length > 0 && hits[0].distance < playerDist) {
      wallBlocked = true;
    }

    if (!wallBlocked && Math.random() < 0.75) {
      player.takeDamage(this.damagePerShot);
    }
  }

  _hasLineOfSight(targetPos) {
    const from = this.position.clone();
    from.y += 0.5;
    const to = targetPos.clone();
    to.y += 1.2;

    const dir = new THREE.Vector3().subVectors(to, from);
    const dist = dir.length();
    dir.normalize();

    const ray = new THREE.Raycaster(from, dir, 0, dist);
    const colliders = this.game.colliders || [];
    const hits = ray.intersectObjects(colliders, false);

    return hits.length === 0;
  }
}
