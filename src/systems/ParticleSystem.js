/**
 * ParticleSystem.js
 * High-performance pooled particle system for sparks, muzzle flares, smoke, and explosions.
 */

import * as THREE from 'three';

export class ParticleSystem {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;

    this.particles = [];
    this.maxParticles = 300;

    // Shared geometries & materials
    this.sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array([0, 0, 0, 0, 0.15, 0]);
    this.sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));

    this.sparkMat = new THREE.LineBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 1.0
    });

    this.smokeGeo = new THREE.PlaneGeometry(0.25, 0.25);
    this.smokeMat = new THREE.MeshBasicMaterial({
      color: 0x667788,
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });

    this.flashGeo = new THREE.SphereGeometry(0.2, 8, 8);
    this.flashMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 1.0
    });
  }

  spawnWallImpact(pos, normal) {
    const norm = normal || new THREE.Vector3(0, 1, 0);

    // 1. Sparks burst
    const sparkCount = 8;
    for (let i = 0; i < sparkCount; i++) {
      const pMesh = new THREE.Line(this.sparkGeo, this.sparkMat.clone());
      pMesh.position.copy(pos);

      const vel = norm.clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2))
        .normalize()
        .multiplyScalar(4 + Math.random() * 6);

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        vel,
        life: 0.25,
        maxLife: 0.25,
        gravity: 15
      });
    }

    // 2. Smoke puff
    const smoke = new THREE.Mesh(this.smokeGeo, this.smokeMat.clone());
    smoke.position.copy(pos).addScaledVector(norm, 0.05);
    smoke.lookAt(pos.clone().add(norm));
    this.scene.add(smoke);

    this.particles.push({
      mesh: smoke,
      vel: norm.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0.5, 0)),
      life: 0.4,
      maxLife: 0.4,
      gravity: -0.5,
      isSmoke: true
    });
  }

  spawnEnemyHitEffect(pos, normal) {
    const norm = normal || new THREE.Vector3(0, 1, 0);

    // Cyan / Orange cyber sparks
    const count = 10;
    for (let i = 0; i < count; i++) {
      const mat = this.sparkMat.clone();
      mat.color.setHex(Math.random() > 0.5 ? 0x00f0ff : 0xff2a4b);

      const pMesh = new THREE.Line(this.sparkGeo, mat);
      pMesh.position.copy(pos);

      const vel = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2)
        .normalize()
        .multiplyScalar(5 + Math.random() * 5);

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        vel,
        life: 0.3,
        maxLife: 0.3,
        gravity: 12
      });
    }
  }

  spawnExplosion(pos, scale = 1.0) {
    // 1. Flash
    const flash = new THREE.Mesh(this.flashGeo, this.flashMat.clone());
    flash.position.copy(pos);
    flash.scale.setScalar(scale * 3);
    this.scene.add(flash);

    this.particles.push({
      mesh: flash,
      vel: new THREE.Vector3(0, 0, 0),
      life: 0.15,
      maxLife: 0.15,
      gravity: 0
    });

    // 2. Flying debris sparks
    const count = Math.round(20 * scale);
    for (let i = 0; i < count; i++) {
      const mat = this.sparkMat.clone();
      mat.color.setHex(Math.random() > 0.3 ? 0xffaa00 : 0xff2a4b);

      const pMesh = new THREE.Line(this.sparkGeo, mat);
      pMesh.position.copy(pos);

      const vel = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2)
        .normalize()
        .multiplyScalar((6 + Math.random() * 10) * scale);

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        vel,
        life: 0.5,
        maxLife: 0.5,
        gravity: 18
      });
    }
  }

  spawnEnemyMuzzleFlash(pos, colorHex = 0x00f0ff) {
    const flash = new THREE.Mesh(this.flashGeo, new THREE.MeshBasicMaterial({ color: colorHex, transparent: true }));
    flash.position.copy(pos);
    flash.scale.setScalar(0.8);
    this.scene.add(flash);

    this.particles.push({
      mesh: flash,
      vel: new THREE.Vector3(0, 0, 0),
      life: 0.05,
      maxLife: 0.05,
      gravity: 0
    });
  }

  update(delta) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Physics
      p.vel.y -= p.gravity * delta;
      p.mesh.position.addScaledVector(p.vel, delta);

      // Fade opacity
      const prog = p.life / p.maxLife;
      if (p.mesh.material) {
        p.mesh.material.opacity = prog;
      }

      if (p.isSmoke) {
        p.mesh.scale.addScalar(delta * 1.5);
      }
    }
  }
}
