// Classic Lode Runner Game
// Grid-based puzzle platformer

const TILE_SIZE = 32;
const GRID_WIDTH = 28;
const GRID_HEIGHT = 21;

// Tile types
const TILE = {
  EMPTY: 0,
  BRICK: 1,
  SOLID: 2,
  LADDER: 3,
  ROPE: 4,
  GOLD: 5,
  HIDDEN_LADDER: 6,
  DUG_BRICK: 7  // Temporarily dug brick
};

// Game colors
const COLORS = {
  BACKGROUND: '#000000',
  BRICK: '#8B4513',
  SOLID: '#696969',
  LADDER: '#FFD700',
  ROPE: '#DAA520',
  GOLD: '#FFD700',
  PLAYER: '#00FF00',
  GUARD: '#FF0000',
  DUG: '#654321'
};

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.onLadder = false;
    this.onRope = false;
  }
  
  update(level, keys) {
    this.vx = 0;
    
    // Check current tile
    const tileX = Math.floor(this.x);
    const tileY = Math.floor(this.y);
    const currentTile = level.getTile(tileX, tileY);
    
    this.onLadder = (currentTile === TILE.LADDER || currentTile === TILE.HIDDEN_LADDER);
    this.onRope = (currentTile === TILE.ROPE);
    
    // Check if on ground
    this.onGround = false;
    const belowTile = level.getTile(tileX, tileY + 1);
    if (belowTile === TILE.BRICK || belowTile === TILE.SOLID || belowTile === TILE.LADDER) {
      this.onGround = true;
      this.vy = 0;
    }
    
    // Horizontal movement
    if (keys.left) this.vx = -0.15;
    if (keys.right) this.vx = 0.15;
    
    // Vertical movement
    if (this.onLadder) {
      this.vy = 0;
      if (keys.up) this.vy = -0.15;
      if (keys.down) this.vy = 0.15;
    } else if (this.onRope) {
      this.vy = 0;
      if (keys.down) {
        // Drop from rope
        this.vy = 0.1;
      }
    } else if (!this.onGround) {
      // Gravity
      this.vy += 0.01;
      if (this.vy > 0.3) this.vy = 0.3;
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Collision detection
    const newTileX = Math.floor(this.x);
    const newTileY = Math.floor(this.y);
    
    // Horizontal collision
    if (this.vx !== 0) {
      const checkTile = level.getTile(newTileX, Math.floor(this.y));
      if (checkTile === TILE.BRICK || checkTile === TILE.SOLID) {
        this.x = tileX;
      }
    }
    
    // Vertical collision
    if (this.vy > 0) {
      const checkTile = level.getTile(Math.floor(this.x), newTileY);
      if (checkTile === TILE.BRICK || checkTile === TILE.SOLID) {
        this.y = tileY;
        this.vy = 0;
        this.onGround = true;
      }
    }
    
    // Bounds check
    if (this.x < 0) this.x = 0;
    if (this.x >= GRID_WIDTH - 1) this.x = GRID_WIDTH - 1;
    if (this.y < 0) this.y = 0;
    if (this.y >= GRID_HEIGHT - 1) this.y = GRID_HEIGHT - 1;
  }
  
  dig(level, direction) {
    const tileX = Math.floor(this.x);
    const tileY = Math.floor(this.y);
    
    // Can only dig if on ground or rope
    if (!this.onGround && !this.onRope) return false;
    
    const digX = tileX + direction;
    const digY = tileY + 1;
    
    // Check if tile can be dug
    if (level.getTile(digX, digY) === TILE.BRICK) {
      level.digHole(digX, digY);
      return true;
    }
    
    return false;
  }
}

