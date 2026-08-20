/**
 * Weapon.js
 * Weapon base class and weapon definitions.
 */

export class Weapon {
  constructor(config = {}) {
    this.id = config.id || 'pistol';
    this.name = config.name || 'P19 TACTICAL';
    this.slot = config.slot || 1;
    
    // Combat Stats
    this.damage = config.damage || 24;
    this.headshotMultiplier = config.headshotMultiplier || 2.5;
    this.fireRate = config.fireRate || 0.22; // Seconds between shots
    this.isAutomatic = config.isAutomatic || false;
    this.pellets = config.pellets || 1;
    this.spread = config.spread || 0.008;
    this.range = config.range || 100;
    
    // Ammunition
    this.magSize = config.magSize || 12;
    this.currentAmmo = config.magSize || 12;
    this.reserveAmmo = config.reserveAmmo || 48;
    this.maxReserve = config.maxReserve || 96;
    this.reloadTime = config.reloadTime || 1.4;

    // Recoil
    this.recoilKick = config.recoilKick || 0.06; // Viewmodel kickback
    this.recoilPitch = config.recoilPitch || 0.035; // Camera pitch kick
    this.recoilYaw = config.recoilYaw || 0.01;

    // Timers & State
    this.fireTimer = 0;
    this.isReloading = false;
    this.reloadTimer = 0;

    // Callbacks
    this.onFireCallback = null;
    this.onReloadStartCallback = null;
    this.onReloadCompleteCallback = null;
  }

  canFire() {
    return !this.isReloading && this.fireTimer <= 0 && this.currentAmmo > 0;
  }

  fire() {
    if (!this.canFire()) {
      if (this.currentAmmo === 0 && !this.isReloading) {
        this.reload();
      }
      return false;
    }

    this.currentAmmo--;
    this.fireTimer = this.fireRate;

    if (this.onFireCallback) {
      this.onFireCallback(this);
    }
    return true;
  }

  reload() {
    if (this.isReloading) return false;
    if (this.currentAmmo >= this.magSize) return false;
    if (this.reserveAmmo <= 0) return false;

    this.isReloading = true;
    this.reloadTimer = this.reloadTime;

    if (this.onReloadStartCallback) {
      this.onReloadStartCallback(this);
    }
    return true;
  }

  addAmmo(amount) {
    const needed = this.maxReserve - this.reserveAmmo;
    const added = Math.min(needed, amount);
    this.reserveAmmo += added;
    return added;
  }

  update(delta) {
    if (this.fireTimer > 0) {
      this.fireTimer -= delta;
    }

    if (this.isReloading) {
      this.reloadTimer -= delta;
      if (this.reloadTimer <= 0) {
        this._finishReload();
      }
    }
  }

  _finishReload() {
    this.isReloading = false;
    const needed = this.magSize - this.currentAmmo;
    const take = Math.min(needed, this.reserveAmmo);
    this.currentAmmo += take;
    this.reserveAmmo -= take;

    if (this.onReloadCompleteCallback) {
      this.onReloadCompleteCallback(this);
    }
  }

  reset() {
    this.currentAmmo = this.magSize;
    this.reserveAmmo = Math.floor(this.maxReserve * 0.5);
    this.isReloading = false;
    this.fireTimer = 0;
    this.reloadTimer = 0;
  }
}

/**
 * Predefined Weapon Presets
 */
export const WEAPON_PRESETS = {
  pistol: {
    id: 'pistol',
    name: 'P19 TACTICAL',
    slot: 1,
    damage: 25,
    headshotMultiplier: 2.5,
    fireRate: 0.2,
    isAutomatic: false,
    pellets: 1,
    spread: 0.006,
    range: 100,
    magSize: 12,
    reserveAmmo: 48,
    maxReserve: 96,
    reloadTime: 1.2,
    recoilKick: 0.05,
    recoilPitch: 0.03,
    recoilYaw: 0.008
  },
  rifle: {
    id: 'rifle',
    name: 'AR-44 VECTOR',
    slot: 2,
    damage: 22,
    headshotMultiplier: 2.2,
    fireRate: 0.1, // 600 RPM
    isAutomatic: true,
    pellets: 1,
    spread: 0.016,
    range: 120,
    magSize: 30,
    reserveAmmo: 120,
    maxReserve: 240,
    reloadTime: 1.8,
    recoilKick: 0.04,
    recoilPitch: 0.022,
    recoilYaw: 0.012
  },
  shotgun: {
    id: 'shotgun',
    name: 'SG-12 BREACHER',
    slot: 3,
    damage: 16, // per pellet (x8 = 128 max dmg)
    headshotMultiplier: 1.8,
    fireRate: 0.65,
    isAutomatic: false,
    pellets: 8,
    spread: 0.055,
    range: 40,
    magSize: 6,
    reserveAmmo: 24,
    maxReserve: 48,
    reloadTime: 2.2,
    recoilKick: 0.12,
    recoilPitch: 0.07,
    recoilYaw: 0.02
  },
  plasma: {
    id: 'plasma',
    name: 'PR-9 PLASMA RIFLE',
    slot: 4,
    damage: 38,
    headshotMultiplier: 2.0,
    fireRate: 0.18,
    isAutomatic: true,
    pellets: 1,
    spread: 0.004,
    range: 150,
    magSize: 20,
    reserveAmmo: 60,
    maxReserve: 120,
    reloadTime: 1.9,
    recoilKick: 0.06,
    recoilPitch: 0.028,
    recoilYaw: 0.01
  }
};
