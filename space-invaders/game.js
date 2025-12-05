// Classic Space Invaders Game Engine
// Built for Helix Games with authentic mechanics

const GAME_WIDTH = 600;
const GAME_HEIGHT = 700;
const PLAYER_SPEED = 4;
const BULLET_SPEED = 7;
const ALIEN_BULLET_SPEED = 4;
const ALIEN_DROP_DISTANCE = 20;

class Game {
  constructor() {
    this.canvas = document.getElementById('space-invaders-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = GAME_WIDTH;
    this.canvas.height = GAME_HEIGHT;
    
    this.state = 'start'; // start, playing, gameover, level_complete
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    
    this.player = {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT - 50,
      width: 40,
      height: 24,
      isDead: false,
      respawnTimer: 0
    };
    
    this.bullets = [];
    this.alienBullets = [];
    this.particles = [];
    this.bunkers = [];
    this.mysteryShip = null;
    this.mysteryTimer = Math.random() * 1000 + 500;
    
    this.keys = {
      left: false,
      right: false,
      space: false,
      spaceReleased: true
    };
    
    this.aliens = [];
    this.alienDirection = 1; // 1 = right, -1 = left
    this.alienSpeed = 1;
    this.alienMoveTimer = 0;
    this.alienMoveInterval = 60; // Frames between moves
    
    this.setupControls();
    this.initLevel();
    this.loop();
  }
  
  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === ' ') {
        if (this.keys.spaceReleased) {
          this.keys.space = true;
          this.keys.spaceReleased = false;
        }
      }
      if (e.key === 'r' || e.key === 'R') {
        if (this.state === 'gameover') this.restart();
      }
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
      if (this.state === 'start' && (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        this.state = 'playing';
      }
    });
    
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === ' ') {
        this.keys.space = false;
        this.keys.spaceReleased = true;
      }
    });
  }
  
  initLevel() {
    this.bullets = [];
    this.alienBullets = [];
    this.aliens = [];
    this.alienDirection = 1;
    this.alienSpeed = 1 + (this.level * 0.1);
    this.alienMoveInterval = Math.max(10, 60 - (this.level * 5));
    
    // Create aliens grid (5 rows x 11 cols)
    const rows = 5;
    const cols = 11;
    const startX = 50;
    const startY = 80;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let type = 'small';
        let score = 10;
        if (row === 0) { type = 'large'; score = 30; }
        else if (row < 3) { type = 'medium'; score = 20; }
        
        this.aliens.push({
          x: startX + col * 40,
          y: startY + row * 35,
          width: 24,
          height: 24,
          type: type,
          score: score,
          row: row,
          col: col,
          frame: 0 // Animation frame
        });
      }
    }
    
    // Create bunkers if first level or destroyed
    if (this.level === 1 || this.bunkers.length === 0) {
      this.bunkers = [];
      for (let i = 0; i < 4; i++) {
        this.createBunker(75 + i * 135, GAME_HEIGHT - 120);
      }
    }
  }
  
  createBunker(x, y) {
    const bunker = {
      x: x,
      y: y,
      width: 44,
      height: 32,
      damage: [] // Array of damage pixels
    };
    
    // Initialize damage grid (0 = intact, 1 = destroyed)
    // Using simplified damage model for performance
    this.bunkers.push(bunker);
  }
  
  restart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.state = 'start';
    this.player.isDead = false;
    this.initLevel();
  }
  
  update() {
    if (this.state !== 'playing') return;
    
    // Player movement
    if (!this.player.isDead) {
      if (this.keys.left && this.player.x > 20) this.player.x -= PLAYER_SPEED;
      if (this.keys.right && this.player.x < GAME_WIDTH - 20) this.player.x += PLAYER_SPEED;
      
      // Player shooting
      if (this.keys.space) {
        if (this.bullets.length === 0) { // Only one bullet at a time
          this.bullets.push({
            x: this.player.x,
            y: this.player.y - 15,
            width: 4,
            height: 10,
            active: true
          });
          audioManager.shoot(); // Sound effect
          // Reset space to require repress
          this.keys.space = false; 
        }
      }
    } else {
      this.player.respawnTimer--;
      if (this.player.respawnTimer <= 0) {
        this.player.isDead = false;
        this.player.x = GAME_WIDTH / 2;
        this.bullets = [];
        this.alienBullets = [];
      }
    }
    
    // Update bullets
    this.bullets.forEach(b => {
      b.y -= BULLET_SPEED;
      if (b.y < 0) b.active = false;
      
      // Check alien collision
      this.aliens.forEach(a => {
        if (b.active && this.checkCollision(b, a)) {
          b.active = false;
          a.active = false; // Mark for removal
          this.score += a.score;
          this.createExplosion(a.x, a.y, '#3cd2a5');
          audioManager.alienHit(); // Sound effect
          
          // Increase speed as aliens die
          this.alienMoveInterval = Math.max(5, this.alienMoveInterval * 0.98);
        }
      });
      
      // Check mystery ship collision
      if (this.mysteryShip && b.active && this.checkCollision(b, this.mysteryShip)) {
        b.active = false;
        this.mysteryShip.active = false;
        this.score += Math.floor(Math.random() * 3 + 1) * 50; // 50, 100, 150
        this.createExplosion(this.mysteryShip.x, this.mysteryShip.y, '#ff0000');
        audioManager.explosion(); // Sound effect
        this.mysteryShip = null;
        this.mysteryTimer = Math.random() * 1000 + 1000;
      }
      
      // Check bunker collision (player bullets damage bunkers too!)
      this.bunkers.forEach(bunker => {
        if (b.active && this.checkCollision(b, bunker)) {
          b.active = false;
          this.damageBunker(bunker, b.x, b.y);
        }
      });
    });
    
    // Update Alien Bullets
    this.alienBullets.forEach(b => {
      b.y += ALIEN_BULLET_SPEED;
      if (b.y > GAME_HEIGHT) b.active = false;
      
      // Check player collision
      if (b.active && !this.player.isDead && this.checkCollision(b, this.player)) {
        b.active = false;
        this.playerDie();
      }
      
      // Check bunker collision
      this.bunkers.forEach(bunker => {
        if (b.active && this.checkCollision(b, bunker)) {
          b.active = false;
          this.damageBunker(bunker, b.x, b.y);
        }
      });
    });
    
    // Clean up inactive bullets/aliens
    this.bullets = this.bullets.filter(b => b.active);
    this.alienBullets = this.alienBullets.filter(b => b.active);
    this.aliens = this.aliens.filter(a => a.active !== false);
    
    // Level Complete
    if (this.aliens.length === 0) {
      this.level++;
      audioManager.levelComplete(); // Sound effect
      this.initLevel();
      // Brief pause could be added here
    }
    
    // Alien Movement
    this.alienMoveTimer++;
    if (this.alienMoveTimer > this.alienMoveInterval) {
      this.alienMoveTimer = 0;
      this.moveAliens();
    }
    
    // Alien Shooting
    if (Math.random() < 0.02 + (this.level * 0.005)) {
      this.alienShoot();
    }
    
    // Mystery Ship
    if (!this.mysteryShip) {
      this.mysteryTimer--;
      if (this.mysteryTimer <= 0) {
        this.spawnMysteryShip();
        audioManager.mysteryShip(); // Sound effect
      }
    } else {
      this.mysteryShip.x += this.mysteryShip.speed;
      if (this.mysteryShip.x > GAME_WIDTH + 50 || this.mysteryShip.x < -50) {
        this.mysteryShip = null;
        this.mysteryTimer = Math.random() * 1000 + 500;
      }
    }
    
    // Update particles
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    });
    this.particles = this.particles.filter(p => p.life > 0);
    
    // Check Game Over (Aliens reached bottom)
    this.aliens.forEach(a => {
      if (a.y > this.player.y - 20) {
        this.lives = 0;
        this.state = 'gameover';
      }
    });
    
    this.updateStats();
  }
  
  moveAliens() {
    let hitEdge = false;
    let lowY = 0;
    
    // Check edges
    this.aliens.forEach(a => {
      if (this.alienDirection === 1 && a.x > GAME_WIDTH - 40) hitEdge = true;
      if (this.alienDirection === -1 && a.x < 40) hitEdge = true;
      if (a.y > lowY) lowY = a.y;
      
      // Animate
      a.frame = a.frame === 0 ? 1 : 0;
    });
    
    if (hitEdge) {
      this.alienDirection *= -1;
      this.aliens.forEach(a => a.y += ALIEN_DROP_DISTANCE);
    } else {
      this.aliens.forEach(a => a.x += this.alienDirection * 10);
    }
  }
  
  alienShoot() {
    // Find bottom-most aliens in each column
    const cols = {};
    this.aliens.forEach(a => {
      if (!cols[a.col] || a.y > cols[a.col].y) {
        cols[a.col] = a;
      }
    });
    
    const shooters = Object.values(cols);
    if (shooters.length > 0) {
      const shooter = shooters[Math.floor(Math.random() * shooters.length)];
      this.alienBullets.push({
        x: shooter.x,
        y: shooter.y + 10,
        width: 4,
        height: 10,
        active: true
      });
    }
  }
  
  spawnMysteryShip() {
    const direction = Math.random() < 0.5 ? 1 : -1;
    this.mysteryShip = {
      x: direction === 1 ? -40 : GAME_WIDTH + 40,
      y: 40,
      width: 48,
      height: 21,
      speed: direction * 2,
      active: true
    };
  }
  
  playerDie() {
    this.lives--;
    this.player.isDead = true;
    this.player.respawnTimer = 60;
    this.createExplosion(this.player.x, this.player.y, '#00ff00', 20);
    audioManager.playerHit(); // Sound effect
    
    if (this.lives <= 0) {
      this.state = 'gameover';
      audioManager.gameOver(); // Sound effect
    }
  }
  
  damageBunker(bunker, hitX, hitY) {
    // Simple distance-based damage
    // In a full implementation, this would erode pixels
    // Here we just track hit count or remove logic if simplified
    // For now, let's just make visual damage holes
    this.createExplosion(hitX, hitY, '#3cd2a5', 5);
  }
  
  createExplosion(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 30,
        color: color
      });
    }
  }
  
  checkCollision(rect1, rect2) {
    return (rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y);
  }
  
  draw() {
    // Clear
    this.ctx.fillStyle = '#0a0e10';
    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw starfield
    this.drawStars();
    
    // Draw Player
    if (!this.player.isDead) {
      this.ctx.fillStyle = '#00ff00';
      // Simple ship shape
      this.ctx.beginPath();
      this.ctx.moveTo(this.player.x, this.player.y - 12);
      this.ctx.lineTo(this.player.x + 20, this.player.y + 12);
      this.ctx.lineTo(this.player.x - 20, this.player.y + 12);
      this.ctx.fill();
    }
    
    // Draw Aliens
    this.aliens.forEach(a => {
      this.ctx.fillStyle = '#ffffff';
      if (a.frame === 0) {
        // Arms down
        this.ctx.fillRect(a.x - 10, a.y - 8, 20, 16);
        this.ctx.fillRect(a.x - 14, a.y, 4, 8); // Left arm
        this.ctx.fillRect(a.x + 10, a.y, 4, 8); // Right arm
      } else {
        // Arms up
        this.ctx.fillRect(a.x - 10, a.y - 8, 20, 16);
        this.ctx.fillRect(a.x - 14, a.y - 8, 4, 8); // Left arm
        this.ctx.fillRect(a.x + 10, a.y - 8, 4, 8); // Right arm
      }
      // Eyes
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(a.x - 5, a.y - 4, 4, 4);
      this.ctx.fillRect(a.x + 1, a.y - 4, 4, 4);
    });
    
    // Draw Mystery Ship
    if (this.mysteryShip) {
      this.ctx.fillStyle = '#ff0000';
      this.ctx.beginPath();
      this.ctx.ellipse(this.mysteryShip.x, this.mysteryShip.y, 24, 10, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    // Draw Bunkers
    this.ctx.fillStyle = '#3cd2a5';
    this.bunkers.forEach(b => {
      this.ctx.fillRect(b.x, b.y, b.width, b.height);
      // Arch
      this.ctx.fillStyle = '#0a0e10';
      this.ctx.beginPath();
      this.ctx.arc(b.x + b.width/2, b.y + b.height, 10, Math.PI, 0);
      this.ctx.fill();
      this.ctx.fillStyle = '#3cd2a5'; // Reset
    });
    
    // Draw Bullets
    this.ctx.fillStyle = '#ffffff';
    this.bullets.forEach(b => this.ctx.fillRect(b.x - 2, b.y, 4, 10));
    
    this.ctx.fillStyle = '#ff0000'; // Alien bullets red
    this.alienBullets.forEach(b => {
      this.ctx.beginPath();
      this.ctx.moveTo(b.x, b.y);
      this.ctx.lineTo(b.x - 3, b.y - 6);
      this.ctx.lineTo(b.x + 3, b.y - 6);
      this.ctx.fill();
    });
    
    // Draw Particles
    this.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, 3, 3);
    });
    
    // Draw Overlay Messages
    if (this.state === 'start') {
      this.drawCenteredText('SPACE INVADERS', GAME_HEIGHT / 2 - 40, '40px', '#3cd2a5');
      this.drawCenteredText('Press SPACE to Start', GAME_HEIGHT / 2 + 20, '20px', '#ffffff');
    } else if (this.state === 'gameover') {
      this.drawCenteredText('GAME OVER', GAME_HEIGHT / 2 - 20, '40px', '#ff0000');
      this.drawCenteredText('Press R to Restart', GAME_HEIGHT / 2 + 30, '20px', '#ffffff');
    }
  }
  
  drawStars() {
    // Simple static stars for background
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    // Use pseudo-random but deterministic positions based on coords
    for (let i = 0; i < 50; i++) {
      const x = (i * 12345) % GAME_WIDTH;
      const y = (i * 67890) % GAME_HEIGHT;
      this.ctx.fillRect(x, y, 2, 2);
    }
  }
  
  drawCenteredText(text, y, fontSize, color) {
    this.ctx.fillStyle = color;
    this.ctx.font = `bold ${fontSize} Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, GAME_WIDTH / 2, y);
  }
  
  updateStats() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('level').textContent = this.level;
  }
  
  loop() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});

// Mute toggle function
function toggleMute() {
  const muted = audioManager.toggleMute();
  const btn = document.getElementById('muteToggle');
  if (btn) {
    btn.textContent = muted ? '🔇 Sound OFF' : '🔊 Sound ON';
  }
}
