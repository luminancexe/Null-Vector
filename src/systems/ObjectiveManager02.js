/**
 * ObjectiveManager02.js
 * Mission 02: Blackout objective coordinator.
 * Manages 8 progressive mission objectives, power relay interactions, incident log reading,
 * 45s lockdown survival, central systems core discovery, 03:00 extraction timer, and victory flow.
 */

import * as THREE from 'three';
import { GameState } from '../core/Game.js';
import { PowerState } from './PowerManager.js';

export const OBJECTIVE_STEPS_02 = {
  INFILTRATE: 1,
  RESTORE_AUX: 2,
  ACTIVATE_RELAYS: 3,
  SECURITY_OVERRIDE: 4,
  RECOVER_LOGS: 5,
  SURVIVE_LOCKDOWN: 6,
  INVESTIGATE_CORE: 7,
  EVACUATE: 8,
  COMPLETE: 9
};

export class ObjectiveManager02 {
  constructor(game) {
    this.game = game;
    this.currentStep = OBJECTIVE_STEPS_02.INFILTRATE;

    // Lockdown 45s Timer
    this.lockdownTimer = 45.0;
    this.isLockdownActive = false;

    // Evacuation 03:00 (180s) Timer
    this.extractionTimer = 180.0;
    this.isExtractionActive = false;

    this._updateHUDObjective();
  }

  _updateHUDObjective() {
    let text = '';
    const level = this.game.level;
    const powerMgr = level?.powerManager;
    const activeRelays = powerMgr ? powerMgr.getRelaysActiveCount() : 0;

    switch (this.currentStep) {
      case OBJECTIVE_STEPS_02.INFILTRATE:
        text = '1. Infiltrate Facility Entrance';
        break;
      case OBJECTIVE_STEPS_02.RESTORE_AUX:
        text = '2. Restore Auxiliary Power (Maintenance Wing)';
        break;
      case OBJECTIVE_STEPS_02.ACTIVATE_RELAYS:
        text = `3. Activate Power Relays (${activeRelays}/3)`;
        break;
      case OBJECTIVE_STEPS_02.SECURITY_OVERRIDE:
        text = '4. Override Security Lockdown in Control Room';
        break;
      case OBJECTIVE_STEPS_02.RECOVER_LOGS:
        text = '5. Recover Incident Logs from Server Archive';
        break;
      case OBJECTIVE_STEPS_02.SURVIVE_LOCKDOWN:
        text = `6. SURVIVE FACILITY LOCKDOWN (${Math.ceil(this.lockdownTimer)}s)`;
        break;
      case OBJECTIVE_STEPS_02.INVESTIGATE_CORE:
        text = '7. Investigate Central Systems Chamber';
        break;
      case OBJECTIVE_STEPS_02.EVACUATE:
        text = `8. EVACUATE FACILITY (${this._formatTimer(this.extractionTimer)})`;
        break;
      case OBJECTIVE_STEPS_02.COMPLETE:
        text = 'MISSION COMPLETE — BLACKOUT';
        break;
    }

    if (this.game.uiManager) {
      this.game.uiManager.setObjective(text);
    }
  }

