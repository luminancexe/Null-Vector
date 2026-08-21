/**
 * ShootingSystem.js
 * Hitscan raycasting, multi-zone damage (head/body/limbs), tracers, and impact dispatch.
 */

import * as THREE from 'three';

export class ShootingSystem {
  constructor(game) {
    this.game = game;
    this.raycaster = new THREE.Raycaster();
    this.tempRayOrigin = new THREE.Vector3();
    this.tempRayDir = new THREE.Vector3();

    // Reusable tracer geometry
    this.tracerMaterial = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
      linewidth: 2
    });
  }

  fireWeapon(weapon) {
    const player = this.game.player;
    if (!player) return;

    this.game.stats.shotsFired += weapon.pellets;

    const eyePos = player.getEyePosition();
    const baseDir = player.getForwardVector();

    // Check if player is aiming down sights (ADS)
    const isADS = this.game.input.isMouseDown(2); // RMB
    const spreadMultiplier = isADS ? 0.35 : (player.isCrouching ? 0.6 : (player.isSprinting ? 1.8 : 1.0));
    const effectiveSpread = weapon.spread * spreadMultiplier;

    let hitAny = false;

    // Get weapon muzzle position for tracers
    const muzzlePos = this.game.weaponManager?.getMuzzleWorldPosition() || eyePos.clone().add(baseDir.clone().multiplyScalar(0.5));

    for (let p = 0; p < weapon.pellets; p++) {
      // Apply spread
      const spreadX = (Math.random() - 0.5) * effectiveSpread;
      const spreadY = (Math.random() - 0.5) * effectiveSpread;

      const right = new THREE.Vector3(1, 0, 0).applyEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ'));
      const up = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(player.pitch, player.yaw, 0, 'YXZ'));

      const shotDir = baseDir.clone()
        .addScaledVector(right, spreadX)
        .addScaledVector(up, spreadY)
        .normalize();

      const hit = this._performRaycast(eyePos, shotDir, weapon.range);

      if (hit) {
        hitAny = true;
        this._handleHit(hit, weapon);
        this._spawnTracer(muzzlePos, hit.point, weapon.id);
      } else {
        const endPoint = eyePos.clone().addScaledVector(shotDir, weapon.range);
        this._spawnTracer(muzzlePos, endPoint, weapon.id);
      }
    }

    // Camera Recoil Kick
    player.pitch += weapon.recoilPitch * (isADS ? 0.6 : 1.0);
    player.yaw += (Math.random() - 0.5) * weapon.recoilYaw;

    // Viewmodel Recoil
    if (this.game.weaponManager) {
      this.game.weaponManager.applyRecoil(weapon.recoilKick);
    }

    // UI Crosshair Bloom
    if (this.game.uiManager) {
      this.game.uiManager.onWeaponFired(weapon);
    }

    // Audio
    if (this.game.audioManager) {
      this.game.audioManager.playGunshot(weapon.id);
    }
  }

  _performRaycast(origin, direction, range) {
    this.raycaster.set(origin, direction);
    this.raycaster.near = 0.2;
    this.raycaster.far = range;

    const targets = [];

    // 1. Check enemy meshes
    if (this.game.enemyManager) {
      const enemyMeshes = this.game.enemyManager.getRaycastMeshes();
      targets.push(...enemyMeshes);
    }

    // 2. Check target dummies / interactive objects
    if (this.game.testTargets) {
      targets.push(...this.game.testTargets);
    }

    // 3. Check level collision meshes
    if (this.game.level) {
      const levelMeshes = this.game.level.getRaycastMeshes();
      targets.push(...levelMeshes);
    } else if (this.game.scene) {
      // Fallback: raycast against scene children (excluding player & weapon viewmodel)
      const sceneObjects = this.game.scene.children.filter(obj => 
        obj !== this.game.player && 
        (!this.game.weaponManager || obj !== this.game.weaponManager.viewmodelContainer)
      );
      targets.push(...sceneObjects);
    }

    const intersects = this.raycaster.intersectObjects(targets, true);
    if (intersects.length > 0) {
      return intersects[0];
    }
    return null;
  }

  _handleHit(hit, weapon) {
    const obj = hit.object;
    let isEnemy = false;
    let isHeadshot = false;
    let isKill = false;

    // Find parent enemy or dummy data
    let target = obj.userData?.enemy || obj.userData?.target || obj.parent?.userData?.enemy || obj.parent?.userData?.target;

    if (target && typeof target.takeDamage === 'function') {
      isEnemy = true;
      this.game.stats.shotsHit++;

      // Check hit zone (Headshot detection)
      if (obj.userData?.isHeadshot || obj.userData?.hitZone === 'head' || hit.point.y - (target.position?.y || 0) > 1.4) {
        isHeadshot = true;
      }

      const multiplier = isHeadshot ? weapon.headshotMultiplier : 1.0;
      const finalDamage = Math.round(weapon.damage * multiplier);

      const result = target.takeDamage(finalDamage, {
        hitPoint: hit.point,
        normal: hit.face ? hit.face.normal : new THREE.Vector3(0, 1, 0),
        isHeadshot
      });

      if (result && result.killed) {
        isKill = true;
        this.game.stats.kills++;
        if (isHeadshot) this.game.stats.headshots++;
      }

      // Hitmarker
      if (this.game.uiManager) {
        this.game.uiManager.showHitmarker(isHeadshot || isKill);
      }

      // Hit audio
      if (this.game.audioManager) {
        this.game.audioManager.playHitmarker(isHeadshot);
      }

      // Enemy impact particles (cyber sparks / blood)
      if (this.game.particleManager) {
        this.game.particleManager.spawnEnemyHitEffect(hit.point, hit.face ? hit.face.normal : null);
      }
    } else {
      // Wall / Environment Hit
      if (this.game.particleManager) {
        this.game.particleManager.spawnWallImpact(hit.point, hit.face ? hit.face.normal : null);
      }
      if (this.game.decalManager) {
        this.game.decalManager.spawnBulletHole(hit.point, hit.face ? hit.face.normal : null);
      }
      if (this.game.audioManager) {
        this.game.audioManager.playBulletImpact(hit.point);
      }
    }
  }

  _spawnTracer(startPos, endPos, weaponId) {
    if (!this.game.scene) return;

    const points = [startPos, endPos];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    let color = 0x00f0ff;
    if (weaponId === 'plasma') color = 0x00ff88;
    else if (weaponId === 'shotgun') color = 0xffaa00;

    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.85
    });

    const line = new THREE.Line(geometry, mat);
    this.game.scene.add(line);

    // Fade and remove tracer quickly
    let opacity = 0.85;
    const fade = () => {
      opacity -= 0.15;
      if (opacity <= 0) {
        this.game.scene.remove(line);
        geometry.dispose();
        mat.dispose();
      } else {
        mat.opacity = opacity;
        requestAnimationFrame(fade);
      }
    };
    requestAnimationFrame(fade);
  }
}
