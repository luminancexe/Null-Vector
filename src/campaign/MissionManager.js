/**
 * MissionManager.js
 * Campaign and Mission Architecture coordinator for Null Vector.
 * Manages mission registry, level loading, objective systems, and mission progression.
 */

import { Level } from '../level/Level.js';
import { ObjectiveManager } from '../systems/ObjectiveManager.js';
import { Level02 } from '../level/Level02.js';
import { ObjectiveManager02 } from '../systems/ObjectiveManager02.js';

export const MISSIONS = {
  mission_01: {
    id: 'mission_01',
    number: '01',
    title: 'OPERATION: BLACKSITE',
    shortName: 'BLACKSITE',
    location: 'SUBTERRANEAN COMPLEX THETA-9',
    status: 'ACTIVE HOSTILE',
    briefing: {
      location: 'SUBTERRANEAN RESEARCH COMPLEX THETA-9',
      status: 'DEFENSE PROTOCOL ACTIVE',
      objective: 'INFILTRATE FACILITY CHECKPOINT.\nCLEAR CARGO BAY PATROLS.\nHACK SECURITY CORE TERMINAL.\nSURVIVE LOCKDOWN & EXTRACT.'
    },
    spawnPos: { x: 0, y: 0, z: 32, yaw: 0 },
    createLevel: (game) => new Level(game),
    createObjectives: (game) => new ObjectiveManager(game)
  },
  mission_02: {
    id: 'mission_02',
    number: '02',
    title: 'BLACKOUT',
    shortName: 'BLACKOUT',
    location: 'RESEARCH FACILITY 07',
    status: 'OFFLINE // POWER DISABLED',
    briefing: {
      location: 'RESEARCH FACILITY 07',
      status: 'OFFLINE // PRIMARY POWER DISABLED',
      objective: 'INVESTIGATE THE FACILITY.\nRESTORE AUXILIARY POWER.\nRECOVER THE INCIDENT LOGS.\nIDENTIFY THE SOURCE OF THE BLACKOUT.\nEXTRACT.'
    },
    spawnPos: { x: 0, y: 0, z: 48, yaw: 0 },
    createLevel: (game) => new Level02(game),
    createObjectives: (game) => new ObjectiveManager02(game)
  }
};

export class MissionManager {
  constructor(game) {
    this.game = game;
    this.activeMissionId = 'mission_01';
    this.activeMission = MISSIONS.mission_01;
    this.missions = MISSIONS;
  }

  registerMission(missionId, missionConfig) {
    this.missions[missionId] = { ...this.missions[missionId], ...missionConfig };
  }

  selectMission(missionId) {
    if (!this.missions[missionId]) {
      console.warn(`[MissionManager] Mission '${missionId}' not found, defaulting to mission_01`);
      missionId = 'mission_01';
    }
    this.activeMissionId = missionId;
    this.activeMission = this.missions[missionId];
    console.log(`[MissionManager] Selected mission: ${this.activeMission.title}`);
  }

  loadActiveMission() {
    console.log(`[MissionManager] Loading ${this.activeMission.title}...`);
    const game = this.game;

    // 1. Clean up old level & objects
    if (game.level) {
      if (game.level.cleanup && typeof game.level.cleanup === 'function') {
        game.level.cleanup();
      } else if (game.level.meshGroup) {
        game.scene.remove(game.level.meshGroup);
      }
      game.level = null;
    }

    // 2. Clear enemies
    if (game.enemyManager) {
      game.enemyManager.clearAll();
    }

    // 3. Clear decals
    if (game.decalManager) {
      game.decalManager.reset();
    }

    // 4. Instantiate new Level
    if (typeof this.activeMission.createLevel === 'function') {
      game.level = this.activeMission.createLevel(game);
    } else {
      game.level = new Level(game);
    }

    // 5. Instantiate new Objective Manager
    if (typeof this.activeMission.createObjectives === 'function') {
      game.objectiveManager = this.activeMission.createObjectives(game);
    } else {
      game.objectiveManager = new ObjectiveManager(game);
    }

    // 6. Reset Player to Mission Spawn Point
    const spawn = this.activeMission.spawnPos || { x: 0, y: 0, z: 32, yaw: 0 };
    if (game.player) {
      game.player.setSpawn(spawn.x, spawn.y, spawn.z, spawn.yaw || 0);
    }

    // 7. Update UI HUD and objective title
    if (game.uiManager) {
      game.uiManager.setMissionTitle(this.activeMission.title);
      game.uiManager.updateHUD();
    }

    console.log(`[MissionManager] ${this.activeMission.title} loaded successfully.`);
  }

  restartActiveMission() {
    console.log(`[MissionManager] Restarting ${this.activeMission.title}...`);
    const game = this.game;

    // Reset stats
    game.stats = {
      playTime: 0,
      kills: 0,
      headshots: 0,
      shotsFired: 0,
      shotsHit: 0
    };

    // Reset player position & vitals
    const spawn = this.activeMission.spawnPos || { x: 0, y: 0, z: 32, yaw: 0 };
    if (game.player) {
      game.player.setSpawn(spawn.x, spawn.y, spawn.z, spawn.yaw || 0);
    }

    // Reset weapons
    if (game.weaponManager) {
      Object.values(game.weaponManager.weapons).forEach(w => w.reset());
      game.weaponManager.equipSlot(1, true);
    }

    // Reset Level
    if (game.level && typeof game.level.reset === 'function') {
      game.level.reset();
    }

    // Reset Objectives
    if (game.objectiveManager && typeof game.objectiveManager.reset === 'function') {
      game.objectiveManager.reset();
    }

    // Reset Enemies
    if (game.enemyManager) {
      game.enemyManager.reset();
    }

    // Reset Decals
    if (game.decalManager) {
      game.decalManager.reset();
    }

    // Update UI
    if (game.uiManager) {
      game.uiManager.setMissionTitle(this.activeMission.title);
      game.uiManager.updateHUD();
    }
  }
}
