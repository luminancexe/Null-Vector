/**
 * Pickups.js
 * Collectible Health Packs, Armor Shards, and Ammo Crates with 3D models and floating animations.
 */

import * as THREE from 'three';

export class PickupManager {
  constructor(game) {
    this.game = game;
    this.pickups = [];
    this.scene = game.scene;
  }

  spawnPickup(type, x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y + 0.6, z);

    let mesh = null;
    let lightColor = 0x00f0ff;

    if (type === 'health') {
      lightColor = 0xff2a4b;
      // Medical Capsule / Cross
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 })
      );
      const crossH = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.08, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xff2a4b })
      );
      const crossV = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.25, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xff2a4b })
      );
      body.add(crossH);
      body.add(crossV);
      mesh = body;
    } else if (type === 'armor') {
      lightColor = 0x00f0ff;
      // Shield Battery / Shard
      const shard = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.25, 0),
        new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00aacc,
          emissiveIntensity: 0.6,
          roughness: 0.2,
          metalness: 0.9
        })
      );
      mesh = shard;
    } else if (type === 'ammo') {
      lightColor = 0xffaa00;
      // Munitions Crate
      const crate = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.25, 0.25),
        new THREE.MeshStandardMaterial({
          color: 0x222a36,
          roughness: 0.4,
          metalness: 0.8
        })
      );
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.06, 0.26),
        new THREE.MeshBasicMaterial({ color: 0xffaa00 })
      );
      crate.add(stripe);
      mesh = crate;
    }

    if (mesh) {
      group.add(mesh);
    }

    // Glow light
    const pLight = new THREE.PointLight(lightColor, 0.8, 3.5);
    pLight.position.set(0, 0, 0);
    group.add(pLight);

    this.scene.add(group);

    const pickup = {
      type,
      group,
      mesh,
      baseY: y + 0.6,
      collected: false,
      respawnTimer: 0,
      radius: 1.4
    };

    this.pickups.push(pickup);
    return pickup;
  }

  update(delta) {
    const player = this.game.player;
    if (!player || player.isDead) return;

    const pPos = player.position;
    const time = performance.now() * 0.003;

    for (let i = 0; i < this.pickups.length; i++) {
      const p = this.pickups[i];

      if (p.collected) {
        if (p.respawnTimer > 0) {
          p.respawnTimer -= delta;
          if (p.respawnTimer <= 0) {
            p.collected = false;
            p.group.visible = true;
          }
        }
        continue;
      }

      // Rotate & Float
      p.group.rotation.y += 1.8 * delta;
      p.group.position.y = p.baseY + Math.sin(time + i) * 0.12;

      // Distance check to player
      const dist = p.group.position.distanceTo(pPos);
      if (dist < p.radius) {
        let applied = false;

        if (p.type === 'health' && player.health < player.maxHealth) {
          player.heal(35);
          applied = true;
        } else if (p.type === 'armor' && player.armor < player.maxArmor) {
          player.addArmor(35);
          applied = true;
        } else if (p.type === 'ammo') {
          // Refill all weapon reserves
          if (this.game.weaponManager) {
            Object.values(this.game.weaponManager.weapons).forEach(w => {
              w.addAmmo(w.magSize * 2);
            });
            if (this.game.uiManager) this.game.uiManager.updateHUD();
            if (this.game.audioManager) this.game.audioManager.playPickup('ammo');
            applied = true;
          }
        }

        if (applied) {
          p.collected = true;
          p.group.visible = false;
          p.respawnTimer = 25.0; // Respawns after 25s
        }
      }
    }
  }

  reset() {
    this.pickups.forEach(p => {
      p.collected = false;
      p.respawnTimer = 0;
      p.group.visible = true;
    });
  }
}