  _formatTimer(seconds) {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  onEnemyKilled(enemy) {
    // No specific kill counter requirement, but adds to combat score
  }

  onRelayActivated(relayId) {
    const level = this.game.level;
    if (!level || !level.powerManager) return;

    level.powerManager.activateRelay(relayId);
    const count = level.powerManager.getRelaysActiveCount();

    if (this.currentStep === OBJECTIVE_STEPS_02.RESTORE_AUX && count >= 1) {
      this.advanceStep(OBJECTIVE_STEPS_02.ACTIVATE_RELAYS);
    } else if (this.currentStep === OBJECTIVE_STEPS_02.ACTIVATE_RELAYS) {
      this._updateHUDObjective();
      if (count >= 3) {
        this.advanceStep(OBJECTIVE_STEPS_02.SECURITY_OVERRIDE);
      }
    }
  }

  onSecurityOverridden() {
    if (this.currentStep === OBJECTIVE_STEPS_02.SECURITY_OVERRIDE) {
      if (this.game.audioManager) this.game.audioManager.playPowerRestoredJingle();
      this.advanceStep(OBJECTIVE_STEPS_02.RECOVER_LOGS);
    }
  }

  onIncidentLogsRead() {
    if (this.currentStep === OBJECTIVE_STEPS_02.RECOVER_LOGS) {
      this.advanceStep(OBJECTIVE_STEPS_02.SURVIVE_LOCKDOWN);
      this.isLockdownActive = true;
      this.lockdownTimer = 45.0;

      // Trigger facility lockdown & alarms
      const level = this.game.level;
      if (level && level.powerManager) {
        level.powerManager.setPowerState(PowerState.LOCKDOWN);
      }
      if (level && typeof level.spawnLockdownReinforcements === 'function') {
        level.spawnLockdownReinforcements();
      }
      if (this.game.audioManager) {
        this.game.audioManager.playLockdownAlarm();
      }
    }
  }

  onCentralCoreInvestigated() {
    if (this.currentStep === OBJECTIVE_STEPS_02.INVESTIGATE_CORE) {
      console.log('[ObjectiveManager02] Central Systems Anomaly Discovered: Project Singularity!');
      const level = this.game.level;
      if (level && level.powerManager) {
        level.powerManager.setPowerState(PowerState.CRITICAL);
      }

      this.isExtractionActive = true;
      this.extractionTimer = 180.0;
      this.advanceStep(OBJECTIVE_STEPS_02.EVACUATE);

      if (this.game.audioManager) {
        this.game.audioManager.playEvacuationCountdown();
      }
    }
  }

  advanceStep(nextStep) {
    this.currentStep = nextStep;
    console.log(`[ObjectiveManager02] Objective updated: Step ${nextStep}`);

    if (this.game.audioManager) {
      this.game.audioManager.playObjectiveUpdate();
    }

    if (nextStep === OBJECTIVE_STEPS_02.COMPLETE) {
      if (this.game.audioManager) this.game.audioManager.playVictory();
      this.game.setState(GameState.VICTORY);
    }

    this._updateHUDObjective();
  }

  update(delta) {
    const player = this.game.player;
    if (!player || player.isDead) return;

    const pPos = player.position;
    const level = this.game.level;

    // Step 1 check: Infiltrate entrance (Moving past hatch Z < 36)
    if (this.currentStep === OBJECTIVE_STEPS_02.INFILTRATE) {
      if (pPos.z < 36) {
        this.advanceStep(OBJECTIVE_STEPS_02.RESTORE_AUX);
      }
    }

    // Interactive Terminals & Relays Check [KeyE]
    this._checkInteractions(pPos);

    // Step 6: Lockdown 45s countdown
    if (this.currentStep === OBJECTIVE_STEPS_02.SURVIVE_LOCKDOWN && this.isLockdownActive) {
      this.lockdownTimer -= delta;
      this._updateHUDObjective();

      if (this.lockdownTimer <= 0) {
        this.isLockdownActive = false;
        if (level && level.powerManager) {
          level.powerManager.setPowerState(PowerState.FULL);
        }
        this.advanceStep(OBJECTIVE_STEPS_02.INVESTIGATE_CORE);
      }
    }

    // Step 7 check: Entering Central Systems Core Chamber (Z < -28, X: 0 to 18)
    if (this.currentStep === OBJECTIVE_STEPS_02.INVESTIGATE_CORE) {
      const core = level?.centralSystemsCore;
      if (core && pPos.distanceTo(core.position) < core.radius) {
        this.onCentralCoreInvestigated();
      }
    }

    // Step 8: Extraction 03:00 countdown & extraction trigger
    if (this.currentStep === OBJECTIVE_STEPS_02.EVACUATE && this.isExtractionActive) {
      this.extractionTimer -= delta;
      this._updateHUDObjective();

      if (this.extractionTimer <= 0) {
        // Time ran out -> Player killed by facility collapse
        player.takeDamage(999);
        return;
      }

      const evacZone = level?.extractionZone;
      if (evacZone && pPos.distanceTo(evacZone.position) < evacZone.radius) {
        this.isExtractionActive = false;
        this.advanceStep(OBJECTIVE_STEPS_02.COMPLETE);
      }
    }
  }

  _checkInteractions(pPos) {
    const level = this.game.level;
    if (!level) return;

    let promptText = null;

    // 1. Relays (A, B, C)
    if (level.relays) {
      for (let i = 0; i < level.relays.length; i++) {
        const relay = level.relays[i];
        if (!relay.isActivated && pPos.distanceTo(relay.position) < 2.5) {
          promptText = `[E] ACTIVATE POWER RELAY ${relay.id}`;
          if (this.game.input.wasKeyJustPressed('KeyE')) {
            this.onRelayActivated(relay.id);
          }
          break;
        }
      }
    }

    // 2. Security Terminal
    if (!promptText && level.securityTerminal && !level.securityTerminal.isHacked) {
      if (pPos.distanceTo(level.securityTerminal.position) < 2.5) {
        promptText = '[E] OVERRIDE SECURITY LOCKDOWN';
        if (this.game.input.wasKeyJustPressed('KeyE')) {
          level.securityTerminal.isHacked = true;
          this.onSecurityOverridden();
        }
      }
    }

    // 3. Incident Log Terminal
    if (!promptText && level.incidentLogTerminal && !level.incidentLogTerminal.isRead) {
      if (pPos.distanceTo(level.incidentLogTerminal.position) < 2.5) {
        promptText = '[E] ACCESS INCIDENT LOGS';
        if (this.game.input.wasKeyJustPressed('KeyE')) {
          level.incidentLogTerminal.isRead = true;
          if (this.game.uiManager) {
            this.game.uiManager.showIncidentLogModal();
          }
          this.onIncidentLogsRead();
        }
      }
    }

    if (this.game.uiManager) {
      if (promptText) {
        this.game.uiManager.showInteractionPrompt(promptText);
      } else {
        this.game.uiManager.hideInteractionPrompt();
      }
    }
  }

  reset() {
    this.currentStep = OBJECTIVE_STEPS_02.INFILTRATE;
    this.lockdownTimer = 45.0;
    this.isLockdownActive = false;
    this.extractionTimer = 180.0;
    this.isExtractionActive = false;
    this._updateHUDObjective();
  }
}