class Guard {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.stuck = false;
    this.stuckTimer = 0;
  }
  
  update(level, player) {
    const tileX = Math.floor(this.x);
    const tileY = Math.floor(this.y);
    const currentTile = level.getTile(tileX, tileY);
    
    // Check if stuck in hole
    if (currentTile === TILE.DUG_BRICK) {
      this.stuck = true;
      this.stuckTimer++;
      if (this.stuckTimer > 300) {
        // Escape after being stuck for a while
        this.y = tileY - 1;
        this.stuck = false;
        this.stuckTimer = 0;
      }
      return;
    }
    
    this.stuck = false;
    this.stuckTimer = 0;
    
    // Simple AI: chase player
    const onLadder = (currentTile === TILE.LADDER || currentTile === TILE.HIDDEN_LADDER);
    const belowTile = level.getTile(tileX, tileY + 1);
    const onGround = (belowTile === TILE.BRICK || belowTile === TILE.SOLID || belowTile === TILE.LADDER);
    
    // Horizontal movement toward player
    if (Math.abs(player.x - this.x) > 0.5) {
      this.vx = player.x > this.x ? 0.1 : -0.1;
    } else {
      this.vx = 0;
    }
    
    // Vertical movement
    if (onLadder) {
      if (Math.abs(player.y - this.y) > 0.5) {
        this.vy = player.y > this.y ? 0.1 : -0.1;
      } else {
        this.vy = 0;
      }
    } else if (!onGround) {
      // Gravity
      this.vy += 0.01;
      if (this.vy > 0.3) this.vy = 0.3;
    } else {
      this.vy = 0;
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Basic collision
    const newTileX = Math.floor(this.x);
    const newTileY = Math.floor(this.y);
    
    if (this.vx !== 0) {
      const checkTile = level.getTile(newTileX, Math.floor(this.y));
      if (checkTile === TILE.BRICK || checkTile === TILE.SOLID) {
        this.x = tileX;
      }
    }
    
    if (this.vy > 0) {
      const checkTile = level.getTile(Math.floor(this.x), newTileY);
      if (checkTile === TILE.BRICK || checkTile === TILE.SOLID) {
        this.y = tileY;
        this.vy = 0;
      }
    }
    
    // Bounds
    if (this.x < 0) this.x = 0;
    if (this.x >= GRID_WIDTH - 1) this.x = GRID_WIDTH - 1;
    if (this.y < 0) this.y = 0;
    if (this.y >= GRID_HEIGHT - 1) this.y = GRID_HEIGHT - 1;
  }
}

class Level {
  constructor(levelNumber) {
    this.levelNumber = levelNumber;
    this.grid = [];
    this.dugHoles = [];
    this.gold = [];
    this.generate();
  }
  
  generate() {
    // Initialize empty grid
    this.grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(TILE.EMPTY));
    
    // Ground floor
    for (let x = 0; x < GRID_WIDTH; x++) {
      this.grid[GRID_HEIGHT - 1][x] = TILE.SOLID;
    }
    
    // Create platforms
    const platformCount = 4 + this.levelNumber;
    for (let i = 0; i < platformCount; i++) {
      const y = 3 + Math.floor(Math.random() * (GRID_HEIGHT - 6));
      const x = Math.floor(Math.random() * (GRID_WIDTH - 12));
      const width = 5 + Math.floor(Math.random() * 8);
      
      for (let px = x; px < Math.min(x + width, GRID_WIDTH); px++) {
        if (Math.random() > 0.3) {
          this.grid[y][px] = TILE.BRICK;
        }
      }
    }
    
    // Add ladders
    const ladderCount = 6 + this.levelNumber;
    for (let i = 0; i < ladderCount; i++) {
      const x = Math.floor(Math.random() * GRID_WIDTH);
      const y = Math.floor(Math.random() * (GRID_HEIGHT - 2));
      const height = 2 + Math.floor(Math.random() * 5);
      
      for (let ly = y; ly < Math.min(y + height, GRID_HEIGHT - 1); ly++) {
        if (this.grid[ly][x] === TILE.EMPTY) {
          this.grid[ly][x] = TILE.LADDER;
        }
      }
    }
    
    // Add some ropes
    const ropeCount = 3 + Math.floor(this.levelNumber / 2);
    for (let i = 0; i < ropeCount; i++) {
      const y = 2 + Math.floor(Math.random() * (GRID_HEIGHT - 8));
      const x = Math.floor(Math.random() * (GRID_WIDTH - 8));
      const width = 4 + Math.floor(Math.random() * 6);
      
      for (let rx = x; rx < Math.min(x + width, GRID_WIDTH); rx++) {
        if (this.grid[y][rx] === TILE.EMPTY) {
          this.grid[y][rx] = TILE.ROPE;
        }
      }
    }
    
