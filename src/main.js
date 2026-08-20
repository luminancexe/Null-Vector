import * as THREE from 'three';
import { Game, GameState } from './core/Game.js';
import { StorageManager } from './core/StorageManager.js';

window.THREE = THREE;

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element #game-canvas not found!');
    return;
  }

  const game = new Game(canvas);
  window.nullVectorGame = game; // Expose for runtime inspection & tests

  // Menu Elements
  const loadingScreen = document.getElementById('loading-screen');
  const mainMenu = document.getElementById('main-menu');
  const pauseMenu = document.getElementById('pause-menu');
  const settingsMenu = document.getElementById('settings-menu');
  const controlsMenu = document.getElementById('controls-menu');
  const creditsMenu = document.getElementById('credits-menu');
  const deathMenu = document.getElementById('death-menu');
  const victoryMenu = document.getElementById('victory-menu');
  const hud = document.getElementById('hud');

  // Buttons
  const btnLoadingStart = document.getElementById('btn-loading-start');
  const btnPlay = document.getElementById('btn-play');
  const btnResume = document.getElementById('btn-resume');
  const btnSettings = document.getElementById('btn-settings');
  const btnPauseSettings = document.getElementById('btn-pause-settings');
  const btnControls = document.getElementById('btn-controls');
  const btnCredits = document.getElementById('btn-credits');
  const btnSettingsBack = document.getElementById('btn-settings-back');
  const btnControlsBack = document.getElementById('btn-controls-back');
  const btnCreditsBack = document.getElementById('btn-credits-back');
  const btnRestart = document.getElementById('btn-restart');
  const btnMainMenu = document.getElementById('btn-main-menu');
  const btnDeathRestart = document.getElementById('btn-death-restart');
  const btnDeathMenu = document.getElementById('btn-death-menu');
  const btnVicRestart = document.getElementById('btn-vic-restart');
  const btnVicMenu = document.getElementById('btn-vic-menu');

  // Settings inputs
  const inputSens = document.getElementById('setting-sens');
  const inputSensVal = document.getElementById('setting-sens-val');
  const inputInvertY = document.getElementById('setting-invert-y');
  const inputVolMaster = document.getElementById('setting-vol-master');
  const inputVolMasterVal = document.getElementById('setting-vol-master-val');
  const inputVolSfx = document.getElementById('setting-vol-sfx');
  const inputVolSfxVal = document.getElementById('setting-vol-sfx-val');
  const inputVolMusic = document.getElementById('setting-vol-music');
  const inputVolMusicVal = document.getElementById('setting-vol-music-val');
  const inputFov = document.getElementById('setting-fov');
  const inputFovVal = document.getElementById('setting-fov-val');

  // Populate settings form from stored settings
  const s = game.settings;
  if (inputSens) { inputSens.value = s.sensitivity; inputSensVal.textContent = s.sensitivity; }
  if (inputInvertY) { inputInvertY.checked = s.invertY; }
  if (inputVolMaster) { inputVolMaster.value = s.masterVolume; inputVolMasterVal.textContent = `${s.masterVolume}%`; }
  if (inputVolSfx) { inputVolSfx.value = s.sfxVolume; inputVolSfxVal.textContent = `${s.sfxVolume}%`; }
  if (inputVolMusic) { inputVolMusic.value = s.musicVolume; inputVolMusicVal.textContent = `${s.musicVolume}%`; }
  if (inputFov) { inputFov.value = s.fov; inputFovVal.textContent = s.fov; }

  // Settings change listeners
  inputSens?.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    inputSensVal.textContent = val.toFixed(1);
    game.settings.sensitivity = val;
    game.input.sensitivity = val;
    StorageManager.saveSettings(game.settings);
  });

  inputInvertY?.addEventListener('change', (e) => {
    const val = !!e.target.checked;
    game.settings.invertY = val;
    game.input.invertY = val;
    StorageManager.saveSettings(game.settings);
  });

  inputVolMaster?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    inputVolMasterVal.textContent = `${val}%`;
    game.settings.masterVolume = val;
    game.audioManager.setVolumes(val, game.settings.sfxVolume, game.settings.musicVolume);
    StorageManager.saveSettings(game.settings);
  });

  inputVolSfx?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    inputVolSfxVal.textContent = `${val}%`;
    game.settings.sfxVolume = val;
    game.audioManager.setVolumes(game.settings.masterVolume, val, game.settings.musicVolume);
    StorageManager.saveSettings(game.settings);
  });

  inputVolMusic?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    inputVolMusicVal.textContent = `${val}%`;
    game.settings.musicVolume = val;
    game.audioManager.setVolumes(game.settings.masterVolume, game.settings.sfxVolume, val);
    StorageManager.saveSettings(game.settings);
  });

  inputFov?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    inputFovVal.textContent = val;
    game.settings.fov = val;
    if (game.player) game.player.baseFov = val;
    if (game.camera) {
      game.camera.fov = val;
      game.camera.updateProjectionMatrix();
    }
    StorageManager.saveSettings(game.settings);
  });

  // Simulated Loading Terminal Sequence
  const terminal = document.getElementById('loading-terminal');
  const progressBar = document.getElementById('loading-progress-bar');
  const logSteps = [
    '> INITIALIZING SYSTEM CORE (Three.js WebGL2)...',
    '> ALLOCATING SPATIAL GEOMETRY & COLLIDERS...',
    '> COMPILING PROCEDURAL TEXTURES & SHADERS...',
    '> SYNTHESIZING PROCEDURAL AUDIO ENGINE...',
    '> SPAWNING TACTICAL ASSETS & WEAPON ARSENAL...',
    '> INITIALIZING HOSTILE AI STATE MACHINES...',
    '> SECTOR-07 ONLINE. OPERATIVE READY.'
  ];

  let currentStep = 0;
  const loadInterval = setInterval(() => {
    currentStep++;
    if (currentStep < logSteps.length) {
      const line = document.createElement('div');
      line.className = 'terminal-line';
      line.textContent = logSteps[currentStep];
      terminal?.appendChild(line);
      if (progressBar) progressBar.style.width = `${(currentStep / (logSteps.length - 1)) * 100}%`;
    } else {
      clearInterval(loadInterval);
      if (btnLoadingStart) btnLoadingStart.style.display = 'block';
    }
  }, 200);

  // User interactions & transitions
  const initAudio = () => {
    game.audioManager.init();
    game.audioManager.resume();
  };

  btnLoadingStart?.addEventListener('click', () => {
    initAudio();
    loadingScreen?.classList.remove('active');
    mainMenu?.classList.add('active');
    game.setState(GameState.MENU);
  });

  btnPlay?.addEventListener('click', () => {
    initAudio();
    mainMenu?.classList.remove('active');
    game.restartMission();
  });

  btnResume?.addEventListener('click', () => {
    pauseMenu?.classList.remove('active');
    game.setState(GameState.PLAYING);
  });

  btnRestart?.addEventListener('click', () => {
    pauseMenu?.classList.remove('active');
    game.restartMission();
  });

  btnDeathRestart?.addEventListener('click', () => {
    deathMenu?.classList.remove('active');
    game.restartMission();
  });

  btnVicRestart?.addEventListener('click', () => {
    victoryMenu?.classList.remove('active');
    game.restartMission();
  });

  btnMainMenu?.addEventListener('click', () => {
    pauseMenu?.classList.remove('active');
    mainMenu?.classList.add('active');
    game.setState(GameState.MENU);
  });

  btnDeathMenu?.addEventListener('click', () => {
    deathMenu?.classList.remove('active');
    mainMenu?.classList.add('active');
    game.setState(GameState.MENU);
  });

  btnVicMenu?.addEventListener('click', () => {
    victoryMenu?.classList.remove('active');
    mainMenu?.classList.add('active');
    game.setState(GameState.MENU);
  });

  btnSettings?.addEventListener('click', () => {
    mainMenu?.classList.remove('active');
    settingsMenu?.classList.add('active');
  });

  btnPauseSettings?.addEventListener('click', () => {
    pauseMenu?.classList.remove('active');
    settingsMenu?.classList.add('active');
  });

  btnSettingsBack?.addEventListener('click', () => {
    settingsMenu?.classList.remove('active');
    if (game.state === GameState.PAUSED) {
      pauseMenu?.classList.add('active');
    } else {
      mainMenu?.classList.add('active');
    }
  });

  btnControls?.addEventListener('click', () => {
    mainMenu?.classList.remove('active');
    controlsMenu?.classList.add('active');
  });

  btnControlsBack?.addEventListener('click', () => {
    controlsMenu?.classList.remove('active');
    mainMenu?.classList.add('active');
  });

  btnCredits?.addEventListener('click', () => {
    mainMenu?.classList.remove('active');
    creditsMenu?.classList.add('active');
  });

  btnCreditsBack?.addEventListener('click', () => {
    creditsMenu?.classList.remove('active');
    mainMenu?.classList.add('active');
  });

  // ESC key for pause
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Escape') {
      if (game.state === GameState.PLAYING) {
        pauseMenu?.classList.add('active');
        game.setState(GameState.PAUSED);
      } else if (game.state === GameState.PAUSED) {
        pauseMenu?.classList.remove('active');
        game.setState(GameState.PLAYING);
      }
    }
  });

  game.start();
  console.log('[Null Vector] Application running.');
});
