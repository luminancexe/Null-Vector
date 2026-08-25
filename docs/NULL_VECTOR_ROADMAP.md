# NULL VECTOR — MASTER DEVELOPMENT ROADMAP & PROJECT BIBLE
**The Canonical Architecture, Development History, and Long-Term Roadmap**

---

## DOCUMENT METADATA

- **Document Version**: `2.0.0`
- **Project Designation**: `NULL VECTOR`
- **Classification**: `CANONICAL SPECIFICATION // PROJECT BIBLE`
- **Author**: `Null Vector Core Development Team`
- **Target Platform**: `Desktop Modern Web Browsers (Chrome, Edge, Firefox)`
- **Technology Stack**: `HTML5, CSS3, Vanilla JavaScript (ES6+), Three.js (WebGL2), Web Audio API, Pointer Lock API, LocalStorage`

---

## TABLE OF CONTENTS

1. [Section 1 — Project Overview](#section-1--project-overview)
2. [Section 2 — Design Pillars](#section-2--design-pillars)
3. [Section 3 — Current Game Architecture](#section-3--current-game-architecture)
4. [Section 4 — Development Phase Roadmap](#section-4--development-phase-roadmap)
   - [Part I: Foundation & Core Engine (Phases 01–12)](#part-i-foundation--core-engine-phases-0112)
   - [Part II: Campaign Architecture (Phase 13)](#part-ii-campaign-architecture-phase-13)
   - [Part III: Mission 02 — Blackout Expansion (Phases 14–22)](#part-iii-mission-02--blackout-expansion-phases-1422)
   - [Part IV: Current Narrative State](#part-iv-current-narrative-state)
   - [Part V: Future Campaign & Engine Roadmap (Phases 23–42)](#part-v-future-campaign--engine-roadmap-phases-2342)
5. [Section 5 — Mission Roadmap Table](#section-5--mission-roadmap-table)
6. [Section 6 — System Evolution Matrix](#section-6--system-evolution-matrix)
7. [Section 7 — Technical Architecture Roadmap](#section-7--technical-architecture-roadmap)
8. [Section 8 — QA Verification & Definition of Done](#section-8--qa-verification--definition-of-done)
9. [Section 9 — Status Legend & Current Project State](#section-9--status-legend--current-project-state)

---

## SECTION 1 — PROJECT OVERVIEW

**NULL VECTOR** is a browser-based, first-person sci-fi tactical shooter engineered to deliver a self-contained, desktop-grade FPS experience directly within modern web browsers without external game engine plugins, heavy downloads, or third-party asset dependencies.

### Core Experience

- **Tactical First-Person Combat**: Responsive weapon mechanics, distinct ballistic/energy recoil profiles, dynamic crosshair bloom, aim-down-sights (ADS) precision zooming, headshot reward multipliers, and reactive cybernetic enemy AI.
- **First-Person Physical Immersion**: Procedural 3D viewmodels featuring dual cybernetic tactical arms and hands, physical weapon bob, inertia sway, sprint tuck transitions, and landing compressions.
- **Atmospheric Sci-Fi Environments**: High-contrast industrial sci-fi research complexes characterized by volumetric distance fog, dynamic lighting grids, environmental weather effects (exterior rain particles), strobe alarm klaxons, and interactive facility power grids.
- **Procedural Technical Self-Containment**: 100% procedural Web Audio API acoustic synthesis, procedural canvas-generated materials and textures, and procedural Three.js geometry.
- **Episodic Campaign Progression**: Multi-mission narrative structure driven by classified terminal records, environmental investigation, facility subsystem restoration, and an overarching mystery centered around the catastrophic failure of **Project Singularity**.

```
+-----------------------------------------------------------------------------------+
|                                    NULL VECTOR                                    |
|                                                                                   |
|  [ MISSION 01 ]                           [ MISSION 02 ]                          |
|  OPERATION: BLACKSITE                     BLACKOUT                                |
|  - Complex Theta-9                        - Research Facility 07                  |
|  - Checkpoint Breach                      - Dynamic 6-State Power Grid            |
|  - Cargo Bay Androids                     - Tactical Flashlight [F]               |
|  - Security Terminal Hack                 - Relays A / B / C Subsystems           |
|  - 30s Lockdown Defense                   - VX-9 Viper SMG (Slot 5)               |
|  - Data Extraction LZ                     - Security Drones & Phantoms            |
|                                           - Incident Logs Record 77-B             |
|                                           - 45s Arena Lockdown                    |
|                                           - Project Singularity Anomaly           |
|                                           - 03:00 Critical Evacuation             |
|                                                                                   |
|                                         ▼                                         |
|                           [ STORY PROGRESSION POINT ]                             |
|                           PROJECT SINGULARITY: CRITICAL                           |
|                               TO BE CONTINUED...                                  |
+-----------------------------------------------------------------------------------+
```

---

## SECTION 2 — DESIGN PILLARS

```
                               ┌─────────────────────────┐
                               │       NULL VECTOR       │
                               │      DESIGN PILLARS     │
                               └────────────┬────────────┘
         ┌───────────────┬──────────────────┼──────────────────┬───────────────┐
         │               │                  │                  │               │
         ▼               ▼                  ▼                  ▼               ▼
  1. FIRST-PERSON  2. TACTICAL        3. ATMOSPHERIC     4. MISSION-BASED 5. STORY BY
    IMMERSION         COMBAT             SCI-FI            PROGRESSION      DISCOVERY
         │               │                  │                  │               │
         └───────────────┼──────────────────┴──────────────────┼───────────────┘
                         ▼                                     ▼
                  6. PROGRESSIVE                        7. TECHNICAL
                     GAMEPLAY                           SELF-CONTAINMENT
```

### 1. First-Person Immersion
The player must always feel physical and grounded within the virtual environment. Camera movement incorporates subtle inertial head-bobbing, sprint dips, and landing compressions. Weapon viewmodels feature fully modeled mechanical receivers and dual tactical cybernetic arms that react realistically to movement, reload cycles, and precision aiming.

### 2. Tactical Combat
Gunplay rewards positioning, situational awareness, movement discipline, target prioritization, and weapon selection. Each weapon in the 5-slot arsenal fills a distinct tactical combat role, from close-quarters shotgun breaches to rapid suppressed SMG room clearances.

### 3. Atmospheric Sci-Fi
Lighting, procedural audio, volumetric fog, and environmental effects establish a bleak, high-tech industrial aesthetic. Pitch-black facilities require active flashlight navigation, while dynamic alarms bathe arenas in pulsing red warning strobes.

### 4. Mission-Based Progression
The campaign is divided into standalone, highly replayable operational deployments with independent objectives, enemy rosters, environmental mechanics, spawn parameters, and score evaluations.

### 5. Story Through Discovery
Narrative is integrated into gameplay rather than passive cutscenes. Operatives uncover classified lore through interactive security terminals, incident logs, distress transmissions, environmental anomalies, and emergency evacuation directives.

### 6. Progressive Gameplay
Each subsequent deployment expands the operative's tactical toolkit and introduces new facility-scale mechanics, enemy archetypes, weapon platforms, and environmental hazards.

### 7. Technical Self-Containment
All textures, acoustic profiles, particle effects, and 3D weapon viewmodels are generated procedurally at runtime using native browser APIs (Canvas2D, WebGL2, Web Audio API), ensuring zero external bandwidth overhead, sub-second boot times, and complete offline capability.

---

## SECTION 3 — CURRENT GAME ARCHITECTURE

The codebase is organized into modular ES6 subsystems located under `src/`, with headless browser automated test suites isolated in `tests/`.

```
D:\Projects\Null Vector\
├── index.html                  # Main UI DOM, HUD layers, modals, crosshair container
├── style.css                   # Cyberpunk HUD styling, modal layouts, CRT/vignette overlays
├── server.js                   # Node.js local HTTP server
├── docs\
│   └── NULL_VECTOR_ROADMAP.md  # Canonical Development Roadmap & Project Bible
├── src\
│   ├── main.js                 # Entry point, DOM event listeners, boot sequencer
│   ├── campaign\
│   │   └── MissionManager.js   # Campaign registry, mission loader, lifecycle manager
│   ├── core\
│   │   ├── Game.js             # Engine director, state machine, primary requestAnimationFrame loop
│   │   ├── InputManager.js     # Pointer Lock, keyboard mappings, mouse buttons & wheel
│   │   ├── AudioManager.js     # Procedural Web Audio API synthesis engine
│   │   └── StorageManager.js   # LocalStorage preferences & persistent statistics
│   ├── entities\
│   │   ├── Player.js           # Kinematic character controller, swept AABB physics, vitals
│   │   ├── Flashlight.js       # Camera-mounted spotlight & ambient fill lighting
│   │   ├── Weapon.js           # Weapon data presets, firing state logic, reload timers
│   │   ├── WeaponManager.js    # Viewmodels, dual cybernetic arms, ADS lerping, weapon sway
│   │   ├── Enemy.js            # Base enemy Finite State Machine (FSM) & 3D mesh generator
│   │   ├── EnemyManager.js     # Enemy spawning, wave director, collision spatial tracking
│   │   ├── SecurityDrone.js    # Mission 02 tilt-rotor flying drone AI with searchlight cone
│   │   ├── Phantom.js          # Mission 02 refractive stealth cloaked cyber-stalker AI
│   │   └── Pickups.js          # Health, Armor, and Ammo field supply caches
│   ├── level\
│   │   ├── Level.js            # Mission 01 environment (Subterranean Complex Theta-9)
│   │   ├── Level02.js          # Mission 02 environment (Research Facility 07)
│   │   ├── NavGraph.js         # Multi-room waypoint graph & A* pathfinding
│   │   └── TextureGenerator.js # Procedural Canvas2D texture generator (metal, hazard, server)
│   ├── systems\
│   │   ├── ShootingSystem.js   # Raycasting, hit detection, headshots, tracers, damage application
│   │   ├── ParticleSystem.js   # Object-pooled spark lines, muzzle flashes, smoke puffs, debris
│   │   ├── DecalManager.js     # Impact bullet holes on geometry surfaces
│   │   ├── PowerManager.js     # Dynamic 6-state facility power grid & subsystem controller
│   │   ├── ObjectiveManager.js # Mission 01 objective state machine (6 steps)
│   │   └── ObjectiveManager02.js# Mission 02 objective state machine (8 steps)
│   └── ui\
│       └── UIManager.js        # HUD updates, dynamic crosshair spread, menu overlays
└── tests\
    ├── test_mission_02.js      # Mission 02 & Mission 01 regression automated CDP test suite
    ├── test_full_game.js       # Mission 01 end-to-end campaign playthrough audit
    ├── test_performance_audit.js# 60 FPS, draw call, triangle, and memory audit
    ├── test_viewmodel_crosshair.js# Centered crosshair, viewmodel arms, and ADS alignment audit
    ├── test_shooting.js        # Ballistics, ammo decrement, reload, and switching test
    ├── test_player.js          # Kinematic controller, sprint, crouch, jump, and collision test
    └── test-runner.js          # Headless browser runtime exception & console error test
```

---

## SECTION 4 — DEVELOPMENT PHASE ROADMAP

### Part I: Foundation & Core Engine (Phases 01–12)

#### Phase 01 — Engine Foundation
- **Status**: `COMPLETE`
- **Architecture**: WebGL2 renderer powered by Three.js with ACES Filmic Tone Mapping, directional shadow mapping, and dynamic viewport resize listeners.
- **Core Loop**: Deterministic delta-time update loop (`_loop` in `Game.js`) decoupling physics simulation from rendering frames.
- **Game State Machine**: Strict enum-driven states: `LOADING`, `MENU`, `PLAYING`, `PAUSED`, `DEAD`, `VICTORY`.
- **Pointer Lock**: Browser-native Pointer Lock API integration with user gesture activation and automatic pause trigger on lock loss.

#### Phase 02 — Player Controller
- **Status**: `COMPLETE`
- **Controller**: Kinematic first-person character controller with swept AABB obstacle collision resolution against static level meshes.
- **Locomotion**: Standing height ($1.8\text{ m}$), crouching height ($1.0\text{ m}$), walk speed ($6.0\text{ m/s}$), sprint speed ($9.5\text{ m/s}$), crouch speed ($3.2\text{ m/s}$), jump impulse ($7.8\text{ m/s}$), gravity ($22.0\text{ m/s}^2$).
- **Camera Dynamics**: Euler yaw/pitch clamping ($-89^\circ$ to $+89^\circ$), harmonic head bobbing, sprint camera tuck, landing impact dip, and inertia smoothing.

#### Phase 03 — First Weapon (P19 Tactical Pistol)
- **Status**: `COMPLETE`
- **Ballistics**: Hitscan raycasting via `ShootingSystem.js` with instant trajectory evaluation and point-of-impact calculation.
- **Stats**: Semi-automatic sidearm, $12$-round magazine, $48$ reserve, $24$ base damage, $2.5\times$ headshot multiplier, $0.95\text{ s}$ reload.
- **Viewmodel**: Procedural 3D composite mesh featuring slide receiver, grip, tactical trigger guard, and animated recoil kick.

#### Phase 04 — Complete Arsenal (Slots 1–4)
- **Status**: `COMPLETE`
- **Arsenal Matrix**:
  - **Slot 1 — P19 Tactical Pistol**: Semi-automatic precision sidearm ($12/48$ ammo, $24$ dmg).
  - **Slot 2 — AR-44 Vector**: Fully automatic assault rifle ($30/120$ ammo, $18$ dmg, $600\text{ RPM}$, holographic reticle).
  - **Slot 3 — SG-12 Breacher**: Pump-action combat shotgun ($6/24$ ammo, $8\text{ pellets}\times 12\text{ dmg}$, heavy recoil).
  - **Slot 4 — PR-9 Plasma Rifle**: Rapid energy rifle ($20/60$ ammo, $45\text{ dmg}$, $300\text{ RPM}$, glowing plasma bolts).
- **Mechanics**: Number keys `1–4` and mouse wheel cycling, ADS zoom with weapon alignment, progressive reload state machine, and dynamic spread bloom.

#### Phase 05 — Level & Environment (Complex Theta-9)
- **Status**: `COMPLETE`
- **Architecture**: Modular multi-room subterranean research complex (`Level.js`) featuring entrance airlock, cargo bay, catwalks, stairwells, server core, and extraction helipad.
- **Materials**: Procedural Canvas2D textures generated at runtime (`TextureGenerator.js`) for industrial grid floors, paneled metal walls, hazard stripes, server LED banks, and glowing extraction pads.
- **Interactivity**: Automatic sliding security doors, interactive override terminals (`[E]`), and rotating health/armor/ammo pickup caches.

#### Phase 06 — Enemy AI System
- **Status**: `COMPLETE`
- **Enemy Roster**:
  - **Android Enforcer**: Standard assault unit ($100\text{ HP}$, burst rifle, tactical cover maneuvers).
  - **Heavy Juggernaut**: Armored tank unit ($350\text{ HP}$, twin heavy plasma cannons, steady advance).
  - **Cyber Spectre**: Agile melee stalker ($70\text{ HP}$, high-speed evasive sprint, leap attack).
- **AI State Machine**: 6-state FSM: `PATROL` $\to$ `DETECT` $\to$ `CHASE` $\to$ `ATTACK` $\to$ `SEARCH` $\to$ `DEAD`.
- **Navigation**: Multi-room waypoint network (`NavGraph.js`) utilizing $A^*$ pathfinding and dynamic line-of-sight raycasting.

#### Phase 07 — Combat Polish & Visual FX
- **Status**: `COMPLETE`
- **Hit Detection**: Multi-zone body colliders with dedicated headshot hitboxes ($2.0\times$ to $2.5\times$ damage scalar).
- **Particle System**: Object-pooled particles (`ParticleSystem.js`) for directional spark bursts, expanding smoke puffs, explosive debris, and cyan plasma flares.
- **Feedback**: Dynamic crosshair hitmarkers with audio confirmation, screen camera trauma shake, red directional damage vignette, and wall bullet hole decals (`DecalManager.js`).

#### Phase 08 — Mission 01 Objectives (Operation: Blacksite)
- **Status**: `COMPLETE`
- **Designation**: `OPERATION: BLACKSITE` (Location: Subterranean Research Complex Theta-9).
- **Sequence**:
  1. *Breach Facility Airlock Checkpoint*
  2. *Clear Cargo Bay Android Patrols*
  3. *Locate & Hack Security Core Terminal (`[E]`)*
  4. *Survive 30-Second Facility Lockdown Reinforcement Wave*
  5. *Reach Extraction Landing Zone*
  6. *Mission Accomplished & Performance Evaluation (Rank S/A/B/C)*

#### Phase 09 — HUD & User Interface
- **Status**: `COMPLETE`
- **HUD Systems**: Dynamic centered crosshair with spread expansion, real-time Health/Armor bars, active weapon card, ammo reserve counter, active slot indicator, and mission objective status banner.
- **Menus**: Cyberpunk-styled overlays with backdrop blur for Main Menu, Mission Selector, Settings (FOV, Sensitivity, Master/SFX/Music Volumes, Invert Y), Controls guide, Death screen, and Victory screen.

#### Phase 10 — Procedural Web Audio Engine
- **Status**: `COMPLETE`
- **Synthesis Engine**: Real-time Web Audio API synthesizer (`AudioManager.js`) generating 100% procedural acoustic waveforms.
- **Audio Profiles**: Synthesized gunshot acoustics for all weapons, mechanical slide reloads, dry-fire clicks, footstep cadences, bullet impact sparks, terminal hacking tones, alarm klaxons, and spatial 3D audio attenuation.

#### Phase 11 — Engine Polish & Performance Optimization
- **Status**: `COMPLETE`
- **Optimizations**: Static level mesh batching, material instance reuse, particle geometry pooling, garbage collection reduction, and swept-sphere raycast pruning.

#### Phase 12 — Final QA & Initial Release
- **Status**: `COMPLETE`
- **Validation**: Independent automated playthrough test suites passing with 0 console errors, 0 dropped frames, and full state-machine verification.

---

### Part II: Campaign Architecture (Phase 13)

```
                            ┌─────────────────────────┐
                            │     MissionManager      │
                            │   (Campaign Registry)   │
                            └────────────┬────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
      ┌─────────────────────┐                         ┌─────────────────────┐
      │     MISSION 01      │                         │     MISSION 02      │
      │ OPERATION: BLACKSITE│                         │      BLACKOUT       │
      ├─────────────────────┤                         ├─────────────────────┤
      │ Level.js            │                         │ Level02.js          │
      │ ObjectiveManager.js │                         │ ObjectiveManager02.js│
      │ Subterranean Theta-9│                         │ PowerManager.js     │
      │ Spawn: (0, 0, 32)   │                         │ Flashlight.js       │
      │ Slots: 1–4          │                         │ Slot 5 (VX-9 Viper) │
      │ Enforcer/Jugg/Spec  │                         │ Drone / Phantom     │
      │ 30s Lockdown        │                         │ 45s Arena + 3m Evac │
      └─────────────────────┘                         └─────────────────────┘
```

#### Phase 13 — Campaign Architecture & Mission Management
- **Status**: `COMPLETE`
- **Core Implementation**: `src/campaign/MissionManager.js`
- **Features**:
  - Independent mission registry supporting modular level loaders, objective managers, spawn configurations, and asset lifecycles.
  - Interactive Mission Selector (`#mission-select-menu`) and Mission Briefing modal (`#briefing-menu`) displaying classified intelligence, location data, grid status, and mission directives before deployment.
  - Clean state transitions between missions without page reloads or memory leaks.

---

### Part III: Mission 02 — Blackout Expansion (Phases 14–22)

#### Phase 14 — Mission 02 Environment (Research Facility 07)
- **Status**: `COMPLETE`
- **Location**: `RESEARCH FACILITY 07`
- **8 Implemented Zones in `Level02.js`**:
  1. **Exterior Rain LZ**: Dark atmospheric landing zone with exterior weather emitter (250 procedural rain particles) and beacon lighting.
  2. **Maintenance Tunnels & Relay A**: Industrial conduit corridors housing primary Auxiliary Power Relay A.
  3. **Research Wing & Relay B**: Bioluminescent containment laboratories housing Power Relay B.
  4. **Security Control Room**: Master security override console and facility surveillance terminals.
  5. **Server Archive & Relay C**: High-density server pods housing classified data and Power Relay C.
  6. **Lockdown Arena**: High-ceiling combat arena secured by heavy motorized blast doors.
  7. **Central Systems Chamber**: Core anomaly chamber containing the pulsing Project Singularity containment reactor.
  8. **Extraction Evacuation Zone**: Remote exterior landing pad with emergency guidance beacons.

#### Phase 15 — Dynamic 6-State Facility Power System
- **Status**: `COMPLETE`
- **Core Implementation**: `src/systems/PowerManager.js`
- **Power Grid States**:
  - `OFF`: Complete blackout; facility emergency lights at $0\%$ intensity; powered doors locked; HUD indicator: `POWER: OFF`.
  - `AUXILIARY`: Restored upon activating Relay A (`[E]`); maintenance lighting restored ($30\%$); entrance blast hatch unlocked.
  - `PARTIAL`: Restored upon activating Relay B; research wing systems and secondary corridors powered ($60\%$).
  - `FULL`: Restored upon activating Relay C (3/3 Relays); full facility illumination ($100\%$); lockdown arena blast doors unlocked.
  - `LOCKDOWN`: Triggered upon accessing classified incident logs; pulsing red emergency strobes ($2.5\text{ Hz}$) and facility alarm klaxons.
  - `CRITICAL`: Triggered upon anomaly reactor breach in Central Systems; initiates $03:00$ critical evacuation countdown.

#### Phase 16 — Tactical Flashlight System
- **Status**: `COMPLETE`
- **Core Implementation**: `src/entities/Flashlight.js`
- **Features**:
  - Camera-mounted spotlight ($\text{angle}: 0.38\text{ rad}$, $\text{penumbra}: 0.45$, $\text{distance}: 32\text{ m}$, $\text{intensity}: 2.4$) paired with a local fill pointlight ($\text{distance}: 4.5\text{ m}$, $\text{intensity}: 0.5$).
  - Toggleable via key `[F]` with procedural mechanical switch audio and HUD status indicator (`[F] LIGHT: ON / OFF`).
  - Unlimited battery power by design to support deliberate tactical exploration.

#### Phase 17 — VX-9 Viper SMG (Slot 5)
- **Status**: `COMPLETE`
- **Weapon Specifications (`Weapon.js` & `WeaponManager.js`)**:
  - **Slot**: `5` (Selectable via key `[5]` or mouse wheel cycle).
  - **Magazine Capacity**: $40\text{ rounds}$ ($160\text{ reserve}$).
  - **Fire Rate**: $850\text{ RPM}$ (Full-automatic).
  - **Damage**: $14\text{ base damage}$ ($2.2\times$ headshot multiplier).
  - **Reload Duration**: $1.35\text{ s}$ rapid tactical reload.
  - **Procedural Viewmodel**: Compact receiver, top Picatinny rail with holographic sight and glowing cyan reticle, forward angled grip, cyan power conduit, and dual tactical cybernetic arms and hands.
  - **ADS System**: Right-click precision aiming down holographic optic with reduced spread bloom.

#### Phase 18 — Security Drone AI
- **Status**: `COMPLETE`
- **Core Implementation**: `src/entities/SecurityDrone.js`
- **Characteristics**:
  - Airborne tilt-rotor drone hovering at $2.8\text{ m}$ altitude with dynamic banking physics.
  - Forward-projected searchlight detection cone scanning corridors for operatives.
  - Rapid-fire twin plasma blaster bursts accompanied by audible frequency-modulated alert chirps.
  - Explosive crash physics and particle debris on neutralization.

#### Phase 19 — Phantom AI (Cyber Stalker)
- **Status**: `COMPLETE`
- **Core Implementation**: `src/entities/Phantom.js`
- **Characteristics**:
  - Translucent refractive stealth cloaking material allowing near-invisible approach.
  - Stalks operative quietly before de-cloaking within close range ($<4.5\text{ m}$) with a glowing red visor.
  - High-damage ($28\text{ dmg}$) melee ambush lunge, smoke screen deployment on taking damage, tactical retreat, and re-cloaking cycle.

#### Phase 20 — Mission 02 Objective Sequence
- **Status**: `COMPLETE`
- **Core Implementation**: `src/systems/ObjectiveManager02.js`
- **8-Step Flow**:
  1. *Infiltrate Facility Entrance* (Cross landing zone perimeter)
  2. *Restore Auxiliary Power* (Locate & engage Relay A in Maintenance Tunnels)
  3. *Activate Power Relays* (Engage Relays B & C across Research and Server Wings)
  4. *Override Security Lockdown* (Access master security terminal in Control Room)
  5. *Recover Incident Logs* (Access classified Record 77-B in Server Archive)
  6. *Survive Facility Lockdown* ($45\text{ s}$ multi-wave survival arena against Drones, Phantoms, and Enforcers)
  7. *Investigate Central Systems Chamber* (Discover the Project Singularity containment reactor)
  8. *Evacuate Facility* ($03:00$ critical evacuation countdown to exterior LZ) $\to$ *Victory & Narrative Teaser*

#### Phase 21 — Atmosphere, Environmental FX & Narrative Integration
- **Status**: `COMPLETE`
- **Features**:
  - Procedural rain particle system over the exterior landing zone.
  - Interactive Incident Log Terminal modal (`#terminal-log-modal`) revealing classified Record 77-B.
  - Victory screen narrative integration presenting the *Project Singularity // Containment Status: Critical // TO BE CONTINUED* briefing card.

#### Phase 22 — Mission 02 Final QA & Campaign Regression
- **Status**: `COMPLETE`
- **Automated Validation Results**:
  - `tests/test_mission_02.js`: **100% Pass** (All 8 objectives, power grid transitions, flashlight mechanics, Viper SMG ballistics, Drone/Phantom AI combat, 45s arena, 3-minute evac, and victory card verified).
  - `tests/test_full_game.js`: **100% Pass** (Complete Mission 01 regression verified with 0 errors).
  - `tests/test_performance_audit.js`: **100% Pass** (60 FPS verified, draw calls optimized, weapon inventory slots 1–5 verified).

---

### Part IV: Current Narrative State

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           CANONICAL NARRATIVE PROGRESSION                         │
├───────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│   [ MISSION 01 — OPERATION: BLACKSITE ]                                           │
│   Operative deployed to Subterranean Complex Theta-9. Successfully breached      │
│   airlock, neutralized rogue defense androids, hacked the primary core terminal,   │
│   and extracted classified telemetry data.                                        │
│                                                                                   │
│                                       ▼                                           │
│                                                                                   │
│   [ MISSION 02 — BLACKOUT ]                                                       │
│   Operative deployed to Research Facility 07 following total communication loss   │
│   and power grid failure. Restored auxiliary power relays, neutralized airborne   │
│   security drones and stealth phantoms, and recovered Incident Log Record 77-B:   │
│                                                                                   │
│   ┌───────────────────────────────────────────────────────────────────────────┐   │
│   │ INCIDENT LOG // RECORD 77-B                                               │   │
│   │ CAUSE: MANUAL SYSTEM OVERRIDE // AUTHORIZATION: UNKNOWN                   │   │
│   │ PROJECT DESIGNATION: SINGULARITY                                          │   │
│   │ CONTAINMENT STATUS: CRITICAL FAILURE                                      │   │
│   │ DATA CLASSIFICATION: OMEGA                                                │   │
│   └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│   Operative breached Central Systems, confirmed catastrophic anomaly breach, and  │
│   evacuated before facility self-destruction countdown elapsed.                   │
│                                                                                   │
│                                       ▼                                           │
│                                                                                   │
│   [ TO BE CONTINUED... ]                                                          │
│   *Mission 03 has not yet been implemented.*                                      │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

---

### Part V: Future Campaign & Engine Roadmap (Phases 23–42)

The following phases represent the planned forward trajectory for NULL VECTOR. All items are strictly classified as `PLANNED`, `CONCEPT`, or `TBD`.

#### Phase 23 — Mission 03 (Working Concept: Project Singularity)
- **Status**: `PLANNED`
- **Concept**: Direct continuation of the Project Singularity narrative thread. Investigation of the primary anomaly epicenter.
- **Direction**: High-hazard containment architecture, dimensional distortion mechanics, zero-gravity or shifting spatial corridors. Specific gameplay mechanics and narrative milestones remain `TBD`.

#### Phase 24 — Mission 03 Environment
- **Status**: `PLANNED`
- **Concept**: Sub-surface Singularity Core facility, quantum containment laboratories, magnetic stabilization conduits, and dimensional rift zones (`TBD`).

#### Phase 25 — New Enemy Ecosystem
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - *Phase Stalker*: Anomalous entity capable of short-range spatial teleportation.
  - *Heavy Aegis Android*: Defense combatant utilizing frontal energy shielding requiring flanking tactics or armor-piercing ordinance.
  - *Autonomous Turret Arrays*: Ceiling-mounted kinetic/laser point defense turrets.

#### Phase 26 — Advanced Combat Systems
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Weapon Alternate Fire modes (e.g., Shotgun slug, Plasma charged shot, Viper EMP burst).
  - Tactical Equipment slot (EMP grenades, deployable holographic decoys).
  - Distinct structural weak points on heavy enemy chassis.

#### Phase 27 — Narrative & Cinematic Systems
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Audio radio transmissions from tactical command during gameplay.
  - In-world interactive holograms and data slates.
  - Scripted environmental sequence triggers (e.g., reactor ventings, bulkhead collapses).

#### Phase 28 — Campaign Persistence & Save System
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Campaign progress tracking across missions stored in `LocalStorage`.
  - Mission unlocking progression, operative service records, and permanent collectible lore archive.

#### Phase 29 — Tactical Difficulty System
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Difficulty Tiers**:
  - `RECRUIT`: Standard combat damage, generous pickup caches.
  - `OPERATIVE`: Default tactical combat balance (current standard).
  - `VETERAN`: High enemy aggression, reduced ammo drops, increased hostile damage.
  - `NIGHTMARE`: Permadeath operational modifier, zero health regeneration.

#### Phase 30 — Advanced Enemy Group AI
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Coordinated squad tactics (suppression fire paired with flanking maneuvers).
  - Dynamic squad commander units broadcasting behavioral buffs to nearby androids.

#### Phase 31 — Environmental Interactivity
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Destructible light fixtures impacting room illumination and AI stealth detection.
  - Explosive conduit pipes and environmental hazard vents triggering area-of-effect damage.

#### Phase 32 — Replayability & Operational Challenges
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Speedrun timer integration and mission par times.
  - Special operative operational commendations (No Damage, 100% Accuracy, Stealth Only).

#### Phase 33 — Advanced Statistics & Combat Analytics
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Comprehensive campaign analytics: favorite weapon usage, headshot precision ratios, total damage dealt/received, and lifetime neutralized threats.

#### Phase 34 — Dynamic Audio & Interactive Soundtrack
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Dynamic multi-track procedural synth soundtrack adapting intensity based on combat state (Exploration $\to$ Suspense $\to$ Combat $\to$ Evacuation Klaxon).

#### Phase 35 — Visual Enhancements & Post-Processing
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Selective bloom post-processing for energy weapons and containment cores.
  - Screen-space ambient occlusion (SSAO) and enhanced volumetric light scattering.

#### Phase 36 — Major Boss Encounters
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Concepts (Not Final)**:
  - Multi-phase boss encounter against a rogue facility AI core or heavy cybernetic prototype (`TBD`).

#### Phase 37 — Future Campaign Expansion (Missions 04+)
- **Status**: `PLANNED` / `TBD`
- **Scope**: Extended multi-mission arc resolving the Singularity crisis. Mission names and specifics are strictly `TBD`.

#### Phase 38 — User Experience & Accessibility Polish
- **Status**: `PLANNED` / `CONCEPT`
- **Potential Features**:
  - Full keyboard & mouse custom key rebinding.
  - Colorblind HUD palette modes and customizable reticle scaling.

#### Phase 39 — Advanced Performance Optimization
- **Status**: `PLANNED` / `CONCEPT`
- **Targets**: Web Workers for AI pathfinding computations, WebGL instanced mesh batching for complex environments.

#### Phase 40 — Cross-Browser Validation
- **Status**: `PLANNED`
- **Targets**: Comprehensive multi-browser validation matrix across Chrome, Microsoft Edge, Firefox, and WebKit/Brave.

#### Phase 41 — Full Campaign QA & Regression Suite
- **Status**: `PLANNED`
- **Targets**: Automated end-to-end multi-mission campaign test runner verifying uninterrupted continuity from Mission 01 to final deployment.

#### Phase 42 — Production Release Build
- **Status**: `PLANNED`
- **Targets**: Finalized, rock-solid browser build, comprehensive documentation, and production deployment package.

---

## SECTION 5 — MISSION ROADMAP TABLE

| Mission # | Operational Title | Location | Status | Key Gameplay Innovations | Narrative Milestone |
|:---|:---|:---|:---|:---|:---|
| **01** | **Operation: Blacksite** | Subterranean Complex Theta-9 | ✅ `COMPLETE` | Core FPS mechanics, Slots 1–4, Android Enforcers, Terminal Hack, 30s Lockdown | Initial infiltration & data core recovery |
| **02** | **Blackout** | Research Facility 07 | ✅ `COMPLETE` | Dynamic 6-state Power Grid, Flashlight `[F]`, Slot 5 Viper SMG, Drones, Phantoms, 45s Arena, 3m Evac | Discovery of Project Singularity breach |
| **03** | *Project Singularity (Working Concept)* | Anomaly Epicenter / Core | 🔵 `PLANNED` | *TBD* (Dimensional hazards, anomaly mechanics) | Direct confrontation with Singularity core |
| **04** | *TBD* | *TBD* | ⚪ `TBD` | *TBD* | *TBD* |
| **05** | *TBD* | *TBD* | ⚪ `TBD` | *TBD* | *TBD* |

---

## SECTION 6 — SYSTEM EVOLUTION MATRIX

| System Subsystem | Current Implementation State | Introduced In | Planned Future Expansion | Architecture Status |
|:---|:---|:---|:---|:---|
| **Player Controller** | Swept AABB, sprint, crouch, jump, head bob, landing dip | Phase 02 | Slide maneuver, mantle/climb mechanics | ✅ `COMPLETE` |
| **Weapons & Arsenal** | 5 Weapon slots (P19, Vector, SG-12, PR-9, Viper), ADS, recoil, reload | Phase 03/04/17 | Alternate fire modes, weapon attachments | ✅ `COMPLETE` |
| **Combat & Damage** | Hitscan, projectile bolts, headshot multipliers, decals, particles | Phase 03/07 | Armor penetration, elemental damage, weak points | ✅ `COMPLETE` |
| **Enemy AI & Archetypes** | FSM, $A^*$ pathfinding, Enforcer, Juggernaut, Spectre, Drone, Phantom | Phase 06/18/19 | Squad tactics, flanking, commander buffs, boss AI | ✅ `COMPLETE` |
| **Tactical Flashlight** | Dual spotlight + ambient fill on camera, `[F]` toggle, infinite battery | Phase 16 | Battery depletion modifier, UV detection mode | ✅ `COMPLETE` |
| **Dynamic Power Grid** | 6 States (`OFF`, `AUX`, `PARTIAL`, `FULL`, `LOCKDOWN`, `CRITICAL`) | Phase 15 | Subsystem hacking, overload traps, switchboards | ✅ `COMPLETE` |
| **Procedural Audio** | 100% synthesized Web Audio API (gunfire, reloads, drones, klaxons) | Phase 10/21 | Dynamic combat soundtrack, interactive synth stems | ✅ `COMPLETE` |
| **User Interface & HUD** | Dynamic crosshair spread, vitals, ammo, slot badges, menus, modals | Phase 09/13/21 | Key rebinding UI, colorblind accessibility options | ✅ `COMPLETE` |
| **Campaign Director** | `MissionManager` supporting independent selection, loading, resets | Phase 13 | Multi-mission save states, campaign progression | ✅ `COMPLETE` |
| **Automated QA Suite** | Headless CDP test suites for Mission 01, Mission 02, viewmodel, perf | Phase 12/22 | Full campaign end-to-end CI test pipeline | ✅ `COMPLETE` |
| **Campaign Persistence** | LocalStorage settings persistence | Phase 01 | Multi-mission save states, campaign unlocks | 🔵 `PLANNED` |
| **Difficulty Director** | Standard operative balance | Phase 01 | 4-tier difficulty selector (Recruit to Nightmare) | 🔵 `PLANNED` |

---

## SECTION 7 — TECHNICAL ARCHITECTURE ROADMAP

### Current Modular Codebase Structure

```
src/
├── campaign/       # Mission registry, configuration, and campaign lifecycle management
├── core/           # Engine director, state machine, input handling, audio synthesis, storage
├── entities/       # Player controller, weapon viewmodels, enemy archetypes, pickups, flashlight
├── level/          # Level environments, procedural geometry, texture generators, navigation graphs
├── systems/        # Shooting mechanics, dynamic power grid, particles, decals, objective managers
└── ui/             # Cyberpunk HUD renderer, dynamic crosshairs, menu overlays, terminal log modals
```

### Anticipated Architectural Evolution (Conceptual)

```
src/
├── campaign/       # MissionManager, CampaignState, MilestoneTracker
├── core/           # Game, InputManager, AudioManager, StorageManager, EventBus
├── entities/       # Player, WeaponManager, EnemyManager, Hostiles/, Pickups/, Equipment/
├── level/          # BaseLevel, Level01, Level02, Level03, NavGraph, ProceduralGeometry/
├── systems/        # ShootingSystem, PowerManager, ParticleSystem, DecalManager, NarrativeDirector/
├── ui/             # UIManager, HUDComponents/, MenuModals/, TerminalReader/
├── persistence/    # [FUTURE] SaveSystem, ProgressManager, StatisticsTracker
└── difficulty/     # [FUTURE] DifficultyModifier, CombatBalancing
```

*Note: Architectural expansion will occur organically alongside feature development without unnecessary premature refactoring.*

---

## SECTION 8 — QA VERIFICATION & DEFINITION OF DONE

### Definition of "COMPLETE"

In the NULL VECTOR development lifecycle, a feature or phase is **NEVER** marked as `COMPLETE` solely because source code has been authored. A phase is strictly defined as `COMPLETE` only when all of the following criteria are satisfied:

1. **Working Implementation**: Full source code is implemented with zero stub functions or fake placeholders.
2. **System Integration**: The subsystem is fully connected to the engine loop, physics, audio, and UI.
3. **Zero Critical Runtime Errors**: Clean browser console with zero uncaught exceptions, missing textures, or broken module imports.
4. **End-to-End Playability**: The complete gameplay loop functions seamlessly from briefing to objective completion and victory screen.
5. **Automated QA Validation**: Headless automated test suites execute and pass with $100\%$ success rate.
6. **Regression Verification**: All previously working missions and features remain fully operational.
7. **Performance Standard**: Stable $60\text{ FPS}$ performance, optimized draw calls, and zero memory leaks.

---

## SECTION 9 — STATUS LEGEND & CURRENT PROJECT STATE

### Status Legend

- ✅ **`COMPLETE`**: Fully implemented, integrated, verified in gameplay, and validated by automated QA test suites.
- 🟡 **`IN PROGRESS`**: Currently active development; code being authored or integrated.
- 🔵 **`PLANNED`**: Officially scheduled development phase with concrete architectural goals.
- 🔴 **`BLOCKED`**: Progress halted pending prerequisites or dependency resolution.
- 🔒 **`NOT STARTED`**: Scheduled for future development milestones.
- ⚪ **`TBD`**: Unassigned concept awaiting design and narrative finalization.

### Executive Project State Summary

- **Project Status**: `ACTIVE PRODUCTION // PHASE 22 COMPLETE`
- **Completed Missions**:
  - **Mission 01 — Operation: Blacksite** (`VERIFIED & REGRESSION TESTED`)
  - **Mission 02 — Blackout** (`VERIFIED & REGRESSION TESTED`)
- **Current Active Narrative Arc**: **Project Singularity (Containment Status: Critical)**
- **Immediate Next Milestone**: **Phase 23 — Mission 03 (Working Concept: Project Singularity)**
- **Long-Term Target**: Complete multi-mission standalone browser sci-fi campaign with full tactical combat systems, persistent progression, and polished atmospheric storytelling.

---
*END OF CANONICAL ROADMAP — NULL VECTOR PROJECT BIBLE*
