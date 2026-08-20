/**
 * UIManager.js
 * Controls HUD elements, hitmarkers, vitals display, ammo counters, and overlay effects.
 */

import { GameState } from '../core/Game.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // HUD Elements
    this.hud = document.getElementById('hud');
    this.healthVal = document.getElementById('hud-health-val');
    this.healthBar = document.getElementById('hud-health-bar');
    this.armorVal = document.getElementById('hud-armor-val');
    this.armorBar = document.getElementById('hud-armor-bar');

    this.weaponName = document.getElementById('hud-weapon-name');
    this.ammoCur = document.getElementById('hud-ammo-cur');
    this.ammoRes = document.getElementById('hud-ammo-res');
    this.weaponSlots = [
      document.getElementById('slot-1'),
      document.getElementById('slot-2'),
      document.getElementById('slot-3'),
      document.getElementById('slot-4')
    ];

    this.crosshair = document.getElementById('crosshair-container');
    this.hitmarker = document.getElementById('hitmarker');
    this.damageOverlay = document.getElementById('damage-overlay');
    this.interactionPrompt = document.getElementById('interaction-prompt');
    this.interactionText = document.getElementById('interaction-text');

    this.objectiveText = document.getElementById('hud-objective-text');
    this.missionTimer = document.getElementById('hud-mission-timer');

    // Menu Overlays
    this.menus = {
      loading: document.getElementById('loading-screen'),
      main: document.getElementById('main-menu'),
      pause: document.getElementById('pause-menu'),
      settings: document.getElementById('settings-menu'),
      controls: document.getElementById('controls-menu'),
      credits: document.getElementById('credits-menu'),
      death: document.getElementById('death-menu'),
      victory: document.getElementById('victory-menu')
    };

    // Hitmarker & Bloom timers
    this.hitmarkerTimer = null;
    this.damageTimer = null;
    this.recoilBloom = 0;

    // Ensure HUD and crosshair start hidden until PLAYING state
    if (this.crosshair) this.crosshair.style.display = 'none';
    if (this.hud) this.hud.style.display = 'none';

    this.updateHUD();
  }

  updateHUD() {
    const player = this.game.player;
    if (player) {
      if (this.healthVal) this.healthVal.textContent = Math.ceil(player.health);
      if (this.healthBar) {
        const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
        this.healthBar.style.width = `${hpPercent}%`;
      }

      if (this.armorVal) this.armorVal.textContent = Math.ceil(player.armor);
      if (this.armorBar) {
        const armorPercent = Math.max(0, Math.min(100, (player.armor / player.maxArmor) * 100));
        this.armorBar.style.width = `${armorPercent}%`;
      }

      // Critical health pulse
      if (player.health < 25 && !player.isDead) {
        this.damageOverlay?.classList.add('critical');
      } else {
        this.damageOverlay?.classList.remove('critical');
      }
    }

    const wm = this.game.weaponManager;
    if (wm && wm.activeWeapon) {
      const w = wm.activeWeapon;
      if (this.weaponName) this.weaponName.textContent = w.name;
      if (this.ammoCur) this.ammoCur.textContent = w.isReloading ? '--' : w.currentAmmo;
      if (this.ammoRes) this.ammoRes.textContent = w.reserveAmmo;
    }
  }

  setActiveWeaponSlot(slotNumber) {
    this.weaponSlots.forEach((slot, index) => {
      if (slot) {
        if (index + 1 === slotNumber) {
          slot.classList.add('active');
        } else {
          slot.classList.remove('active');
        }
      }
    });
  }

  showHitmarker(isCrit = false) {
    if (!this.hitmarker) return;

    if (this.hitmarkerTimer) clearTimeout(this.hitmarkerTimer);

    this.hitmarker.className = isCrit ? 'crit' : 'hit';

    this.hitmarkerTimer = setTimeout(() => {
      if (this.hitmarker) this.hitmarker.className = '';
    }, 120);
  }

  onPlayerDamaged(amount, sourcePosition = null) {
    if (!this.damageOverlay) return;

    this.damageOverlay.classList.add('damaged');
    if (this.damageTimer) clearTimeout(this.damageTimer);

    this.damageTimer = setTimeout(() => {
      this.damageOverlay?.classList.remove('damaged');
    }, 220);

    this.updateHUD();
  }

  showInteraction(text, key = 'E') {
    if (this.interactionPrompt && this.interactionText) {
      this.interactionText.textContent = text;
      this.interactionPrompt.style.display = 'block';
    }
  }

  hideInteraction() {
    if (this.interactionPrompt) {
      this.interactionPrompt.style.display = 'none';
    }
  }

  setObjective(text) {
    if (this.objectiveText) {
      this.objectiveText.textContent = text;
    }
  }

  onStateChange(oldState, newState) {
    // Hide all menus
    Object.values(this.menus).forEach(m => m?.classList.remove('active'));

    if (newState === GameState.PLAYING) {
      if (this.hud) this.hud.style.display = 'block';
      if (this.crosshair) this.crosshair.style.display = 'flex';
    } else {
      if (this.crosshair) this.crosshair.style.display = 'none';
    }

    if (newState === GameState.MENU) {
      if (this.hud) this.hud.style.display = 'none';
      this.menus.main?.classList.add('active');
    } else if (newState === GameState.PAUSED) {
      this.menus.pause?.classList.add('active');
    } else if (newState === GameState.DEAD) {
      if (this.hud) this.hud.style.display = 'none';
      this._updateDeathStats();
      this.menus.death?.classList.add('active');
    } else if (newState === GameState.VICTORY) {
      if (this.hud) this.hud.style.display = 'none';
      this._updateVictoryStats();
      this.menus.victory?.classList.add('active');
    }
  }

  _updateDeathStats() {
    const s = this.game.stats;
    const killsEl = document.getElementById('death-stat-kills');
    const timeEl = document.getElementById('death-stat-time');
    const accEl = document.getElementById('death-stat-acc');

    if (killsEl) killsEl.textContent = s.kills;
    if (timeEl) timeEl.textContent = this._formatTime(s.playTime);
    if (accEl) {
      const acc = s.shotsFired > 0 ? Math.round((s.shotsHit / s.shotsFired) * 100) : 0;
      accEl.textContent = `${acc}%`;
    }
  }

  _updateVictoryStats() {
    const s = this.game.stats;
    const timeEl = document.getElementById('vic-stat-time');
    const killsEl = document.getElementById('vic-stat-kills');
    const hsEl = document.getElementById('vic-stat-headshots');
    const accEl = document.getElementById('vic-stat-accuracy');
    const scoreEl = document.getElementById('vic-stat-score');
    const rankEl = document.getElementById('vic-stat-rank');

    const acc = s.shotsFired > 0 ? Math.round((s.shotsHit / s.shotsFired) * 100) : 0;
    const score = (s.kills * 500) + (s.headshots * 300) + Math.max(0, Math.round((300 - s.playTime) * 20));

    let rank = 'B';
    if (score > 6000 && acc > 50) rank = 'S';
    else if (score > 4000) rank = 'A';
    else if (score > 2000) rank = 'B';
    else rank = 'C';

    if (timeEl) timeEl.textContent = this._formatTime(s.playTime);
    if (killsEl) killsEl.textContent = s.kills;
    if (hsEl) hsEl.textContent = s.headshots;
    if (accEl) accEl.textContent = `${acc}%`;
    if (scoreEl) scoreEl.textContent = score;
    if (rankEl) rankEl.textContent = rank;
  }

  onWeaponFired(weapon) {
    const kick = weapon ? weapon.recoilKick : 0.04;
    this.recoilBloom = Math.min(18, this.recoilBloom + kick * 140);
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  update(delta) {
    if (this.game.state === GameState.PLAYING) {
      if (this.missionTimer) {
        this.missionTimer.textContent = this._formatTime(this.game.stats.playTime);
      }

      // Dynamic crosshair spread calculation
      if (this.crosshair) {
        const player = this.game.player;
        const wm = this.game.weaponManager;

        let baseSpread = 6;
        if (wm && wm.activeWeapon) {
          if (wm.activeWeapon.id === 'shotgun') baseSpread = 16;
          else if (wm.activeWeapon.id === 'rifle') baseSpread = 8;
          else if (wm.activeWeapon.id === 'plasma') baseSpread = 5;
          else baseSpread = 6;
        }

        let moveBloom = 0;
        if (player) {
          const hSpeed = Math.hypot(player.velocity.x, player.velocity.z);
          if (player.isSprinting) moveBloom = 10;
          else if (hSpeed > 0.5) moveBloom = 4;
          else if (player.isCrouching) moveBloom = -2;
        }

        if (wm && wm.isADS) {
          this.crosshair.classList.add('ads');
          baseSpread = 2;
          moveBloom = 0;
        } else {
          this.crosshair.classList.remove('ads');
        }

        // Decay recoil bloom
        if (this.recoilBloom > 0) {
          this.recoilBloom = Math.max(0, this.recoilBloom - delta * 30);
        }

        const totalSpread = Math.max(1, Math.round(baseSpread + moveBloom + this.recoilBloom));
        this.crosshair.style.setProperty('--spread', `${totalSpread}px`);
      }
    } else if (this.crosshair) {
      this.crosshair.style.display = 'none';
    }
  }
}