    // Place gold
    this.gold = [];
    const goldCount = 5 + this.levelNumber * 2;
    for (let i = 0; i < goldCount; i++) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 50) {
        const x = Math.floor(Math.random() * GRID_WIDTH);
        const y = Math.floor(Math.random() * (GRID_HEIGHT - 1));
        if (this.grid[y][x] === TILE.EMPTY) {
          this.gold.push({x, y, collected: false});
          placed = true;
        }
        attempts++;
      }
    }
    
    // Add hidden ladder at top (exit)
    const exitX = Math.floor(GRID_WIDTH / 2);
    this.grid[0][exitX] = TILE.HIDDEN_LADDER;
    this.grid[1][exitX] = TILE.HIDDEN_LADDER;
  }
  
  getTile(x, y) {
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return TILE.SOLID;
    
    // Check for dug holes
    const hole = this.dugHoles.find(h => h.x === Math.floor(x) && h.y === Math.floor(y));
    if (hole) return TILE.DUG_BRICK;
    
    return this.grid[Math.floor(y)][Math.floor(x)];
  }
  
  digHole(x, y) {
    this.dugHoles.push({
      x: x,
      y: y,
      timer: 0,
      maxTime: 300  // Hole fills in after 5 seconds
    });
  }
  
  update() {
    // Update dug holes
    this.dugHoles = this.dugHoles.filter(hole => {
      hole.timer++;
      return hole.timer < hole.maxTime;
    });
  }
}

class LodeRunnerGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.paused = false;
    this.gameOver = false;
    
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      digLeft: false,
      digRight: false
    };
    
    this.initLevel();
    this.setupControls();
    this.update();
  }
  
  initLevel() {
    this.currentLevel = new Level(this.level);
    this.player = new Player(1, GRID_HEIGHT - 2);
    
    // Create guards
    this.guards = [];
    const guardCount = 1 + Math.floor(this.level / 2);
    for (let i = 0; i < guardCount; i++) {
      this.guards.push(new Guard(
        GRID_WIDTH - 3 - i * 2,
        GRID_HEIGHT - 2
      ));
    }
    
    this.goldCollected = 0;
    this.updateUI();
  }
  
  setupControls() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.keys.left = true;
      if (e.key === 'ArrowRight') this.keys.right = true;
      if (e.key === 'ArrowUp') this.keys.up = true;
      if (e.key === 'ArrowDown') this.keys.down = true;
      if (e.key === 'z' || e.key === 'Z') this.keys.digLeft = true;
      if (e.key === 'x' || e.key === 'X') this.keys.digRight = true;
      if (e.key === 'p' || e.key === 'P') this.paused = !this.paused;
      if (e.key === 'r' || e.key === 'R') this.restart();
    });
    
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft') this.keys.left = false;
      if (e.key === 'ArrowRight') this.keys.right = false;
      if (e.key === 'ArrowUp') this.keys.up = false;
      if (e.key === 'ArrowDown') this.keys.down = false;
      if (e.key === 'z' || e.key === 'Z') this.keys.digLeft = false;
      if (e.key === 'x' || e.key === 'X') this.keys.digRight = false;
    });
  }
  
  restart() {
    this.lives = 3;
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.initLevel();
  }
  
  update() {
    if (!this.paused && !this.gameOver) {
      // Update level
      this.currentLevel.update();
      
      // Handle digging
      if (this.keys.digLeft) {
        this.player.dig(this.currentLevel, -1);
        this.keys.digLeft = false;
      }
      if (this.keys.digRight) {
        this.player.dig(this.currentLevel, 1);
        this.keys.digRight = false;
      }
      
      // Update player
      this.player.update(this.currentLevel, this.keys);
      
      // Update guards
      this.guards.forEach(guard => guard.update(this.currentLevel, this.player));
      
      // Check gold collection
      this.currentLevel.gold.forEach(gold => {
        if (!gold.collected) {
          const dx = this.player.x - gold.x;
          const dy = this.player.y - gold.y;
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
            gold.collected = true;
            this.goldCollected++;
            this.score += 250;
            this.updateUI();
          }
        }
      });
      
      // Check if all gold collected
      if (this.goldCollected === this.currentLevel.gold.length) {
        // Show exit ladder
        const exitX = Math.floor(GRID_WIDTH / 2);
        this.currentLevel.grid[0][exitX] = TILE.LADDER;
        this.currentLevel.grid[1][exitX] = TILE.LADDER;
        
        // Check if player reached exit
        if (Math.floor(this.player.y) <= 1 && Math.abs(this.player.x - exitX) < 1) {
          this.nextLevel();
        }
      }
      
      // Check collision with guards
      this.guards.forEach(guard => {
        const dx = this.player.x - guard.x;
        const dy = this.player.y - guard.y;
        if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6) {
          this.loseLife();
        }
      });
    }
    
    this.draw();
    requestAnimationFrame(() => this.update());
  }
  
  nextLevel() {
    this.level++;
    this.score += 1000;
    this.initLevel();
  }
  
  loseLife() {
    this.lives--;
    this.updateUI();
    
    if (this.lives <= 0) {
      this.gameOver = true;
      this.submitScore();
    } else {
      // Reset positions
      this.player.x = 1;
      this.player.y = GRID_HEIGHT - 2;
      this.guards.forEach((guard, i) => {
        guard.x = GRID_WIDTH - 3 - i * 2;
        guard.y = GRID_HEIGHT - 2;
      });
    }
  }
  
  updateUI() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('level').textContent = this.level;
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('gold-collected').textContent = this.goldCollected;
    document.getElementById('gold-total').textContent = this.currentLevel.gold.length;
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = COLORS.BACKGROUND;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw level
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const tile = this.currentLevel.getTile(x, y);
        
        if (tile === TILE.BRICK) {
          this.ctx.fillStyle = COLORS.BRICK;
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          this.ctx.strokeStyle = '#654321';
          this.ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILE.SOLID) {
          this.ctx.fillStyle = COLORS.SOLID;
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (tile === TILE.LADDER || tile === TILE.HIDDEN_LADDER) {
          this.ctx.strokeStyle = COLORS.LADDER;
          this.ctx.lineWidth = 3;
          this.ctx.beginPath();
          this.ctx.moveTo(x * TILE_SIZE + 8, y * TILE_SIZE);
          this.ctx.lineTo(x * TILE_SIZE + 8, y * TILE_SIZE + TILE_SIZE);
          this.ctx.moveTo(x * TILE_SIZE + 24, y * TILE_SIZE);
          this.ctx.lineTo(x * TILE_SIZE + 24, y * TILE_SIZE + TILE_SIZE);
          this.ctx.stroke();
          
          // Rungs
          for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * TILE_SIZE + 8, y * TILE_SIZE + i * 11);
            this.ctx.lineTo(x * TILE_SIZE + 24, y * TILE_SIZE + i * 11);
            this.ctx.stroke();
          }
        } else if (tile === TILE.ROPE) {
          this.ctx.strokeStyle = COLORS.ROPE;
          this.ctx.lineWidth = 2;
          this.ctx.beginPath();
          this.ctx.moveTo(x * TILE_SIZE, y * TILE_SIZE + 8);
          this.ctx.lineTo(x * TILE_SIZE + TILE_SIZE, y * TILE_SIZE + 8);
          this.ctx.stroke();
        } else if (tile === TILE.DUG_BRICK) {
          this.ctx.fillStyle = COLORS.DUG;
          this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    
    // Draw gold
    this.currentLevel.gold.forEach(gold => {
      if (!gold.collected) {
        this.ctx.fillStyle = COLORS.GOLD;
        this.ctx.beginPath();
        this.ctx.arc(
          gold.x * TILE_SIZE + TILE_SIZE / 2,
          gold.y * TILE_SIZE + TILE_SIZE / 2,
          8,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }
    });
    
    // Draw player
    this.ctx.fillStyle = COLORS.PLAYER;
    this.ctx.fillRect(
      this.player.x * TILE_SIZE + 4,
      this.player.y * TILE_SIZE + 4,
      TILE_SIZE - 8,
      TILE_SIZE - 8
    );
    
    // Draw guards
    this.guards.forEach(guard => {
      this.ctx.fillStyle = guard.stuck ? '#880000' : COLORS.GUARD;
      this.ctx.fillRect(
        guard.x * TILE_SIZE + 4,
        guard.y * TILE_SIZE + 4,
        TILE_SIZE - 8,
        TILE_SIZE - 8
      );
    });
    
    // Draw game over
    if (this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#3cd2a5';
      this.ctx.font = 'bold 48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
      
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press R to Restart', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
    
    // Draw pause
    if (this.paused && !this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      
      this.ctx.fillStyle = '#3cd2a5';
      this.ctx.font = 'bold 36px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    }
  }
  
  submitScore() {
    // Check if auth system is available and user is logged in
    if (typeof window.helixAuth !== 'undefined' && window.helixAuth.isLoggedIn()) {
      const result = window.helixAuth.submitScore('lode-runner', this.score, this.level);
      
      if (result.success && result.isPersonalBest) {
        // Show personal best notification
        setTimeout(() => {
          console.log('🎉 New Personal Best!', this.score);
        }, 100);
      }
    }
  }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
  new LodeRunnerGame();
});
