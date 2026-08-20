/**
 * StorageManager.js
 * Persists user configuration, audio volumes, sensitivity, and high scores in localStorage.
 */

const STORAGE_KEY_SETTINGS = 'null_vector_settings_v1';
const STORAGE_KEY_STATS = 'null_vector_stats_v1';

export class StorageManager {
  static getDefaultSettings() {
    return {
      sensitivity: 1.5,
      invertY: false,
      masterVolume: 80,
      sfxVolume: 90,
      musicVolume: 60,
      fov: 75
    };
  }

  static loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (data) {
        return { ...this.getDefaultSettings(), ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('[StorageManager] Failed to load settings:', e);
    }
    return this.getDefaultSettings();
  }

  static saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('[StorageManager] Failed to save settings:', e);
    }
  }

  static loadStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STATS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('[StorageManager] Failed to load stats:', e);
    }
    return {
      bestTime: 0,
      highScore: 0,
      totalKills: 0,
      missionsCompleted: 0
    };
  }

  static saveStats(stats) {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('[StorageManager] Failed to save stats:', e);
    }
  }
}
