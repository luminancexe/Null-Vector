/**
 * ObjectiveManager.js
 * Coordinates mission objectives, progress triggers, countdowns, and victory conditions.
 */

import * as THREE from 'three';
import { GameState } from '../core/Game.js';

export const OBJECTIVE_STEPS = {
  BREACH_AIRLOCK: 1,
  CLEAR_CARGO_BAY: 2,
  HACK_TERMINAL: 3,
  SURVIVE_LOCKDOWN: 4,
  REACH_EXTRACTION: 5,
  COMPLETE: 6
};

export class ObjectiveManager {
  constructor(game) {
    this.game = game;
    this.currentStep = OBJECTIVE_STEPS.BREACH_AIRLOCK;

    this.cargoKills = 0;
    this.requiredCargoKills = 3;

    this.lockdownTimer = 30.0;
    this.isLockdownActive = false;

    this._updateHUDObjective();
  }

  _updateHUDObjective() {
    let text = '';
    switch (this.currentStep) {
      case OBJECTIVE_STEPS.BREACH_AIRLOCK:
        text = '1. Infiltrate Facility Checkpoint';
        break;
      case OBJECTIVE_STEPS.CLEAR_CARGO_BAY:
        text = `2. Clear Cargo Bay Patrols (${this.cargoKills}/${this.requiredCargoKills})`;
        break;
      case OBJECTIVE_STEPS.HACK_TERMINAL:
        text = '3. Locate & Hack Security Core Terminal';
        break;
      case OBJECTIVE_STEPS.SURVIVE_LOCKDOWN:
        text = `4. SURVIVE FACILITY LOCKDOWN (${Math.ceil(this.lockdownTimer)}s)`;
        break;
      case OBJECTIVE_STEPS.REACH_EXTRACTION:
        text = '5. Proceed to Extraction Evacuation Zone';
        break;
      case OBJECTIVE_STEPS.COMPLETE:
        text = 'MISSION ACCOMPLISHED';
        break;
    }

    if (this.game.uiManager) {
      this.game.uiManager.setObjective(text);
    }
  }

  onEnemyKilled(enemy) {
    if (this.currentStep === OBJECTIVE_STEPS.CLEAR_CARGO_BAY) {
      this.cargoKills++;
      this._updateHUDObjective();

      if (this.cargoKills >= this.requiredCargoKills) {
        this.advanceStep(OBJECTIVE_STEPS.HACK_TERMINAL);
      }
    }
  }

  onTerminalHacked() {
    if (this.currentStep === OBJECTIVE_STEPS.HACK_TERMINAL) {
      this.advanceStep(OBJECTIVE_STEPS.SURVIVE_LOCKDOWN);
      this.isLockdownActive = true;
      this.lockdownTimer = 30.0;

      // Trigger facility lockdown & lights
      if (this.game.level) {
        this.game.level.triggerLockdown();
      }

      // Spawn reinforcement wave
      if (this.game.enemyManager) {
        this.game.enemyManager.spawnReinforcementWave();
      }
    }
  }

  advanceStep(nextStep) {
    this.currentStep = nextStep;
    console.log(`[ObjectiveManager] Objective updated: Step ${nextStep}`);

    if (nextStep === OBJECTIVE_STEPS.CLEAR_CARGO_BAY) {
      // Open airlock door to cargo bay
      this.game.level?.openDoor('airlock_door');
    } else if (nextStep === OBJECTIVE_STEPS.REACH_EXTRACTION) {
      // Open reactor blast door to extraction zone
      this.game.level?.openDoor('reactor_door');
    } else if (nextStep === OBJECTIVE_STEPS.COMPLETE) {
      // Trigger Victory
      if (this.game.audioManager) this.game.audioManager.playVictory();
      this.game.setState(GameState.VICTORY);
    }

    if (this.game.audioManager) {
      this.game.audioManager.playObjectiveUpdate();
    }

    this._updateHUDObjective();
  }

  update(delta) {
    const player = this.game.player;
    if (!player || player.isDead) return;

    const pPos = player.position;

    // Step 1 check: Moving past airlock gate (Z < 22)
    if (this.currentStep === OBJECTIVE_STEPS.BREACH_AIRLOCK) {
      if (pPos.z < 22) {
        this.advanceStep(OBJECTIVE_STEPS.CLEAR_CARGO_BAY);
      }
    }

    // Step 4: Lockdown countdown
    if (this.currentStep === OBJECTIVE_STEPS.SURVIVE_LOCKDOWN && this.isLockdownActive) {
      this.lockdownTimer -= delta;
      this._updateHUDObjective();

      if (this.lockdownTimer <= 0) {
        this.isLockdownActive = false;
        this.advanceStep(OBJECTIVE_STEPS.REACH_EXTRACTION);
      }
    }

    // Step 5: Extraction area trigger
    if (this.currentStep === OBJECTIVE_STEPS.REACH_EXTRACTION) {
      const evacZone = this.game.level?.extractionZone;
      if (evacZone) {
        const dist = evacZone.position.distanceTo(pPos);
        if (dist < evacZone.radius) {
          this.advanceStep(OBJECTIVE_STEPS.COMPLETE);
        }
      }
    }
  }

  reset() {
    this.currentStep = OBJECTIVE_STEPS.BREACH_AIRLOCK;
    this.cargoKills = 0;
    this.lockdownTimer = 30.0;
    this.isLockdownActive = false;
    this._updateHUDObjective();
  }
}
