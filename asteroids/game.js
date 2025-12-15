(() => {
  'use strict';

  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const livesEl = document.getElementById('lives');

  const W = canvas.width;
  const H = canvas.height;

  const TAU = Math.PI * 2;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const wrap = (p, max) => (p < 0 ? p + max : (p >= max ? p - max : p));

  const keys = new Map();
  const keyDown = (code) => keys.get(code) === true;

  let paused = false;

  window.addEventListener('keydown', (e) => {
    // Prevent page scroll
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code)) e.preventDefault();

    if (e.code === 'KeyP' && !e.repeat) {
      paused = !paused;
      return;
    }

    keys.set(e.code, true);
  }, { passive: false });

  window.addEventListener('keyup', (e) => {
    keys.set(e.code, false);
  });

  function vecLen(x, y) {
    return Math.sqrt(x * x + y * y);
  }

  function dist2(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }

  function angleToVec(a) {
    return { x: Math.cos(a), y: Math.sin(a) };
  }

  function shipForwardVec(rot) {
    // Ship nose is SHIP_SHAPE[0] = {x:0,y:-12} in local space.
    // Rotating (0,-1) by rot yields (sin(rot), -cos(rot)).
    return { x: Math.sin(rot), y: -Math.cos(rot) };
  }

  function drawText(text, x, y, size = 22, align = 'center') {
    ctx.save();
    ctx.fillStyle = '#eafff8';
    ctx.font = `600 ${size}px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function strokePolygon(points, x, y, rot, scale, color = '#3cd2a5', lineWidth = 2) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth / scale;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function makeAsteroidShape(seedPoints = 10) {
    const pts = [];
    for (let i = 0; i < seedPoints; i++) {
      const a = (i / seedPoints) * TAU;
      const r = rand(0.75, 1.25);
      pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
    }
    return pts;
  }

  const SHIP_SHAPE = [
    { x: 0, y: -12 },
    { x: 9, y: 10 },
    { x: 0, y: 6 },
    { x: -9, y: 10 },
  ];

  class Bullet {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.life = 0;
      this.maxLife = 1.1;
      this.r = 2;
      this.dead = false;
    }

    update(dt) {
      this.life += dt;
      if (this.life >= this.maxLife) {
        this.dead = true;
        return;
      }
      this.x = wrap(this.x + this.vx * dt, W);
      this.y = wrap(this.y + this.vy * dt, H);
    }

    draw() {
      ctx.save();
      ctx.strokeStyle = '#eafff8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - 2, this.y - 2);
      ctx.lineTo(this.x + 2, this.y + 2);
      ctx.moveTo(this.x + 2, this.y - 2);
      ctx.lineTo(this.x - 2, this.y + 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  class Asteroid {
    constructor(x, y, size, vx, vy, rot, rotSpd) {
      this.x = x;
      this.y = y;
      this.size = size; // 3,2,1
      this.vx = vx;
      this.vy = vy;
      this.rot = rot;
      this.rotSpd = rotSpd;
      this.shape = makeAsteroidShape(10);
      this.dead = false;

      // Radius scaled per size
      this.r = (size === 3 ? 42 : size === 2 ? 26 : 16);
    }

    update(dt) {
      this.x = wrap(this.x + this.vx * dt, W);
      this.y = wrap(this.y + this.vy * dt, H);
      this.rot += this.rotSpd * dt;
    }

    draw() {
      strokePolygon(this.shape, this.x, this.y, this.rot, this.r, '#3cd2a5', 2);
    }
  }

  class Ship {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = W / 2;
      this.y = H / 2;
      this.vx = 0;
      this.vy = 0;
      this.rot = -Math.PI / 2;
      this.r = 10;
      this.invuln = 0;
      this.cooldown = 0;
      this.alive = true;
    }

    update(dt) {
      if (!this.alive) return;

      const rotSpeed = 4.2;
      const thrust = 240;
      const drag = 0.985;
      const maxSpeed = 420;

      if (keyDown('ArrowLeft')) this.rot -= rotSpeed * dt;
      if (keyDown('ArrowRight')) this.rot += rotSpeed * dt;

      if (keyDown('ArrowUp')) {
        const v = shipForwardVec(this.rot);
        this.vx += v.x * thrust * dt;
        this.vy += v.y * thrust * dt;
      }

      const spd = vecLen(this.vx, this.vy);
      if (spd > maxSpeed) {
        const k = maxSpeed / spd;
        this.vx *= k;
        this.vy *= k;
      }

      this.vx *= Math.pow(drag, dt * 60);
      this.vy *= Math.pow(drag, dt * 60);

      this.x = wrap(this.x + this.vx * dt, W);
      this.y = wrap(this.y + this.vy * dt, H);

      if (this.invuln > 0) this.invuln -= dt;
      if (this.cooldown > 0) this.cooldown -= dt;
    }

    canShoot() {
      return this.alive && this.cooldown <= 0;
    }

    shoot() {
      this.cooldown = 0.18;
      const v = shipForwardVec(this.rot);
      const tip = SHIP_SHAPE[0];
      const cos = Math.cos(this.rot);
      const sin = Math.sin(this.rot);
      const muzzleX = this.x + (tip.x * cos - tip.y * sin);
      const muzzleY = this.y + (tip.x * sin + tip.y * cos);
      const bulletSpeed = 560;
      return new Bullet(
        muzzleX,
        muzzleY,
        this.vx + v.x * bulletSpeed,
        this.vy + v.y * bulletSpeed
      );
    }

    draw() {
      if (!this.alive) return;
      const blink = this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0;
      if (blink) return;

      strokePolygon(SHIP_SHAPE, this.x, this.y, this.rot, 1, '#eafff8', 2);

      if (keyDown('ArrowUp')) {
        const fwd = shipForwardVec(this.rot);
        const backX = this.x - fwd.x * 10;
        const backY = this.y - fwd.y * 10;
        const px = -fwd.y;
        const py = fwd.x;
        const flameTipX = backX - fwd.x * (12 + rand(0, 6));
        const flameTipY = backY - fwd.y * (12 + rand(0, 6));

        ctx.save();
        ctx.strokeStyle = '#3cd2a5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(backX + px * 6, backY + py * 6);
        ctx.lineTo(flameTipX, flameTipY);
        ctx.lineTo(backX - px * 6, backY - py * 6);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  const state = {
    running: false,
    gameOver: false,
    score: 0,
    lives: 3,
    level: 1,
    ship: new Ship(),
    bullets: [],
    asteroids: [],
    lastShotPressed: false,
  };

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = String(state.score);
    if (livesEl) livesEl.textContent = String(state.lives);
  }

  function submitScore() {
    try {
      if (typeof window.helixAuth !== 'undefined' && window.helixAuth.isLoggedIn()) {
        window.helixAuth.submitScore('asteroids', state.score);
      }
    } catch {
      // ignore
    }
  }

  function spawnAsteroids(count) {
    for (let i = 0; i < count; i++) {
      // Spawn away from center a bit
      let x = rand(0, W);
      let y = rand(0, H);
      const safeR2 = 140 * 140;
      for (let tries = 0; tries < 50 && dist2(x, y, W / 2, H / 2) < safeR2; tries++) {
        x = rand(0, W);
        y = rand(0, H);
      }

      const speed = rand(40, 110) + state.level * 6;
      const a = rand(0, TAU);
      const vx = Math.cos(a) * speed;
      const vy = Math.sin(a) * speed;
      state.asteroids.push(
        new Asteroid(x, y, 3, vx, vy, rand(0, TAU), rand(-1.4, 1.4))
      );
    }
  }

  function startGame() {
    state.running = true;
    state.gameOver = false;
    state.score = 0;
    state.lives = 3;
    state.level = 1;
    state.ship.reset();
    state.ship.invuln = 2.0;
    state.bullets = [];
    state.asteroids = [];
    spawnAsteroids(4);
    updateHUD();
  }

  function nextLevel() {
    state.level++;
    spawnAsteroids(clamp(3 + state.level, 4, 12));
    state.ship.invuln = 2.0;
  }

  function killShip() {
    if (state.ship.invuln > 0) return;

    state.lives--;
    updateHUD();

    if (state.lives < 0) {
      state.gameOver = true;
      state.running = false;
      submitScore();
      return;
    }

    state.ship.reset();
    state.ship.invuln = 2.0;
  }

  function splitAsteroid(a) {
    a.dead = true;

    state.score += (a.size === 3 ? 20 : a.size === 2 ? 50 : 100);
    updateHUD();

    if (a.size <= 1) return;

    const newSize = a.size - 1;
    for (let i = 0; i < 2; i++) {
      const speed = rand(80, 160) + state.level * 6;
      const ang = rand(0, TAU);
      state.asteroids.push(
        new Asteroid(
          a.x,
          a.y,
          newSize,
          Math.cos(ang) * speed,
          Math.sin(ang) * speed,
          rand(0, TAU),
          rand(-2.0, 2.0)
        )
      );
    }
  }

  function handleShooting(dt) {
    const shotPressed = keyDown('Space');
    const justPressed = shotPressed && !state.lastShotPressed;
    state.lastShotPressed = shotPressed;

    if (!state.running) return;
    if (paused) return;

    if (justPressed && state.ship.canShoot()) {
      state.bullets.push(state.ship.shoot());
    }
  }

  function update(dt) {
    if (!state.running) return;

    state.ship.update(dt);

    for (const b of state.bullets) b.update(dt);
    for (const a of state.asteroids) a.update(dt);

    // Bullet vs asteroid
    for (const b of state.bullets) {
      if (b.dead) continue;
      for (const a of state.asteroids) {
        if (a.dead) continue;
        const rr = (a.r + b.r);
        if (dist2(b.x, b.y, a.x, a.y) <= rr * rr) {
          b.dead = true;
          splitAsteroid(a);
          break;
        }
      }
    }

    // Ship vs asteroid
    if (state.ship.alive) {
      for (const a of state.asteroids) {
        if (a.dead) continue;
        const rr = (a.r + state.ship.r);
        if (dist2(state.ship.x, state.ship.y, a.x, a.y) <= rr * rr) {
          killShip();
          break;
        }
      }
    }

    // Cleanup
    state.bullets = state.bullets.filter((b) => !b.dead);
    state.asteroids = state.asteroids.filter((a) => !a.dead);

    if (state.asteroids.length === 0) nextLevel();
  }

  function drawBackground() {
    ctx.fillStyle = '#07120f';
    ctx.fillRect(0, 0, W, H);

    // subtle stars
    ctx.save();
    ctx.fillStyle = 'rgba(234, 255, 248, 0.14)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 173) % W;
      const y = (i * 97) % H;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }

  function draw() {
    drawBackground();

    for (const a of state.asteroids) a.draw();
    for (const b of state.bullets) b.draw();
    state.ship.draw();

    if (!state.running && !state.gameOver) {
      drawText('Press SPACE to start', W / 2, H / 2 - 10, 26);
      drawText('Arrow keys to move, P to pause', W / 2, H / 2 + 24, 16);
    }

    if (paused && state.running) {
      drawText('PAUSED', W / 2, 90, 44);
    }

    if (state.gameOver) {
      drawText('GAME OVER', W / 2, H / 2 - 20, 52);
      drawText('Press SPACE to play again', W / 2, H / 2 + 26, 18);
    }
  }

  let lastTs = performance.now();
  function loop(ts) {
    const dt = clamp((ts - lastTs) / 1000, 0, 0.05);
    lastTs = ts;

    // Start / restart
    const spacePressed = keyDown('Space');
    if (spacePressed && !state.lastShotPressed) {
      if (!state.running && !state.gameOver) {
        startGame();
      } else if (state.gameOver) {
        state.gameOver = false;
        startGame();
      }
    }

    handleShooting(dt);

    if (!paused) update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  updateHUD();
  requestAnimationFrame(loop);
})();
