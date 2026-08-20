/**
 * TextureGenerator.js
 * Generates procedural canvas textures for sci-fi floors, walls, panels, terminals, and hazards.
 */

import * as THREE from 'three';

export class TextureGenerator {
  static createFloorTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base dark metal
    ctx.fillStyle = '#141a24';
    ctx.fillRect(0, 0, size, size);

    // Grid panels
    ctx.strokeStyle = '#0a0e14';
    ctx.lineWidth = 6;
    const numTiles = 4;
    const tileSize = size / numTiles;

    for (let x = 0; x < numTiles; x++) {
      for (let y = 0; y < numTiles; y++) {
        ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);

        // Subtle tile highlight
        ctx.fillStyle = '#18202c';
        ctx.fillRect(x * tileSize + 4, y * tileSize + 4, tileSize - 8, tileSize - 8);

        // Corner rivets
        ctx.fillStyle = '#283444';
        const rSize = 4;
        ctx.fillRect(x * tileSize + 8, y * tileSize + 8, rSize, rSize);
        ctx.fillRect((x + 1) * tileSize - 12, y * tileSize + 8, rSize, rSize);
        ctx.fillRect(x * tileSize + 8, (y + 1) * tileSize - 12, rSize, rSize);
        ctx.fillRect((x + 1) * tileSize - 12, (y + 1) * tileSize - 12, rSize, rSize);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createWallTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base industrial wall
    ctx.fillStyle = '#1b222d';
    ctx.fillRect(0, 0, size, size);

    // Beveled panels
    ctx.fillStyle = '#242c3b';
    ctx.fillRect(16, 16, size - 32, size - 32);

    ctx.fillStyle = '#161c26';
    ctx.fillRect(32, 32, size - 64, size - 64);

    // Cyan accent circuit line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(32, 120);
    ctx.lineTo(160, 120);
    ctx.lineTo(200, 160);
    ctx.lineTo(size - 32, 160);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Warning text
    ctx.fillStyle = '#6b859e';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('SECTOR-07 // NULL VECTOR', 48, 80);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createHazardTexture() {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = '#11151c';
    const stripeWidth = 32;
    ctx.beginPath();
    for (let i = -size; i < size * 2; i += stripeWidth * 2) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + stripeWidth, 0);
      ctx.lineTo(i + stripeWidth + size, size);
      ctx.lineTo(i + size, size);
      ctx.closePath();
    }
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createServerTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, size, size);

    const rackCount = 8;
    const rackHeight = size / rackCount;

    for (let i = 0; i < rackCount; i++) {
      const y = i * rackHeight;
      ctx.fillStyle = '#161c26';
      ctx.fillRect(8, y + 4, size - 16, rackHeight - 8);

      // Status LED dots (cyan, green, red)
      for (let j = 0; j < 12; j++) {
        const x = 32 + j * 36;
        const color = Math.random() > 0.15 ? '#00f0ff' : (Math.random() > 0.5 ? '#00ff88' : '#ff2a4b');
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y + rackHeight / 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  static createTerminalScreenTexture(status = 'ONLINE') {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#050a12';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, size - 20, size - 20);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('SECURITY CORE TERMINAL', 40, 70);

    ctx.font = '24px monospace';
    ctx.fillStyle = '#6b859e';
    ctx.fillText('STATUS: ' + status, 40, 130);
    ctx.fillText('ACCESS LEVEL: 5 (ADMIN)', 40, 170);
    ctx.fillText('FACILITY LOCKDOWN: ACTIVE', 40, 210);

    // Progress bar box
    ctx.strokeStyle = '#00f0ff';
    ctx.strokeRect(40, 260, size - 80, 50);

    ctx.fillStyle = '#00ff88';
    ctx.fillRect(44, 264, (size - 88) * 0.75, 42);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('DATA EXTRACTION READY', 40, 370);
    ctx.fillText('[PRESS E TO OVERRIDE]', 40, 420);

    return new THREE.CanvasTexture(canvas);
  }

  static createExtractionPadTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#141822';
    ctx.fillRect(0, 0, size, size);

    // Glowing cyan circle
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 12;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 30, 0, Math.PI * 2);
    ctx.stroke();

    // Inner landing cross / H
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 120px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EVAC', size / 2, size / 2);

    ctx.font = 'bold 24px monospace';
    ctx.fillText('EXTRACTION ZONE // LZ-09', size / 2, size / 2 + 100);

    return new THREE.CanvasTexture(canvas);
  }
}
