/**
 * Input & Gamepad Controller with F3 Diagnostics Overlay
 * Guizang Game Pro - Ultra-responsive input layer
 */
export class InputManager {
  constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, isDown: false, rightDown: false };
    this.gamepadIndex = null;
    this.virtualJoystick = { active: false, startX: 0, startY: 0, currentX: 0, currentY: 0 };
    
    this._bindEvents();
    this._setupF3Overlay();
  }

  _bindEvents() {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    
    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouse.isDown = true;
      if (e.button === 2) this.mouse.rightDown = true;
    });
    
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouse.isDown = false;
      if (e.button === 2) this.mouse.rightDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      console.log('🎮 Gamepad connected:', e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepadIndex = null;
    });
  }

  getMovementVector() {
    let x = 0;
    let z = 0;

    // Keyboard (WASD / Arrows)
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

    // Gamepad override
    if (this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp) {
        const stickX = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0;
        const stickY = Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0;
        if (stickX !== 0 || stickY !== 0) {
          x = stickX;
          z = stickY;
        }
      }
    }

    // Normalize
    const len = Math.hypot(x, z);
    if (len > 1) {
      x /= len;
      z /= len;
    }

    return { x, z };
  }

  isAttackPressed() {
    if (this.keys.has('KeyJ') || this.mouse.isDown) return true;
    if (this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp && gp.buttons[0]?.pressed) return true;
    }
    return false;
  }

  isDodgePressed() {
    if (this.keys.has('Space') || this.keys.has('KeyK')) return true;
    if (this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp && gp.buttons[1]?.pressed) return true;
    }
    return false;
  }

  isBlockPressed() {
    if (this.keys.has('KeyL') || this.mouse.rightDown) return true;
    if (this.gamepadIndex !== null) {
      const gp = navigator.getGamepads()[this.gamepadIndex];
      if (gp && (gp.buttons[4]?.pressed || gp.buttons[6]?.pressed)) return true;
    }
    return false;
  }

  _setupF3Overlay() {
    const overlay = document.createElement('div');
    overlay.id = 'f3-debug-overlay';
    overlay.style.cssText = 'position:fixed;top:10px;left:10px;background:rgba(0,0,0,0.75);color:#00ffcc;font-family:monospace;padding:8px 12px;border-radius:6px;font-size:12px;z-index:99999;display:none;pointer-events:none;';
    document.body.appendChild(overlay);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
      }
    });

    this.debugOverlay = overlay;
  }

  updateDebug(stats) {
    if (this.debugOverlay && this.debugOverlay.style.display !== 'none') {
      this.debugOverlay.innerHTML = Object.entries(stats)
        .map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`)
        .join('');
    }
  }
}
