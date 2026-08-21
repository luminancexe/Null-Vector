/**
 * PowerManager.js
 * Manages facility power states (OFF, AUXILIARY, PARTIAL, FULL, LOCKDOWN, CRITICAL),
 * interactive power relays, dynamic lighting transitions, and power-dependent facility systems.
 */

import * as THREE from 'three';

export const PowerState = {
  OFF: 'OFF',
  AUXILIARY: 'AUXILIARY',
  PARTIAL: 'PARTIAL',
  FULL: 'FULL',
  LOCKDOWN: 'LOCKDOWN',
  CRITICAL: 'CRITICAL'
};

export class PowerManager {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.state = PowerState.OFF;

    // Power Relays (A, B, C)
    this.relays = {
      A: false,
      B: false,
      C: false
    };

    // Strobe / Flicker Animation
    this.flickerTimer = 0;
    this.alarmStrobe = 0;

    // Event listeners
    this.listeners = [];
  }

  onStateChange(callback) {
    this.listeners.push(callback);
  }

  getRelaysActiveCount() {
    return Object.values(this.relays).filter(Boolean).length;
  }

  activateRelay(relayId) {
    if (this.relays[relayId] !== undefined && !this.relays[relayId]) {
      this.relays[relayId] = true;
      console.log(`[PowerManager] Relay ${relayId} ACTIVATED. (${this.getRelaysActiveCount()}/3)`);

      if (this.game.audioManager) {
        this.game.audioManager.playPowerRelayHum();
        this.game.audioManager.playPowerRestoredJingle();
      }

      // Check count
      const count = this.getRelaysActiveCount();
      if (count === 1) {
        this.setPowerState(PowerState.AUXILIARY);
      } else if (count === 2) {
        this.setPowerState(PowerState.PARTIAL);
      } else if (count === 3) {
        this.setPowerState(PowerState.FULL);
      }

      // Notify level
      if (this.level && typeof this.level.onRelayActivated === 'function') {
        this.level.onRelayActivated(relayId);
      }

      return true;
    }
    return false;
  }

  setPowerState(newState) {
    if (this.state === newState) return;
    const oldState = this.state;
    this.state = newState;
    console.log(`[PowerManager] Power State Changed: ${oldState} -> ${newState}`);

    this._applyLightingForState(newState);

    if (this.game.uiManager) {
      this.game.uiManager.setPowerStateText(newState);
    }

    this.listeners.forEach(cb => cb(newState, oldState));
  }

  _applyLightingForState(state) {
    const scene = this.game.scene;
    if (!scene) return;

    if (this.level && this.level.onPowerStateChange) {
      this.level.onPowerStateChange(state);
    }

    // Adjust scene ambient and fog
    const ambient = scene.children.find(c => c.isAmbientLight);
    const hemi = scene.children.find(c => c.isHemisphereLight);

    switch (state) {
      case PowerState.OFF:
        if (ambient) { ambient.intensity = 0.08; ambient.color.setHex(0x0a1018); }
        if (hemi) { hemi.intensity = 0.05; }
        if (scene.fog) { scene.fog.color.setHex(0x020306); scene.fog.density = 0.035; }
        break;

      case PowerState.AUXILIARY:
        if (ambient) { ambient.intensity = 0.28; ambient.color.setHex(0x182436); }
        if (hemi) { hemi.intensity = 0.2; }
        if (scene.fog) { scene.fog.color.setHex(0x050812); scene.fog.density = 0.025; }
        break;

      case PowerState.PARTIAL:
        if (ambient) { ambient.intensity = 0.5; ambient.color.setHex(0x22364e); }
        if (hemi) { hemi.intensity = 0.4; }
        if (scene.fog) { scene.fog.color.setHex(0x081220); scene.fog.density = 0.02; }
        break;

      case PowerState.FULL:
        if (ambient) { ambient.intensity = 0.85; ambient.color.setHex(0x304a68); }
        if (hemi) { hemi.intensity = 0.6; }
        if (scene.fog) { scene.fog.color.setHex(0x0a1628); scene.fog.density = 0.016; }
        break;

      case PowerState.LOCKDOWN:
        if (ambient) { ambient.intensity = 0.4; ambient.color.setHex(0x660a0a); }
        if (hemi) { hemi.intensity = 0.3; hemi.color.setHex(0xff1111); }
        if (scene.fog) { scene.fog.color.setHex(0x1c0205); scene.fog.density = 0.025; }
        break;

      case PowerState.CRITICAL:
        if (ambient) { ambient.intensity = 0.35; ambient.color.setHex(0x440812); }
        if (hemi) { hemi.intensity = 0.25; hemi.color.setHex(0xff2244); }
        if (scene.fog) { scene.fog.color.setHex(0x150106); scene.fog.density = 0.03; }
        break;
    }
  }

  isDoorPowered(doorId) {
    if (this.state === PowerState.OFF) return false;
    if (this.state === PowerState.AUXILIARY) {
      return doorId === 'entrance_hatch' || doorId === 'tunnel_door';
    }
    if (this.state === PowerState.PARTIAL) {
      return doorId !== 'lockdown_blast_door';
    }
    if (this.state === PowerState.LOCKDOWN) {
      return false; // Blast doors sealed during lockdown
    }
    return true; // FULL / CRITICAL
  }

  update(delta) {
    // Dynamic lighting effects during LOCKDOWN and CRITICAL
    if (this.state === PowerState.LOCKDOWN) {
      this.alarmStrobe += delta * 4;
      const strobe = (Math.sin(this.alarmStrobe) + 1) * 0.5;
      if (this.level && this.level.emergencyLights) {
        this.level.emergencyLights.forEach(l => {
          l.intensity = strobe * 3.5;
        });
      }
    } else if (this.state === PowerState.CRITICAL) {
      this.flickerTimer += delta;
      if (this.flickerTimer > 0.1) {
        this.flickerTimer = 0;
        if (this.level && this.level.criticalFlickerLights) {
          this.level.criticalFlickerLights.forEach(l => {
            l.intensity = Math.random() > 0.3 ? 2.0 : 0.2;
          });
        }
      }
    }
  }

  reset() {
    this.relays = { A: false, B: false, C: false };
    this.setPowerState(PowerState.OFF);
  }
}
