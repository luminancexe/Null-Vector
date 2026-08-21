# NULL VECTOR — Browser-Based Sci-Fi First-Person Shooter

**Null Vector** is a complete, production-ready, browser-based sci-fi first-person shooter (FPS) developed using HTML5, CSS3, JavaScript (ES6 modules), Three.js (WebGL), Pointer Lock API, and procedural Web Audio API.

The game is 100% self-contained with no external server or backend dependencies, using procedurally synthesized audio, dynamic lighting, custom viewmodels with cybernetic tactical arms, and high-definition procedural textures.

---

## 🚀 Campaign Missions

### 1. Mission 01 — Operation: Blacksite
- **Location**: Subterranean Research Complex Theta-9
- **Status**: Secure Data Retrieval
- **Objectives**:
  1. Breach facility airlock checkpoint.
  2. Clear cargo bay hostiles.
  3. Locate and hack the security core terminal.
  4. Survive a 30-second security lockdown reinforcement wave.
  5. Reach the extraction landing zone and secure the data.

### 2. Mission 02 — Blackout
- **Location**: Research Facility 07
- **Status**: Facility Offline // Power Grid Disabled
- **Objectives**:
  1. Infiltrate facility entrance through the exterior rain landing zone.
  2. Restore auxiliary power in the maintenance tunnels (Relay A).
  3. Activate secondary and tertiary power relays in research and server wings (Relays B & C).
  4. Override security lockdown in the master control room.
  5. Recover classified incident logs (*Project Singularity*) from the server archive.
  6. Survive a 45-second high-threat lockdown arena wave against drones, phantoms, and enforcers.
  7. Investigate the pulsing anomaly in the Central Systems Chamber.
  8. Evacuate to the exterior landing pad under a strict 03:00 critical countdown timer.

---

## 🎮 How to Play

### Running Locally
You can launch the game using any local static server:

#### Option 1: Using Node.js (Built-in Server)
```bash
node server.js
```
Then open your browser at **`http://localhost:3000/`**.

#### Option 2: Using Python
```bash
python -m http.server 3000
```
Then open your browser at **`http://localhost:3000/`**.

---

## 🕹️ Tactical Controls

| Key / Input | Action |
|---|---|
| **W, A, S, D** | Move Forward / Left / Backward / Right |
| **Mouse** | Aim / Look (Pointer Lock) |
| **Left Mouse Button (LMB)** | Fire Active Weapon |
| **Right Mouse Button (RMB)** | Aim Down Sights (ADS / Precision Zoom) |
| **Shift** | Tactical Sprint |
| **Space** | Jump |
| **Ctrl / C** | Crouch |
| **R** | Reload Active Weapon |
| **F** | Toggle Tactical Flashlight (On / Off) |
| **1 - 5** | Select Weapon (Pistol, AR, Shotgun, Plasma, Viper) |
| **Mouse Wheel** | Cycle Equipped Weapons |
| **E** | Interact (Hack Terminals, Activate Relays) |
| **ESC** | Pause Menu / Resume |

---

## 🔫 Weapon Arsenal

1. **P19 Tactical Pistol** (Slot 1)
   - Semi-automatic sidearm with high precision, fast reload, and crisp acoustic profile.
   - Mag size: 12 | Reserve: 48 | Headshot multiplier: 2.5x
2. **AR-44 'Vector' Assault Rifle** (Slot 2)
   - Full-automatic standard issue rifle with 600 RPM fire rate and holographic reticle.
   - Mag size: 30 | Reserve: 120 | Headshot multiplier: 2.2x
3. **SG-12 'Breacher' Shotgun** (Slot 3)
   - Pump-action 8-pellet spread close-quarters devastation with heavy recoil impulse.
   - Mag size: 6 | Reserve: 24 | Devastating point-blank stopping power
4. **PR-9 Plasma Rifle** (Slot 4)
   - Heavy rapid-fire energy weapon firing high-damage plasma bolts with zero drop.
   - Mag size: 20 | Reserve: 60 | High damage per shot
5. **VX-9 'Viper' SMG** (Slot 5)
   - Compact high-RPM suppressed submachine gun engineered for close-quarters room clearing in low-visibility environments.
   - Mag size: 40 | Reserve: 160 | 850 RPM | Fast 1.35s reload

---

## 🤖 Hostile AI Threats

- **Android Enforcer**: Standard assault combatant with burst rifle fire and tactical cover maneuvers.
- **Heavy Juggernaut**: High armor defense unit armed with twin heavy plasma cannons.
- **Cyber Spectre**: Agile melee rusher that sprints and lunges with high-speed evasive pathfinding.
- **Security Drone**: Airborne tilt-rotor drone with searchlight detection cone, plasma burst attack, alert chime broadcasting, and crash explosion physics.
- **Phantom**: Cybernetic stalker utilizing refractive translucent cloaking, close-range de-cloaking (<4.5m), glowing red visor, 28-dmg melee ambush lunge, and smoke retreat.

---

## ⚡ Dynamic Systems & Features

- **Dynamic Power Grid (6 States)**: `OFF`, `AUXILIARY`, `PARTIAL`, `FULL`, `LOCKDOWN`, and `CRITICAL`. Powers facility lighting, strobes, and blast doors.
- **Tactical Flashlight**: Dual spotlight and local fill light with unlimited power and mechanical audio.
- **First-Person Viewmodels**: Procedural 3D weapons with dual cybernetic tactical arms, hands, weapon bob, sprint tuck, ADS sight alignment, and muzzle flashes.
- **Procedural Web Audio API Engine**: 100% synthesized sound effects (gunfire, reloads, impacts, drone hums, cloaking effects, alarm klaxons, and footsteps) with zero external audio assets.
- **Automated QA & Regression Testing**:
  - `node test_mission_02.js` — Comprehensive end-to-end Mission 02 and Mission 01 regression suite.
  - `node test_full_game.js` — Mission 01 end-to-end playthrough audit.
  - `node test_performance_audit.js` — 60 FPS performance, draw calls, and physics audit.
