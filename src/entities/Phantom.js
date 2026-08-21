/**
 * Phantom.js
 * Stealth cybernetic infiltrator for Mission 02: Blackout.
 * Features translucent refractive cloaking shimmer, stealth stalking, close-quarters ambush lunges,
 * tactical smoke-retreat & re-cloak cycling, and glowing red optical strike visors.
 */

import * as THREE from 'three';
import { EnemyState } from './Enemy.js';

export const PhantomState = {
  CLOAKED: 'CLOAKED',
  STALK: 'STALK',
  REVEAL: 'REVEAL',
  AMBUSH: 'AMBUSH',
  RETREAT: 'RETREAT',
  DEAD: 'DEAD'
};

export class Phantom {
  constructor(game, x = 0, y = 0, z = 0) {
    this.game = game;
    this.position = new THREE.Vector3(x, y, z);

    this.health = 65;
    this.maxHealth = 65;
    this.isDead = false;
    this.phantomState = PhantomState.CLOAKED;
    this.state = EnemyState.PATROL; // Compatibility with EnemyManager

    // Combat & Stealth
    this.speed = 8.2;
    this.revealDistance = 4.5;
    this.meleeRange = 2.2;
    this.meleeDamage = 28;
    this.attackCooldown = 0;
    this.retreatTimer = 0;
    this.cloakOpacity = 0.12;

    // Movement & Waypoints
    this.waypoints = [];
    this.currentWaypointIdx = 0;
    this.lastKnownPlayerPos = new THREE.Vector3();

    // 3D Scene Graph
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.hitMeshes = [];

    this._buildModel();
    this.game.scene.add(this.group);
  }

