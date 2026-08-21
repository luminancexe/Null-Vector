/**
 * Flashlight.js
 * Player camera-mounted tactical flashlight with primary focused cone, subtle local fill,
 * toggle keybind [F], procedural audio feedback, and HUD indicator synchronization.
 */

import * as THREE from 'three';

export class Flashlight {
  constructor(game) {
    this.game = game;
    this.camera = game.camera;
    this.isOn = false;

    this.group = new THREE.Group();

    // 1. Primary Directional Spotlight Beam
    this.spotLight = new THREE.SpotLight(0xedf5ff, 3.2);
    this.spotLight.position.set(0.18, -0.15, 0.1);
    this.spotLight.angle = 0.38;
    this.spotLight.penumbra = 0.45;
    this.spotLight.distance = 32;
    this.spotLight.decay = 1.5;
    this.spotLight.visible = false;

    // Spot target forward along camera line
    this.spotTarget = new THREE.Object3D();
    this.spotTarget.position.set(0, 0, -20);
    this.group.add(this.spotTarget);
    this.spotLight.target = this.spotTarget;
    this.group.add(this.spotLight);

    // 2. Subtle Local Fill Light (Illuminates hands & close obstacles)
    this.fillLight = new THREE.PointLight(0x6688aa, 0.4, 4.5);
    this.fillLight.position.set(0.18, -0.15, -0.2);
    this.fillLight.visible = false;
    this.group.add(this.fillLight);

    this.camera.add(this.group);
  }

  toggle() {
    this.isOn = !this.isOn;
    this.spotLight.visible = this.isOn;
    this.fillLight.visible = this.isOn;

    if (this.game.audioManager) {
      this.game.audioManager.playFlashlightToggle();
    }

    if (this.game.uiManager) {
      this.game.uiManager.setFlashlightState(this.isOn);
    }

    return this.isOn;
  }

  setOn(on) {
    this.isOn = !!on;
    this.spotLight.visible = this.isOn;
    this.fillLight.visible = this.isOn;

    if (this.game.uiManager) {
      this.game.uiManager.setFlashlightState(this.isOn);
    }
  }

  update(delta) {
    // Keybind [KeyF] check
    if (this.game.input && this.game.input.wasKeyJustPressed('KeyF')) {
      if (this.game.state === 'PLAYING') {
        this.toggle();
      }
    }
  }
}
