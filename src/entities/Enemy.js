/**
 * Enemy.js
 * AI Enemy class with state machine (IDLE, PATROL, CHASE, ATTACK, COVER, SEARCH, DEAD),
 * 3D procedural model, multi-zone hit detection, pathfinding, and combat behavior.
 */

import * as THREE from 'three';

export const EnemyState = {
  IDLE: 'IDLE',
  PATROL: 'PATROL',
  CHASE: 'CHASE',
  ATTACK: 'ATTACK',
  COVER: 'COVER',
  SEARCH: 'SEARCH',
  DEAD: 'DEAD'
};

export const ENEMY_TYPES = {
  enforcer: {
    type: 'enforcer',
    name: 'Android Enforcer',
    health: 90,
    speed: 4.8,
    attackRange: 22,
    attackRate: 0.35, // Burst fire
    burstCount: 3,
    damage: 12,
    color: 0x3b4a5d,
    eyeColor: 0x00f0ff,
    scale: 1.0
  },
  juggernaut: {
    type: 'juggernaut',
    name: 'Heavy Juggernaut',
    health: 260,
    speed: 2.8,
    attackRange: 26,
    attackRate: 0.6,
    burstCount: 2,
    damage: 24,
    color: 0x222a36,
    eyeColor: 0xffaa00,
    scale: 1.25
  },
  spectre: {
    type: 'spectre',
    name: 'Cyber Spectre',
    health: 65,
    speed: 8.0,
    attackRange: 3.5, // Melee rusher
    attackRate: 0.8,
    burstCount: 1,
    damage: 28,
    color: 0x18202c,
    eyeColor: 0x00ff88,
    scale: 0.9
  }
};

export class Enemy {
  constructor(game, typeKey = 'enforcer', x = 0, y = 0, z = 0) {
    this.game = game;
    this.scene = game.scene;
    this.config = ENEMY_TYPES[typeKey] || ENEMY_TYPES.enforcer;

    this.type = this.config.type;
    this.maxHealth = this.config.health;
    this.health = this.maxHealth;
    this.speed = this.config.speed;
    this.damage = this.config.damage;
    this.attackRange = this.config.attackRange;
    this.attackRate = this.config.attackRate;

    this.state = EnemyState.PATROL;
    this.position = new THREE.Vector3(x, y, z);
    this.rotation = 0; // Yaw angle

    // Patrol & Pathfinding
    this.patrolWaypoints = [];
    this.currentWaypointIndex = 0;
    this.path = [];
    this.pathIndex = 0;
    this.pathTimer = 0;

    // Combat & Awareness
    this.sightRange = 30;
    this.fieldOfView = Math.PI * 0.75; // 135 degrees FOV
    this.lastKnownPlayerPos = new THREE.Vector3();
    this.searchTimer = 0;
    this.attackCooldown = 0;
    this.burstRemaining = 0;
    this.burstTimer = 0;

    // Visual Mesh & Animation
    this.group = new THREE.Group();
    this.group.position.copy(this.position);
    this.group.scale.setScalar(this.config.scale);

    this.bodyMesh = null;
    this.headMesh = null;
    this.eyeMesh = null;
    this.weaponMesh = null;
    this.muzzlePoint = new THREE.Vector3();

    this.hitMeshes = [];
    this.walkAnimTime = 0;

    this._build3DModel();
    this.scene.add(this.group);
  }