  _buildModel() {
    // Translucent Cloak Material
    this.stealthMat = new THREE.MeshStandardMaterial({
      color: 0x112233,
      roughness: 0.15,
      metalness: 0.95,
      transparent: true,
      opacity: 0.15,
      wireframe: false
    });

    this.solidMat = new THREE.MeshStandardMaterial({
      color: 0x10141c,
      roughness: 0.4,
      metalness: 0.8
    });

    this.visorMat = new THREE.MeshBasicMaterial({
      color: 0xff0033,
      transparent: true,
      opacity: 0.2
    });

    // 1. Slender Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.65, 0.22), this.stealthMat);
    torso.position.y = 1.15;
    this.group.add(torso);
    this.hitMeshes.push(torso);

    // 2. Head & Visor
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.26), this.stealthMat);
    head.position.y = 1.62;
    this.group.add(head);
    this.headMesh = head;
    this.hitMeshes.push(head);

    this.visorMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.08), this.visorMat);
    this.visorMesh.position.set(0, 1.62, -0.12);
    this.group.add(this.visorMesh);

    // 3. Dual Cybernetic Arm Blades
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.28, 1.3, 0);
    const lUpper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), this.stealthMat);
    lUpper.position.y = -0.15;
    const lBlade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.45, 0.06), this.visorMat);
    lBlade.position.set(0, -0.4, -0.1);
    lBlade.rotation.x = -0.4;
    this.leftArm.add(lUpper);
    this.leftArm.add(lBlade);
    this.group.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.28, 1.3, 0);
    const rUpper = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), this.stealthMat);
    rUpper.position.y = -0.15;
    const rBlade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.45, 0.06), this.visorMat);
    rBlade.position.set(0, -0.4, -0.1);
    rBlade.rotation.x = -0.4;
    this.rightArm.add(rUpper);
    this.rightArm.add(rBlade);
    this.group.add(this.rightArm);

    // 4. Legs
    const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.14), this.stealthMat);
    lLeg.position.set(-0.12, 0.4, 0);
    this.group.add(lLeg);

    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.14), this.stealthMat);
    rLeg.position.set(0.12, 0.4, 0);
    this.group.add(rLeg);

    // Link hit meshes
    torso.userData = { enemy: this, isHeadshot: false };
    head.userData = { enemy: this, isHeadshot: true };
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

    const actualDmg = isHeadshot ? amount * 2.0 : amount;
    this.health -= actualDmg;

    // Force reveal on hit
    this._setRevealed(true);
    if (this.game.particleManager) {
      this.game.particleManager.spawnSparks(hitPos, 8);
    }

    if (this.phantomState === PhantomState.CLOAKED || this.phantomState === PhantomState.STALK) {
      this.phantomState = PhantomState.AMBUSH;
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  _setRevealed(isRevealed) {
    if (isRevealed) {
      this.cloakOpacity = 0.95;
      this.stealthMat.opacity = 0.95;
      this.visorMat.opacity = 1.0;
      this.visorMat.color.setHex(0xff0022);
    } else {
      this.cloakOpacity = 0.12;
      this.stealthMat.opacity = 0.12;
      this.visorMat.opacity = 0.2;
      this.visorMat.color.setHex(0x00f0ff);
    }
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.phantomState = PhantomState.DEAD;
    this.state = EnemyState.DEAD;

    this._setRevealed(true);

    if (this.game.particleManager) {
      this.game.particleManager.spawnSparks(this.position, 18);
    }

    if (this.game.stats) {
      this.game.stats.kills++;
    }

    if (this.game.objectiveManager && typeof this.game.objectiveManager.onEnemyKilled === 'function') {
      this.game.objectiveManager.onEnemyKilled(this);
    }

    // Collapse
    this.group.rotation.x = Math.PI / 2;
    this.group.position.y = 0.15;

    setTimeout(() => {
      this.game.scene.remove(this.group);
    }, 4000);
  }

  update(delta) {
    if (this.isDead) return;

    if (this.attackCooldown > 0) this.attackCooldown -= delta;

    const player = this.game.player;
    if (!player || player.isDead) return;

    const distToPlayer = this.position.distanceTo(player.position);

    // State Machine
    switch (this.phantomState) {
      case PhantomState.CLOAKED:
      case PhantomState.STALK:
        this._setRevealed(false);
        this._updateStalk(delta, player.position, distToPlayer);
        if (distToPlayer <= this.revealDistance) {
          this.phantomState = PhantomState.REVEAL;
          if (this.game.audioManager) this.game.audioManager.playPhantomCloak();
        }
        break;

      case PhantomState.REVEAL:
        this._setRevealed(true);
        if (this.game.particleManager) {
          this.game.particleManager.spawnSparks(this.position, 3);
        }
        this.phantomState = PhantomState.AMBUSH;
        break;

      case PhantomState.AMBUSH:
        this._setRevealed(true);
        this._updateAmbush(delta, player, distToPlayer);
        break;

      case PhantomState.RETREAT:
        this._updateRetreat(delta, player.position);
        break;
    }

    this.group.position.copy(this.position);
  }

  _updateStalk(delta, targetPos, distToPlayer) {
    const dir = new THREE.Vector3().subVectors(targetPos, this.position);
    dir.y = 0;
    dir.normalize();

    this.position.x += dir.x * (this.speed * 0.7) * delta;
    this.position.z += dir.z * (this.speed * 0.7) * delta;

    this.group.rotation.y = Math.atan2(-dir.x, -dir.z);
  }

  _updateAmbush(delta, player, distToPlayer) {
    const dir = new THREE.Vector3().subVectors(player.position, this.position);
    dir.y = 0;
    dir.normalize();

    // High speed lunge
    this.position.x += dir.x * this.speed * 1.3 * delta;
    this.position.z += dir.z * this.speed * 1.3 * delta;
    this.group.rotation.y = Math.atan2(-dir.x, -dir.z);

    // Melee strike
    if (distToPlayer <= this.meleeRange && this.attackCooldown <= 0) {
      this.attackCooldown = 1.2;
      if (this.game.audioManager) this.game.audioManager.playPhantomAttack();
      player.takeDamage(this.meleeDamage);

      // Swing blade animations
      if (this.leftArm) this.leftArm.rotation.x = -1.2;
      if (this.rightArm) this.rightArm.rotation.x = -1.2;

      // Enter retreat
      this.phantomState = PhantomState.RETREAT;
      this.retreatTimer = 2.0;
    }
  }

  _updateRetreat(delta, playerPos) {
    this.retreatTimer -= delta;

    // Sprint away from player
    const dir = new THREE.Vector3().subVectors(this.position, playerPos);
    dir.y = 0;
    dir.normalize();

    this.position.x += dir.x * (this.speed * 1.1) * delta;
    this.position.z += dir.z * (this.speed * 1.1) * delta;
    this.group.rotation.y = Math.atan2(-dir.x, -dir.z);

    if (this.retreatTimer <= 0) {
      this.phantomState = PhantomState.CLOAKED;
      this._setRevealed(false);
    }
  }
}
