# NULL VECTOR — Browser-Based Sci-Fi First-Person Shooter

**Null Vector** is a complete, polished, browser-based first-person shooter (FPS) developed using HTML5, CSS3, JavaScript (ES6 modules), Three.js (WebGL), Pointer Lock API, and procedural Web Audio API.

**Current Mission: Operation: Blacksite**

The game is 100% self-contained with no external server or backend dependencies, using procedurally synthesized audio and procedural high-definition textures.

---

## 🎮 How to Play

### Running Locally
You can run the game with any local static server:

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
| **Right Mouse Button (RMB)** | Aim Down Sights (ADS / Zoom) |
| **Shift** | Tactical Sprint |
| **Space** | Jump |
| **Ctrl / C** | Crouch |
| **R** | Reload Weapon |
| **1 - 4** | Select Weapon (Pistol, AR, Shotgun, Plasma Rifle) |
| **E** | Interact (Hack Security Terminal) |
| **ESC** | Pause Menu / Resume |

---

## 🔫 Weapon Arsenal

1. **P19 Tactical Pistol** (Slot 1)
   - Semi-automatic sidearm with high precision, fast reload, and crisp sound profile.
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

---

## 🤖 Enemy Types & AI

- **Android Enforcer**: Standard assault combatant with burst rifle fire and cover maneuvers.
- **Heavy Juggernaut**: High armor defense unit with twin heavy plasma cannons and steady advance.
- **Cyber Spectre**: Agile melee rusher that sprints and lunges with high-speed evasive pathfinding.

Enemies utilize a finite state machine:
`PATROL` ➔ `DETECT` ➔ `CHASE` ➔ `ATTACK` ➔ `SEARCH` ➔ `DEAD`

---

## 🎯 Mission: Operation: Blacksite

1. **Breach Facility Airlock**: Breach the surface airlock and secure the checkpoint.
2. **Clear Cargo Bay Patrols**: Eliminate patrol units guarding the main warehouse.
3. **Locate & Hack Security Core Terminal**: Locate the server hub console and press **[E]** to override security.
4. **Survive Facility Lockdown**: Defend against alarm-triggered reinforcements for 30 seconds.
5. **Reach Extraction Landing Zone**: Advance through the reactor chamber to the evacuation landing pad.
6. **Mission Complete**: View detailed performance stats (Accuracy, Headshots, Score, and Rank).

---

## 🛠️ Architecture & Technologies

- **Graphics**: Three.js WebGL2 renderer with soft shadows, ACES filmic tone mapping, distance fog, and procedural lighting.
- **Physics & Collision**: First-person kinematic character controller with swept AABB obstacle collision, variable height crouching, inertia, air control, and landing dips.
- **Audio Engine**: 100% procedural real-time Web Audio API synthesizer (gunfire, reloads, impacts, footsteps, klaxons, and ambience).
- **Navigation**: Multi-room waypoint graph with A* pathfinding and line-of-sight raycasting.
- **Storage**: `localStorage` persistence for user preferences (FOV, sensitivity, volumes) and high scores.
