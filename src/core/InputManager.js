/**
 * InputManager.js
 * Handles keyboard, mouse look (via Pointer Lock API), and mouse button inputs.
 */

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    
    // Key states
    this.keys = {};
    this.keysJustPressed = {};
    
    // Mouse state
    this.mouseButtons = {};
    this.mouseButtonsJustPressed = {};
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.wheelDelta = 0;
    
    // Settings
    this.sensitivity = 1.5;
    this.invertY = false;
    
    // Pointer lock state
    this.isLocked = false;
    this.onLockChangeCallbacks = [];
    
    this._bindEvents();
  }

  _bindEvents() {
    // Keyboard events
    window.addEventListener('keydown', (e) => this._onKeyDown(e));
    window.addEventListener('keyup', (e) => this._onKeyUp(e));
    
    // Mouse events
    window.addEventListener('mousedown', (e) => this._onMouseDown(e));
    window.addEventListener('mouseup', (e) => this._onMouseUp(e));
    window.addEventListener('mousemove', (e) => this._onMouseMove(e));
    window.addEventListener('wheel', (e) => {
      if (this.isLocked) {
        this.wheelDelta += Math.sign(e.deltaY);
      }
    }, { passive: true });
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Pointer lock change
    document.addEventListener('pointerlockchange', () => this._onPointerLockChange());
    document.addEventListener('mozpointerlockchange', () => this._onPointerLockChange());
    document.addEventListener('webkitpointerlockchange', () => this._onPointerLockChange());
    
    // Blur / Window focus loss
    window.addEventListener('blur', () => this.reset());
  }

  requestPointerLock() {
    if (this.canvas && !this.isLocked) {
      try {
        const promise = this.canvas.requestPointerLock();
        if (promise && promise.catch) {
          promise.catch(err => {
            console.warn('Pointer lock request error:', err);
          });
        }
      } catch (e) {
        console.warn('Pointer lock error:', e);
      }
    }
  }

  exitPointerLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  onLockChange(callback) {
    this.onLockChangeCallbacks.push(callback);
  }

  _onPointerLockChange() {
    this.isLocked = (document.pointerLockElement === this.canvas ||
                     document.mozPointerLockElement === this.canvas ||
                     document.webkitPointerLockElement === this.canvas);
    
    this.onLockChangeCallbacks.forEach(cb => cb(this.isLocked));
  }

  _onKeyDown(e) {
    const code = e.code;
    if (!this.keys[code]) {
      this.keysJustPressed[code] = true;
    }
    this.keys[code] = true;
  }

  _onKeyUp(e) {
    this.keys[e.code] = false;
  }

  _onMouseDown(e) {
    const btn = e.button; // 0: Left, 1: Middle, 2: Right
    if (!this.mouseButtons[btn]) {
      this.mouseButtonsJustPressed[btn] = true;
    }
    this.mouseButtons[btn] = true;
  }

  _onMouseUp(e) {
    this.mouseButtons[e.button] = false;
  }

  _onMouseMove(e) {
    if (!this.isLocked) return;
    
    const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
    const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;
    
    this.mouseDeltaX += movementX;
    this.mouseDeltaY += movementY;
  }

  isKeyDown(code) {
    return !!this.keys[code];
  }

  wasKeyJustPressed(code) {
    return !!this.keysJustPressed[code];
  }

  isMouseDown(button) {
    return !!this.mouseButtons[button];
  }

  wasMouseClicked(button) {
    return !!this.mouseButtonsJustPressed[button];
  }

  consumeMouseDelta() {
    const delta = {
      x: this.mouseDeltaX * this.sensitivity * 0.002,
      y: (this.invertY ? -this.mouseDeltaY : this.mouseDeltaY) * this.sensitivity * 0.002
    };
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    return delta;
  }

  consumeWheelDelta() {
    const d = this.wheelDelta;
    this.wheelDelta = 0;
    return d;
  }

  update() {
    // Clear "just pressed" single-frame flags
    this.keysJustPressed = {};
    this.mouseButtonsJustPressed = {};
    this.wheelDelta = 0;
  }

  reset() {
    this.keys = {};
    this.keysJustPressed = {};
    this.mouseButtons = {};
    this.mouseButtonsJustPressed = {};
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
    this.wheelDelta = 0;
  }
}
