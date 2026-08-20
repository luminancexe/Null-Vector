/**
 * Player.js
 * First-person player controller with physics, collision, jump, sprint, crouch, head bob, and health/armor.
 */

import * as THREE from 'three';
import { GameState } from '../core/Game.js';

export class Player {
  constructor(game) {
    this.game = game;
    this.camera = game.camera;
    this.input = game.input;
    this.scene = game.scene;

    // Spatial & Physics
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.radius = 0.45; // Collision radius
    this.heightStanding = 1.8;
    this.heightCrouching = 1.0;
    this.height = this.heightStanding;

    this.eyeHeightStanding = 1.65;
    this.eyeHeightCrouching = 0.85;
    this.eyeHeight = this.eyeHeightStanding;
    this.targetEyeHeight = this.eyeHeightStanding;

    // Movement parameters
    this.walkSpeed = 6.0;
    this.sprintSpeed = 9.5;
    this.crouchSpeed = 3.2;
    this.acceleration = 50.0;
    this.friction = 10.0;
    this.airControl = 0.35;
    this.gravity = 22.0;
    this.jumpForce = 7.8;

    // State flags
    this.isGrounded = true;
    this.isSprinting = false;
    this.isCrouching = false;
    this.isDead = false;

    // Camera angles (yaw around Y axis, pitch around X axis)
    this.yaw = 0;
    this.pitch = 0;
    this.baseFov = 75;
    this.targetFov = 75;

    // Head bob & camera feel
    this.bobTimer = 0;
    this.bobAmount = 0.04;
    this.bobFrequency = 10;
    this.landingDip = 0;
    this.lastYVelocity = 0;

    // Vitals
    this.maxHealth = 100;
    this.health = 100;
    this.maxArmor = 100;
    this.armor = 100;

    // Colliders list (AABBs from level)
    this.colliders = [];

    // Footstep timer
    this.footstepTimer = 0;

    // Spawn point
    this.spawnPosition = new THREE.Vector3(0, 0, 0);
  }

  setSpawn(x, y, z, yaw = 0) {
    this.spawnPosition.set(x, y, z);
    this.reset();
    this.yaw = yaw;
  }

  reset() {
    this.position.copy(this.spawnPosition);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.armor = this.maxArmor;
    this.isDead = false;
    this.isGrounded = true;
    this.isCrouching = false;
    this.isSprinting = false;
    this.height = this.heightStanding;
    this.eyeHeight = this.eyeHeightStanding;
    this.targetEyeHeight = this.eyeHeightStanding;
    this.pitch = 0;
    this.landingDip = 0;
  }

  setColliders(colliders) {
    this.colliders = colliders || [];
  }

  takeDamage(amount, sourcePosition = null) {
    if (this.isDead || this.health <= 0) return;

    // Armor absorption: 70% absorbed by armor, 30% by health
    let healthDamage = amount;
    if (this.armor > 0) {
      const armorAbsorb = Math.min(this.armor, amount * 0.7);
      this.armor -= armorAbsorb;
      healthDamage = amount - armorAbsorb;
    }

    this.health = Math.max(0, this.health - healthDamage);

    // Audio & Screen effect callbacks
    if (this.game.audioManager) {
      this.game.audioManager.playPlayerHurt();
    }
    if (this.game.uiManager) {
      this.game.uiManager.onPlayerDamaged(healthDamage, sourcePosition);
    }

    // Camera punch
    this.pitch += (Math.random() - 0.5) * 0.04;
    this.landingDip += 0.05;

    if (this.health <= 0) {
      this.die();
    }
  }

