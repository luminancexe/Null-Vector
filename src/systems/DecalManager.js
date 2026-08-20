/**
 * DecalManager.js
 * Places bullet impact scorch marks and holes on surfaces.
 */

import * as THREE from 'three';

export class DecalManager {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.decals = [];
    this.maxDecals = 60;

    this.decalGeo = new THREE.PlaneGeometry(0.12, 0.12);
    this.decalMat = new THREE.MeshBasicMaterial({
      color: 0x05080c,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });
  }

  spawnBulletHole(pos, normal) {
    if (!normal) return;

    const mesh = new THREE.Mesh(this.decalGeo, this.decalMat);
    mesh.position.copy(pos).addScaledVector(normal, 0.01);
    mesh.lookAt(pos.clone().add(normal));
    mesh.rotation.z = Math.random() * Math.PI * 2;

    this.scene.add(mesh);
    this.decals.push(mesh);

    if (this.decals.length > this.maxDecals) {
      const oldest = this.decals.shift();
      this.scene.remove(oldest);
    }
  }

  reset() {
    this.decals.forEach(d => this.scene.remove(d));
    this.decals = [];
  }
}