  _build3DModel() {
    const mainMat = new THREE.MeshStandardMaterial({
      color: this.config.color,
      roughness: 0.4,
      metalness: 0.7
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0x111620,
      roughness: 0.8,
      metalness: 0.2
    });

    const eyeMat = new THREE.MeshBasicMaterial({
      color: this.config.eyeColor
    });

    // 1. Torso / Chassis
    this.bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 0.35), mainMat);
    this.bodyMesh.position.y = 1.1;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.userData = { target: this, hitZone: 'body' };
    this.group.add(this.bodyMesh);
    this.hitMeshes.push(this.bodyMesh);

    // 2. Head
    this.headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32), mainMat);
    this.headMesh.position.y = 1.65;
    this.headMesh.castShadow = true;
    this.headMesh.userData = { target: this, hitZone: 'head' };
    this.group.add(this.headMesh);
    this.hitMeshes.push(this.headMesh);

    // 3. Glowing Visor / Eye
    this.eyeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.05), eyeMat);
    this.eyeMesh.position.set(0, 1.66, -0.16);
    this.group.add(this.eyeMesh);

    // 4. Arms & Weapon
    const armGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    this.leftArm = new THREE.Mesh(armGeo, jointMat);
    this.leftArm.position.set(-0.38, 1.1, 0);
    this.leftArm.userData = { target: this, hitZone: 'body' };
    this.group.add(this.leftArm);
    this.hitMeshes.push(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, jointMat);
    this.rightArm.position.set(0.38, 1.1, -0.15);
    this.rightArm.rotation.x = -0.5;
    this.rightArm.userData = { target: this, hitZone: 'body' };
    this.group.add(this.rightArm);
    this.hitMeshes.push(this.rightArm);

    // Weapon
    const gunGeo = new THREE.BoxGeometry(0.12, 0.15, 0.5);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x0e121a, metalness: 0.9, roughness: 0.3 });
    this.weaponMesh = new THREE.Mesh(gunGeo, gunMat);
    this.weaponMesh.position.set(0.38, 0.95, -0.35);
    this.group.add(this.weaponMesh);

    // 5. Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    this.leftLeg = new THREE.Mesh(legGeo, jointMat);
    this.leftLeg.position.set(-0.18, 0.38, 0);
    this.leftLeg.userData = { target: this, hitZone: 'body' };
    this.group.add(this.leftLeg);
    this.hitMeshes.push(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, jointMat);
    this.rightLeg.position.set(0.18, 0.38, 0);
    this.rightLeg.userData = { target: this, hitZone: 'body' };
    this.group.add(this.rightLeg);
    this.hitMeshes.push(this.rightLeg);
  }

  setPatrolWaypoints(waypoints) {
    this.patrolWaypoints = waypoints || [];
    if (this.patrolWaypoints.length > 0) {
      this.state = EnemyState.PATROL;
    }
  }

  takeDamage(amount, hitInfo = {}) {
    if (this.state === EnemyState.DEAD) return { killed: false };

    this.health -= amount;

    // Flash white/red on hit
    this.bodyMesh.material.color.setHex(0xffffff);
    this.headMesh.material.color.setHex(0xff2a4b);
    setTimeout(() => {
      if (this.state !== EnemyState.DEAD) {
        this.bodyMesh.material.color.setHex(this.config.color);
        this.headMesh.material.color.setHex(this.config.color);
      }
    }, 80);

    // Alert to player position
    const player = this.game.player;
    if (player) {
      this.lastKnownPlayerPos.copy(player.position);
      if (this.state === EnemyState.PATROL || this.state === EnemyState.IDLE) {
        this.state = EnemyState.CHASE;
      }
    }

    if (this.health <= 0) {
      this.die();
      return { killed: true };
    }

    return { killed: false };
  }

  die() {
    this.state = EnemyState.DEAD;
    this.health = 0;

    // Red eye off
    this.eyeMesh.material.color.setHex(0x111111);

    // Collapse death animation / sink
    const fallDir = Math.random() > 0.5 ? 1 : -1;
    this.group.rotation.z = fallDir * 1.4;
    this.group.position.y = 0.2;

    // Spawn death particles
    if (this.game.particleManager) {
      this.game.particleManager.spawnExplosion(this.position.clone().add(new THREE.Vector3(0, 1, 0)), 0.6);
    }

    // Audio
    if (this.game.audioManager) {
      this.game.audioManager.playEnemyDeath();
    }

    // Drop ammo/health pickup by chance
    if (Math.random() < 0.45 && this.game.level?.pickupManager) {
      const dropType = Math.random() > 0.5 ? 'ammo' : (Math.random() > 0.5 ? 'health' : 'armor');
      this.game.level.pickupManager.spawnPickup(dropType, this.position.x, this.position.y, this.position.z);
    }

    // Notify objective manager
    if (this.game.objectiveManager) {
      this.game.objectiveManager.onEnemyKilled(this);
    }

    // Remove from scene after delay
    setTimeout(() => {
      this.scene.remove(this.group);
    }, 8000);
  }

  update(delta) {
    if (this.state === EnemyState.DEAD) return;

    const player = this.game.player;
    if (!player || player.isDead) {
      this.state = EnemyState.IDLE;
      return;
    }

    const distToPlayer = this.position.distanceTo(player.position);
    const canSeePlayer = this._checkLineOfSight(player);

    if (canSeePlayer) {
      this.lastKnownPlayerPos.copy(player.position);
    }

    // State Machine
    switch (this.state) {
      case EnemyState.IDLE:
        if (canSeePlayer) this.state = EnemyState.CHASE;
        break;

      case EnemyState.PATROL:
        if (canSeePlayer) {
          this.state = EnemyState.CHASE;
        } else {
          this._handlePatrol(delta);
        }
        break;

      case EnemyState.CHASE:
        if (canSeePlayer && distToPlayer <= this.attackRange) {
          this.state = EnemyState.ATTACK;
        } else if (!canSeePlayer && this.position.distanceTo(this.lastKnownPlayerPos) < 2.0) {
          this.state = EnemyState.SEARCH;
          this.searchTimer = 4.0;
        } else {
          this._moveAlongPath(this.lastKnownPlayerPos, delta);
        }
        break;

      case EnemyState.ATTACK:
        if (!canSeePlayer || distToPlayer > this.attackRange * 1.2) {
          this.state = EnemyState.CHASE;
        } else {
          this._handleAttack(player, distToPlayer, delta);
        }
        break;

      case EnemyState.SEARCH:
        this.searchTimer -= delta;
        this.rotation += 1.5 * delta; // Look around
        this.group.rotation.y = this.rotation;

        if (canSeePlayer) {
          this.state = EnemyState.CHASE;
        } else if (this.searchTimer <= 0) {
          this.state = EnemyState.PATROL;
        }
        break;
    }

    // Update position and visual animation
    this.group.position.copy(this.position);
    this._animateLimbs(delta);
  }

  _checkLineOfSight(player) {
    const dist = this.position.distanceTo(player.position);
    if (dist > this.sightRange) return false;

    // Check FOV angle
    const toPlayer = new THREE.Vector3().subVectors(player.position, this.position).normalize();
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation);
    const angle = forward.angleTo(toPlayer);

    // If player is close (< 6m), sight is 360 degrees (hearing/presence)
    if (dist > 6.0 && angle > this.fieldOfView / 2) {
      return false;
    }

    // Raycast obstacle check
    const nav = this.game.level?.navGraph;
    if (nav) {
      const eyePos = this.position.clone().add(new THREE.Vector3(0, 1.6, 0));
      const targetPos = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
      return nav.hasLineOfSight(eyePos, targetPos);
    }
    return true;
  }

  _handlePatrol(delta) {
    if (this.patrolWaypoints.length === 0) return;

    const targetWp = this.patrolWaypoints[this.currentWaypointIndex];
    const dist = this.position.distanceTo(targetWp);

    if (dist < 1.5) {
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
    } else {
      this._moveTowards(targetWp, this.speed * 0.5, delta);
    }
  }

  _moveAlongPath(destination, delta) {
    this.pathTimer -= delta;
    if (this.pathTimer <= 0) {
      this.pathTimer = 0.6; // Recompute path periodically
      if (this.game.level?.navGraph) {
        this.path = this.game.level.navGraph.findPath(this.position, destination);
        this.pathIndex = 0;
      }
    }

    if (this.path && this.path.length > 0) {
      const targetPoint = this.path[this.pathIndex] || destination;
      const dist = this.position.distanceTo(targetPoint);

      if (dist < 1.2 && this.pathIndex < this.path.length - 1) {
        this.pathIndex++;
      } else {
        this._moveTowards(targetPoint, this.speed, delta);
      }
    } else {
      this._moveTowards(destination, this.speed, delta);
    }
  }

  _moveTowards(targetPos, speed, delta) {
    const dir = new THREE.Vector3().subVectors(targetPos, this.position);
    dir.y = 0;
    if (dir.lengthSq() < 0.001) return;

    dir.normalize();

    // Rotate smoothly towards target
    const targetYaw = Math.atan2(-dir.x, -dir.z);
    this.rotation = targetYaw;
    this.group.rotation.y = this.rotation;

    // Move
    this.position.addScaledVector(dir, speed * delta);
    this.walkAnimTime += delta * speed * 2.5;
  }

  _handleAttack(player, distToPlayer, delta) {
    // Face player
    const dir = new THREE.Vector3().subVectors(player.position, this.position);
    this.rotation = Math.atan2(-dir.x, -dir.z);
    this.group.rotation.y = this.rotation;

    // Melee vs Ranged
    if (this.type === 'spectre') {
      // Rusher melee
      if (distToPlayer < 2.0) {
        this.attackCooldown -= delta;
        if (this.attackCooldown <= 0) {
          this.attackCooldown = this.attackRate;
          player.takeDamage(this.damage, this.position);
          if (this.game.audioManager) this.game.audioManager.playMeleeAttack();
        }
      } else {
        this._moveTowards(player.position, this.speed, delta);
      }
    } else {
      // Ranged burst fire
      this.attackCooldown -= delta;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = this.attackRate;
        this._shootAtPlayer(player);
      }
    }
  }

  _shootAtPlayer(player) {
    const muzzlePos = this.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    const targetPos = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));

    // Add slight aim inaccuracy
    const inaccuracy = 0.08;
    targetPos.x += (Math.random() - 0.5) * inaccuracy * 5;
    targetPos.y += (Math.random() - 0.5) * inaccuracy * 3;
    targetPos.z += (Math.random() - 0.5) * inaccuracy * 5;

    const shotDir = new THREE.Vector3().subVectors(targetPos, muzzlePos).normalize();

    // Muzzle flash / tracer
    if (this.game.particleManager) {
      this.game.particleManager.spawnEnemyMuzzleFlash(muzzlePos, this.config.eyeColor);
    }
    if (this.game.shootingSystem) {
      this.game.shootingSystem._spawnTracer(muzzlePos, targetPos, this.type === 'juggernaut' ? 'plasma' : 'rifle');
    }
    if (this.game.audioManager) {
      this.game.audioManager.playEnemyShoot(this.type);
    }

    // Raycast hit check against player with wall obstruction check
    const ray = new THREE.Ray(muzzlePos, shotDir);
    const pSphere = new THREE.Sphere(player.position.clone().add(new THREE.Vector3(0, 0.9, 0)), 0.6);

    // Check if level wall is between muzzle and player
    const distToPlayer = muzzlePos.distanceTo(player.position);
    let wallBlocked = false;
    if (this.game.colliders) {
      for (let i = 0; i < this.game.colliders.length; i++) {
        const box = this.game.colliders[i];
        const hit = ray.intersectBox(box, new THREE.Vector3());
        if (hit && hit.distanceTo(muzzlePos) < distToPlayer - 0.5) {
          wallBlocked = true;
          break;
        }
      }
    }

    if (!wallBlocked && ray.intersectsSphere(pSphere)) {
      player.takeDamage(this.damage, this.position);
    }
  }

  _animateLimbs(delta) {
    if (this.state === EnemyState.PATROL || this.state === EnemyState.CHASE) {
      const legAngle = Math.sin(this.walkAnimTime) * 0.5;
      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      this.leftArm.rotation.x = -legAngle * 0.4;
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0;
    }
  }

  getHitMeshes() {
    return this.hitMeshes;
  }
}
