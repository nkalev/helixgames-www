(() => {
  'use strict';

  const canvas = document.getElementById('game');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');

  const W = canvas.width;
  const H = canvas.height;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  const keys = {};
  let paused = false;

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
      keys[e.code] = true;
    }
    if (e.code === 'KeyP' && !e.repeat) {
      paused = !paused;
    }
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  // Colors matching helix theme
  const COLORS = {
    bg: '#07120f',
    ship: '#3cd2a5',
    shipAccent: '#eafff8',
    bullet: '#eafff8',
    enemy1: '#ff6b6b',
    enemy2: '#ffd93d',
    enemy3: '#6bcb77',
    enemy4: '#4d96ff',
    enemyBullet: '#ff6b6b',
    explosion: '#ffd93d',
    text: '#eafff8',
    star: 'rgba(234, 255, 248, 0.3)'
  };

  // Stars for background
  const stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: rand(30, 100),
      size: rand(1, 2)
    });
  }

  function updateStars(dt) {
    for (const s of stars) {
      s.y += s.speed * dt;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    }
  }

  function drawStars() {
    ctx.fillStyle = COLORS.star;
    for (const s of stars) {
      ctx.fillRect(s.x, s.y, s.size, s.size);
    }
  }

  function drawText(text, x, y, size = 24, align = 'center') {
    ctx.save();
    ctx.fillStyle = COLORS.text;
    ctx.font = `600 ${size}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // Player ship
  class Player {
    constructor() {
      this.w = 40;
      this.h = 30;
      this.x = W / 2 - this.w / 2;
      this.y = H - 60;
      this.speed = 280;
      this.cooldown = 0;
      this.cooldownTime = 0.2;
      this.alive = true;
      this.lives = 3;
      this.invuln = 0;
    }

    reset() {
      this.x = W / 2 - this.w / 2;
      this.y = H - 60;
      this.alive = true;
      this.invuln = 2.0;
    }

    update(dt) {
      if (!this.alive) return;

      if (keys['ArrowLeft']) this.x -= this.speed * dt;
      if (keys['ArrowRight']) this.x += this.speed * dt;
      this.x = clamp(this.x, 0, W - this.w);

      if (this.cooldown > 0) this.cooldown -= dt;
      if (this.invuln > 0) this.invuln -= dt;
    }

    canShoot() {
      return this.alive && this.cooldown <= 0;
    }

    shoot() {
      this.cooldown = this.cooldownTime;
      return [
        new Bullet(this.x + 4, this.y),
        new Bullet(this.x + this.w - 6, this.y)
      ];
    }

    hit() {
      if (this.invuln > 0) return false;
      this.lives--;
      if (this.lives <= 0) {
        this.alive = false;
        return true; // game over
      }
      this.invuln = 2.0;
      return false;
    }

    draw() {
      if (!this.alive) return;
      const blink = this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 0;
      if (blink) return;

      ctx.save();
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

      // Ship body
      ctx.fillStyle = COLORS.ship;
      ctx.beginPath();
      ctx.moveTo(0, -this.h / 2);
      ctx.lineTo(this.w / 2, this.h / 2);
      ctx.lineTo(this.w / 4, this.h / 3);
      ctx.lineTo(-this.w / 4, this.h / 3);
      ctx.lineTo(-this.w / 2, this.h / 2);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = COLORS.shipAccent;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // Player bullet
  class Bullet {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 3;
      this.h = 12;
      this.vy = -500;
      this.dead = false;
    }

    update(dt) {
      this.y += this.vy * dt;
      if (this.y < -this.h) this.dead = true;
    }

    draw() {
      ctx.fillStyle = COLORS.bullet;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  // Enemy types
  const ENEMY_TYPES = {
    basic: { color: COLORS.enemy1, health: 1, points: 10, speed: 80, shootChance: 0.002 },
    fast: { color: COLORS.enemy2, health: 1, points: 20, speed: 140, shootChance: 0.003 },
    tank: { color: COLORS.enemy3, health: 3, points: 50, speed: 60, shootChance: 0.004 },
    elite: { color: COLORS.enemy4, health: 2, points: 30, speed: 100, shootChance: 0.005 }
  };

  class Enemy {
    constructor(x, y, type = 'basic') {
      const t = ENEMY_TYPES[type] || ENEMY_TYPES.basic;
      this.x = x;
      this.y = y;
      this.w = 32;
      this.h = 28;
      this.type = type;
      this.color = t.color;
      this.health = t.health;
      this.maxHealth = t.health;
      this.points = t.points;
      this.baseSpeed = t.speed;
      this.shootChance = t.shootChance;
      this.dead = false;
      this.t = Math.random() * Math.PI * 2;
      this.startX = x;
    }

    update(dt, level) {
      this.t += dt * 2;
      // Sinusoidal horizontal movement
      this.x = this.startX + Math.sin(this.t) * 40;
      // Move down
      this.y += this.baseSpeed * (1 + level * 0.1) * dt;

      if (this.y > H + this.h) this.dead = true;
    }

    shouldShoot(level) {
      return Math.random() < this.shootChance * (1 + level * 0.2);
    }

    hit() {
      this.health--;
      if (this.health <= 0) {
        this.dead = true;
        return true;
      }
      return false;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2);

      // Body
      ctx.fillStyle = this.color;
      ctx.beginPath();
      if (this.type === 'tank') {
        // Hexagon for tank
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const r = this.w / 2;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
      } else if (this.type === 'fast') {
        // Diamond for fast
        ctx.moveTo(0, -this.h / 2);
        ctx.lineTo(this.w / 2, 0);
        ctx.lineTo(0, this.h / 2);
        ctx.lineTo(-this.w / 2, 0);
      } else if (this.type === 'elite') {
        // Star shape for elite
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const r = this.w / 2;
          if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
          const a2 = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
          ctx.lineTo(Math.cos(a2) * r * 0.5, Math.sin(a2) * r * 0.5);
        }
      } else {
        // Circle for basic
        ctx.arc(0, 0, this.w / 2 - 2, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-6, -2, 3, 0, Math.PI * 2);
      ctx.arc(6, -2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Health bar for tanks
      if (this.maxHealth > 1 && this.health < this.maxHealth) {
        ctx.fillStyle = '#333';
        ctx.fillRect(-this.w / 2, this.h / 2 + 2, this.w, 3);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(-this.w / 2, this.h / 2 + 2, this.w * (this.health / this.maxHealth), 3);
      }

      ctx.restore();
    }
  }

  // Enemy bullet
  class EnemyBullet {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.w = 4;
      this.h = 10;
      this.vy = 250;
      this.dead = false;
    }

    update(dt) {
      this.y += this.vy * dt;
      if (this.y > H) this.dead = true;
    }

    draw() {
      ctx.fillStyle = COLORS.enemyBullet;
      ctx.fillRect(this.x, this.y, this.w, this.h);
    }
  }

  // Explosion particles
  class Explosion {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color || COLORS.explosion;
      this.particles = [];
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const speed = rand(60, 150);
        this.particles.push({
          x: 0,
          y: 0,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          life: rand(0.3, 0.6)
        });
      }
      this.dead = false;
    }

    update(dt) {
      let alive = false;
      for (const p of this.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        if (p.life > 0) alive = true;
      }
      if (!alive) this.dead = true;
    }

    draw() {
      ctx.fillStyle = this.color;
      for (const p of this.particles) {
        if (p.life > 0) {
          const alpha = p.life * 2;
          ctx.globalAlpha = clamp(alpha, 0, 1);
          ctx.beginPath();
          ctx.arc(this.x + p.x, this.y + p.y, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  }

  // Wave definitions
  function generateWave(level) {
    const enemies = [];
    const baseCount = 12 + level * 4;
    const rows = Math.min(4 + Math.floor(level / 2), 8);
    const cols = Math.min(Math.ceil(baseCount / rows), 12);

    const types = ['basic'];
    if (level >= 2) types.push('fast');
    if (level >= 3) types.push('tank');
    if (level >= 4) types.push('elite');

    const startX = (W - cols * 50) / 2;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const type = types[Math.floor(Math.random() * types.length)];
        enemies.push({
          x: startX + col * 50,
          y: -50 - row * 45,
          type: type,
          delay: row * 0.3 + col * 0.05
        });
      }
    }
    return enemies;
  }

  // Game state
  const state = {
    phase: 'title', // title, playing, gameover, levelcomplete
    score: 0,
    level: 1,
    player: new Player(),
    bullets: [],
    enemies: [],
    enemyBullets: [],
    explosions: [],
    waveQueue: [],
    waveTimer: 0,
    levelCompleteTimer: 0
  };

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = String(state.score);
    if (levelEl) levelEl.textContent = String(state.level);
  }

  function submitScore() {
    try {
      if (typeof window.helixAuth !== 'undefined' && window.helixAuth.isLoggedIn()) {
        window.helixAuth.submitScore('invasion', state.score);
      }
    } catch {
      // ignore
    }
  }

  function startGame() {
    state.phase = 'playing';
    state.score = 0;
    state.level = 1;
    state.player = new Player();
    state.bullets = [];
    state.enemies = [];
    state.enemyBullets = [];
    state.explosions = [];
    state.waveQueue = generateWave(state.level);
    state.waveTimer = 0;
    updateHUD();
  }

  function nextLevel() {
    state.level++;
    state.waveQueue = generateWave(state.level);
    state.waveTimer = 0;
    state.player.invuln = 1.5;
    state.phase = 'playing';
    updateHUD();
  }

  function checkCollision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    updateStars(dt);

    // Level complete timer (must run even when not 'playing')
    if (state.phase === 'levelcomplete') {
      state.levelCompleteTimer -= dt;
      if (state.levelCompleteTimer <= 0) {
        nextLevel();
      }
      return;
    }

    if (state.phase !== 'playing') return;
    if (paused) return;

    state.player.update(dt);

    // Shooting
    if (keys['Space'] && state.player.canShoot()) {
      state.bullets.push(...state.player.shoot());
    }

    // Spawn enemies from wave queue
    state.waveTimer += dt;
    for (let i = state.waveQueue.length - 1; i >= 0; i--) {
      const e = state.waveQueue[i];
      if (state.waveTimer >= e.delay) {
        state.enemies.push(new Enemy(e.x, e.y, e.type));
        state.waveQueue.splice(i, 1);
      }
    }

    // Update bullets
    for (const b of state.bullets) b.update(dt);
    state.bullets = state.bullets.filter(b => !b.dead);

    // Update enemies
    for (const e of state.enemies) {
      e.update(dt, state.level);
      if (e.shouldShoot(state.level)) {
        state.enemyBullets.push(new EnemyBullet(e.x + e.w / 2 - 2, e.y + e.h));
      }
    }
    state.enemies = state.enemies.filter(e => !e.dead);

    // Update enemy bullets
    for (const b of state.enemyBullets) b.update(dt);
    state.enemyBullets = state.enemyBullets.filter(b => !b.dead);

    // Update explosions
    for (const ex of state.explosions) ex.update(dt);
    state.explosions = state.explosions.filter(ex => !ex.dead);

    // Bullet vs enemy collision
    for (const b of state.bullets) {
      if (b.dead) continue;
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (checkCollision(b, e)) {
          b.dead = true;
          if (e.hit()) {
            state.score += e.points;
            state.explosions.push(new Explosion(e.x + e.w / 2, e.y + e.h / 2, e.color));
            updateHUD();
          }
          break;
        }
      }
    }

    // Enemy bullet vs player collision
    if (state.player.alive) {
      for (const b of state.enemyBullets) {
        if (b.dead) continue;
        if (checkCollision(b, state.player)) {
          b.dead = true;
          if (state.player.hit()) {
            state.phase = 'gameover';
            state.explosions.push(new Explosion(state.player.x + state.player.w / 2, state.player.y + state.player.h / 2, COLORS.ship));
            submitScore();
          }
        }
      }

      // Enemy vs player collision
      for (const e of state.enemies) {
        if (e.dead) continue;
        if (checkCollision(e, state.player)) {
          e.dead = true;
          state.explosions.push(new Explosion(e.x + e.w / 2, e.y + e.h / 2, e.color));
          if (state.player.hit()) {
            state.phase = 'gameover';
            state.explosions.push(new Explosion(state.player.x + state.player.w / 2, state.player.y + state.player.h / 2, COLORS.ship));
            submitScore();
          }
        }
      }
    }

    // Check level complete
    if (state.enemies.length === 0 && state.waveQueue.length === 0 && state.phase === 'playing') {
      state.phase = 'levelcomplete';
      state.levelCompleteTimer = 2.0;
    }
  }

  function draw() {
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);
    drawStars();

    // Game objects
    for (const ex of state.explosions) ex.draw();
    for (const b of state.bullets) b.draw();
    for (const b of state.enemyBullets) b.draw();
    for (const e of state.enemies) e.draw();
    state.player.draw();

    // Lives display
    if (state.phase === 'playing' || state.phase === 'levelcomplete') {
      ctx.fillStyle = COLORS.ship;
      for (let i = 0; i < state.player.lives; i++) {
        ctx.beginPath();
        ctx.moveTo(20 + i * 25, H - 25);
        ctx.lineTo(30 + i * 25, H - 10);
        ctx.lineTo(10 + i * 25, H - 10);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Title screen
    if (state.phase === 'title') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, W, H);
      drawText('ALIEN INVASION', W / 2, H / 2 - 60, 36);
      drawText('Press SPACE to start', W / 2, H / 2, 20);
      drawText('← → to move, SPACE to shoot', W / 2, H / 2 + 40, 16);
    }

    // Game over
    if (state.phase === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, W, H);
      drawText('GAME OVER', W / 2, H / 2 - 40, 42);
      drawText(`Final Score: ${state.score}`, W / 2, H / 2 + 10, 24);
      drawText('Press SPACE to play again', W / 2, H / 2 + 50, 18);
    }

    // Level complete
    if (state.phase === 'levelcomplete') {
      drawText(`LEVEL ${state.level} COMPLETE!`, W / 2, H / 2, 32);
    }

    // Paused
    if (paused && state.phase === 'playing') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, W, H);
      drawText('PAUSED', W / 2, H / 2, 42);
      drawText('Press P to resume', W / 2, H / 2 + 40, 18);
    }
  }

  let lastTs = performance.now();
  let spaceWasPressed = false;

  function loop(ts) {
    const dt = clamp((ts - lastTs) / 1000, 0, 0.05);
    lastTs = ts;

    const spacePressed = keys['Space'];
    const spaceJustPressed = spacePressed && !spaceWasPressed;
    spaceWasPressed = spacePressed;

    // Handle state transitions
    if (spaceJustPressed) {
      if (state.phase === 'title') {
        startGame();
      } else if (state.phase === 'gameover') {
        startGame();
      }
    }

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  updateHUD();
  requestAnimationFrame(loop);
})();