  heal(amount) {
    if (this.isDead) return;
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.game.audioManager) this.game.audioManager.playPickup('health');
    if (this.game.uiManager) this.game.uiManager.updateHUD();
  }

  addArmor(amount) {
    if (this.isDead) return;
    this.armor = Math.min(this.maxArmor, this.armor + amount);
    if (this.game.audioManager) this.game.audioManager.playPickup('armor');
    if (this.game.uiManager) this.game.uiManager.updateHUD();
  }

  die() {
    this.isDead = true;
    this.health = 0;
    console.log('[Player] Operative eliminated.');
    if (this.game.audioManager) {
      this.game.audioManager.playPlayerDeath();
    }
    this.game.setState(GameState.DEAD);
  }

  update(delta) {
    if (this.isDead) return;

    this._handleLook();
    this._handleMovement(delta);
    this._handleCrouch(delta);
    this._handleHeadBob(delta);
    this._updateCamera();
  }

  _handleLook() {
    const mouseDelta = this.input.consumeMouseDelta();
    this.yaw -= mouseDelta.x;
    this.pitch -= mouseDelta.y;

    // Clamp vertical look pitch to [-88 deg, +88 deg]
    const maxPitch = Math.PI / 2 - 0.03;
    this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
  }

  _handleCrouch(delta) {
    const wantsCrouch = this.input.isKeyDown('KeyC') || this.input.isKeyDown('ControlLeft') || this.input.isKeyDown('ControlRight');
    this.isCrouching = wantsCrouch;

    if (this.isCrouching) {
      this.targetEyeHeight = this.eyeHeightCrouching;
      this.height = this.heightCrouching;
    } else {
      this.targetEyeHeight = this.eyeHeightStanding;
      this.height = this.heightStanding;
    }

    // Smoothly interpolate eye height
    this.eyeHeight += (this.targetEyeHeight - this.eyeHeight) * Math.min(1.0, 14 * delta);
  }

  _handleMovement(delta) {
    // 1. Determine move direction relative to camera yaw
    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);

    const inputDir = new THREE.Vector3(0, 0, 0);
    if (this.input.isKeyDown('KeyW')) inputDir.add(forward);
    if (this.input.isKeyDown('KeyS')) inputDir.sub(forward);
    if (this.input.isKeyDown('KeyA')) inputDir.sub(right);
    if (this.input.isKeyDown('KeyD')) inputDir.add(right);

    const isMoving = inputDir.lengthSq() > 0.001;
    if (isMoving) {
      inputDir.normalize();
    }

    // 2. Sprint & target speed
    const wantsSprint = (this.input.isKeyDown('ShiftLeft') || this.input.isKeyDown('ShiftRight')) && this.input.isKeyDown('KeyW') && !this.isCrouching;
    this.isSprinting = wantsSprint && isMoving;

    let targetSpeed = this.walkSpeed;
    if (this.isCrouching) targetSpeed = this.crouchSpeed;
    else if (this.isSprinting) targetSpeed = this.sprintSpeed;

    // FOV shift when sprinting
    this.targetFov = this.isSprinting ? this.baseFov + 8 : this.baseFov;
    this.camera.fov += (this.targetFov - this.camera.fov) * Math.min(1.0, 8 * delta);
    this.camera.updateProjectionMatrix();

    // 3. Acceleration & Friction on horizontal plane (XZ)
    const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
    
    if (this.isGrounded) {
      if (isMoving) {
        // Accelerate towards input direction
        const targetVelX = inputDir.x * targetSpeed;
        const targetVelZ = inputDir.z * targetSpeed;
        const accelRate = this.acceleration * delta;

        this.velocity.x += (targetVelX - this.velocity.x) * Math.min(1.0, accelRate);
        this.velocity.z += (targetVelZ - this.velocity.z) * Math.min(1.0, accelRate);
      } else {
        // Apply friction
        const frictionDrop = this.friction * delta;
        this.velocity.x *= Math.max(0, 1 - frictionDrop);
        this.velocity.z *= Math.max(0, 1 - frictionDrop);
      }

      // Jump
      if (this.input.wasKeyJustPressed('Space')) {
        this.velocity.y = this.jumpForce;
        this.isGrounded = false;
        if (this.game.audioManager) this.game.audioManager.playJump();
      }
    } else {
      // Air control
      if (isMoving) {
        this.velocity.x += inputDir.x * this.acceleration * this.airControl * delta;
        this.velocity.z += inputDir.z * this.acceleration * this.airControl * delta;
        
        // Clamp air horizontal speed
        const hSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        if (hSpeed > targetSpeed) {
          const ratio = targetSpeed / hSpeed;
          this.velocity.x *= ratio;
          this.velocity.z *= ratio;
        }
      }
    }

    // 4. Gravity
    this.lastYVelocity = this.velocity.y;
    this.velocity.y -= this.gravity * delta;
    if (this.velocity.y < -30) this.velocity.y = -30;

    // 5. Collision & Integration
    this._moveWithCollision(delta);

    // 6. Footsteps audio trigger
    if (this.isGrounded && isMoving) {
      const stepInterval = this.isSprinting ? 0.32 : (this.isCrouching ? 0.6 : 0.44);
      this.footstepTimer += delta;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        if (this.game.audioManager) this.game.audioManager.playFootstep();
      }
    } else {
      this.footstepTimer = 0.2; // Ready to step upon landing/moving
    }
  }

  _moveWithCollision(delta) {
    const moveX = this.velocity.x * delta;
    const moveY = this.velocity.y * delta;
    const moveZ = this.velocity.z * delta;

    // Test X movement
    this.position.x += moveX;
    this._resolveHorizontalCollision('x');

    // Test Z movement
    this.position.z += moveZ;
    this._resolveHorizontalCollision('z');

    // Test Y movement
    const prevY = this.position.y;
    this.position.y += moveY;
    this._resolveVerticalCollision(prevY);
  }

  _resolveHorizontalCollision(axis) {
    const pMinX = this.position.x - this.radius;
    const pMaxX = this.position.x + this.radius;
    const pMinZ = this.position.z - this.radius;
    const pMaxZ = this.position.z + this.radius;
    const pMinY = this.position.y;
    const pMaxY = this.position.y + this.height;

    for (let i = 0; i < this.colliders.length; i++) {
      const b = this.colliders[i];
      // AABB overlap test
      if (pMaxX > b.min.x && pMinX < b.max.x &&
          pMaxY > b.min.y && pMinY < b.max.y &&
          pMaxZ > b.min.z && pMinZ < b.max.z) {
        
        if (axis === 'x') {
          if (this.velocity.x > 0) {
            this.position.x = b.min.x - this.radius;
          } else if (this.velocity.x < 0) {
            this.position.x = b.max.x + this.radius;
          }
          this.velocity.x = 0;
        } else if (axis === 'z') {
          if (this.velocity.z > 0) {
            this.position.z = b.min.z - this.radius;
          } else if (this.velocity.z < 0) {
            this.position.z = b.max.z + this.radius;
          }
          this.velocity.z = 0;
        }
      }
    }
  }

  _resolveVerticalCollision(prevY) {
    const pMinX = this.position.x - this.radius;
    const pMaxX = this.position.x + this.radius;
    const pMinZ = this.position.z - this.radius;
    const pMaxZ = this.position.z + this.radius;
    const pMinY = this.position.y;
    const pMaxY = this.position.y + this.height;

    let groundedThisFrame = false;

    // Check floor plane y = 0
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
      groundedThisFrame = true;
    }

    for (let i = 0; i < this.colliders.length; i++) {
      const b = this.colliders[i];
      if (pMaxX > b.min.x && pMinX < b.max.x &&
          pMaxZ > b.min.z && pMinZ < b.max.z) {
        
        // Landing on top of an obstacle
        if (prevY >= b.max.y - 0.2 && this.position.y <= b.max.y) {
          this.position.y = b.max.y;
          this.velocity.y = 0;
          groundedThisFrame = true;
        }
        // Hitting ceiling from below
        else if (prevY + this.height <= b.min.y + 0.2 && this.position.y + this.height >= b.min.y) {
          this.position.y = b.min.y - this.height;
          this.velocity.y = 0;
        }
      }
    }

    // Landing detection
    if (!this.isGrounded && groundedThisFrame) {
      const impactSpeed = Math.abs(this.lastYVelocity);
      if (impactSpeed > 3.0) {
        this.landingDip = Math.min(0.2, impactSpeed * 0.02);
        if (this.game.audioManager) this.game.audioManager.playLanding(impactSpeed);
      }
    }

    this.isGrounded = groundedThisFrame;
  }

  _handleHeadBob(delta) {
    const hSpeed = Math.hypot(this.velocity.x, this.velocity.z);

    if (this.isGrounded && hSpeed > 0.5) {
      const speedMult = this.isSprinting ? 1.5 : (this.isCrouching ? 0.6 : 1.0);
      this.bobTimer += delta * this.bobFrequency * speedMult;
    } else {
      this.bobTimer = 0;
    }

    // Landing dip spring recovery
    this.landingDip += (0 - this.landingDip) * Math.min(1.0, 10 * delta);
  }

  _updateCamera() {
    // Base eye position
    this.camera.position.x = this.position.x;
    this.camera.position.z = this.position.z;

    // Bobbing offset
    let bobY = 0;
    let bobX = 0;
    const hSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    if (this.isGrounded && hSpeed > 0.5) {
      bobY = Math.sin(this.bobTimer) * this.bobAmount * (this.isSprinting ? 1.4 : 1.0);
      bobX = Math.cos(this.bobTimer * 0.5) * (this.bobAmount * 0.5);
    }

    this.camera.position.y = this.position.y + this.eyeHeight + bobY - this.landingDip;

    // Apply rotation (Euler YXZ)
    this.camera.rotation.y = this.yaw + bobX * 0.2;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = -bobX * 0.4; // Subtle tilt when moving
  }

  getEyePosition() {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + this.eyeHeight,
      this.position.z
    );
  }

  getForwardVector() {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    return dir.normalize();
  }
}
