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
    
    // Check if can climb (on ladder OR ladder below while on ground)
    const canClimbUp = this.onLadder || (this.onGround && belowTile === TILE.LADDER);
    const canClimbDown = this.onLadder || belowTile === TILE.LADDER;
    
    // Horizontal movement (50% slower)
    if (keys.left) this.vx = -0.075;
    if (keys.right) this.vx = 0.075;
    
    // Vertical movement (50% slower)
    if (this.onLadder) {
      this.vy = 0;
      if (keys.up) this.vy = -0.075;
      if (keys.down) this.vy = 0.075;
    } else if (canClimbUp && keys.up) {
      // Start climbing down onto ladder from above
      this.vy = -0.075;
    } else if (canClimbDown && keys.down) {
      // Climb down onto ladder
      this.vy = 0.075;
    } else if (this.onRope) {
      // On rope - can move horizontally freely, drop with down
      this.vy = 0;
      // Snap to rope height for smooth traversal
      this.y = tileY + 0.3;
      if (keys.down) {
        // Drop from rope
        this.onRope = false;
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
    this.carriedGold = null; // Gold being carried by this guard
  }
  
  update(level, player) {
    const tileX = Math.floor(this.x);
    const tileY = Math.floor(this.y);
    const currentTile = level.getTile(tileX, tileY);
    
    // Check if stuck in hole
    if (currentTile === TILE.DUG_BRICK) {
      this.stuck = true;
      this.stuckTimer++;
      
      // Drop gold when falling into hole
      if (this.carriedGold && this.stuckTimer === 1) {
        this.dropGold(level);
      }
      
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
    
    // Try to pick up gold if not carrying any
    if (!this.carriedGold) {
      this.tryPickupGold(level);
    }
    
    // Simple AI: chase player
    const onLadder = (currentTile === TILE.LADDER || currentTile === TILE.HIDDEN_LADDER);
    const belowTile = level.getTile(tileX, tileY + 1);
    const onGround = (belowTile === TILE.BRICK || belowTile === TILE.SOLID || belowTile === TILE.LADDER);
    
    // Horizontal movement toward player (50% slower)
    if (Math.abs(player.x - this.x) > 0.5) {
      this.vx = player.x > this.x ? 0.05 : -0.05;
    } else {
      this.vx = 0;
    }
    
    // Vertical movement (50% slower)
    if (onLadder) {
      if (Math.abs(player.y - this.y) > 0.5) {
        this.vy = player.y > this.y ? 0.05 : -0.05;
      } else {
        this.vy = 0;
      }
    } else if (!onGround) {
      // Gravity
      this.vy += 0.005;
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
  
  tryPickupGold(level) {
    const tileX = Math.floor(this.x);
    const tileY = Math.floor(this.y);
    
    // Check for uncollected gold at current position
    for (const gold of level.gold) {
      if (!gold.collected && !gold.carriedBy && 
          Math.abs(gold.x - tileX) < 0.8 && Math.abs(gold.y - tileY) < 0.8) {
        gold.carriedBy = this;
        this.carriedGold = gold;
        return;
      }
    }
  }
  
  dropGold(level) {
    if (this.carriedGold) {
      // Drop gold at current position (above the hole)
      const tileX = Math.floor(this.x);
      const tileY = Math.floor(this.y) - 1;
      
      this.carriedGold.x = tileX;
      this.carriedGold.y = tileY;
      this.carriedGold.carriedBy = null;
      this.carriedGold = null;
    }
  }
}

// Pre-designed levels - each level is a playable, tested layout
// Key: B=Brick, S=Solid, H=Ladder, R=Rope, .=Empty
// Ladders (H) on brick rows allow climbing THROUGH the floor
const LEVEL_DESIGNS = [
  // Level 1 - Simple introduction (gold on platforms accessible via ladders)
  {
    layout: `
............................
............................
..........HHHH..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
..........H..H..............
SSSSSSSSSSSSSSSSSSSSSSSSSSSS`,
    gold: [{x:6,y:3}, {x:14,y:3}, {x:6,y:6}, {x:14,y:6}, {x:6,y:9}, {x:14,y:9}],
    guards: [{x:14, y:15}],
    player: {x:10, y:18}
  },
  // Level 2 - With rope
  {
    layout: `
............................
............................
..........HHHH..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..RRRRRRRRHRRHRRRRRRRRRR....
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..RRRRRRRRHRRHRRRRRRRRRR....
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
..........H..H..............
SSSSSSSSSSSSSSSSSSSSSSSSSSSS`,
    gold: [{x:6,y:3}, {x:14,y:3}, {x:6,y:7}, {x:14,y:7}, {x:6,y:10}, {x:14,y:10}, {x:6,y:14}, {x:14,y:14}],
    guards: [{x:14, y:14}],
    player: {x:10, y:17}
  },
  // Level 3 - More guards
  {
    layout: `
............................
............................
..........HHHH..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..RRRRRRRRHRRHRRRRRRRRRR....
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
..........H..H..............
..........H..H..............
SSSSSSSSSSSSSSSSSSSSSSSSSSSS`,
    gold: [{x:6,y:3}, {x:14,y:3}, {x:6,y:6}, {x:14,y:6}, {x:6,y:10}, {x:14,y:10}, {x:6,y:13}, {x:14,y:13}],
    guards: [{x:14, y:13}, {x:6, y:3}],
    player: {x:10, y:17}
  },
  // Level 4 - Tighter platforms
  {
    layout: `
............................
............................
..........HHHH..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
..........H..H..............
..........H..H..............
SSSSSSSSSSSSSSSSSSSSSSSSSSSS`,
    gold: [{x:6,y:3}, {x:14,y:3}, {x:6,y:5}, {x:14,y:5}, {x:6,y:7}, {x:14,y:7}, {x:6,y:9}, {x:14,y:9}, {x:6,y:11}, {x:14,y:11}],
    guards: [{x:14, y:13}, {x:6, y:3}, {x:14, y:7}],
    player: {x:10, y:17}
  },
  // Level 5 - The challenge
  {
    layout: `
............................
............................
..........HHHH..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..RRRRRRRRHRRHRRRRRRRRRR....
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..RRRRRRRRHRRHRRRRRRRRRR....
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..RRRRRRRRHRRHRRRRRRRRRR....
..........H..H..............
.....BBBBBHBBHBBBBB.........
..........H..H..............
..........H..H..............
SSSSSSSSSSSSSSSSSSSSSSSSSSSS`,
    gold: [{x:6,y:3}, {x:14,y:3}, {x:6,y:7}, {x:14,y:7}, {x:6,y:11}, {x:14,y:11}, {x:6,y:15}, {x:14,y:15}],
    guards: [{x:14, y:15}, {x:6, y:3}, {x:14, y:7}, {x:6, y:11}],
    player: {x:10, y:17}
  }
];

class Level {
  constructor(levelNumber) {
    this.levelNumber = levelNumber;
    this.grid = [];
    this.dugHoles = [];
    this.gold = [];
    this.playerStart = {x: 1, y: GRID_HEIGHT - 2};
    this.guardStarts = [];
    this.loadLevel();
  }
  
  loadLevel() {
    // Get level design (cycle through if beyond available levels)
    const levelIndex = (this.levelNumber - 1) % LEVEL_DESIGNS.length;
    const design = LEVEL_DESIGNS[levelIndex];
    
    // Initialize empty grid
    this.grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(TILE.EMPTY));
    
    // Parse layout string
    const lines = design.layout.trim().split('\n');
    for (let y = 0; y < Math.min(lines.length, GRID_HEIGHT); y++) {
      const line = lines[y];
      for (let x = 0; x < Math.min(line.length, GRID_WIDTH); x++) {
        const char = line[x];
        switch (char) {
          case 'B': this.grid[y][x] = TILE.BRICK; break;
          case 'S': this.grid[y][x] = TILE.SOLID; break;
          case 'H': this.grid[y][x] = TILE.LADDER; break;
          case 'R': this.grid[y][x] = TILE.ROPE; break;
          case '.': this.grid[y][x] = TILE.EMPTY; break;
        }
      }
    }
    
    // Add hidden ladder at top (exit) - will be revealed when all gold collected
    const exitX = Math.floor(GRID_WIDTH / 2);
    this.grid[0][exitX] = TILE.HIDDEN_LADDER;
    this.grid[1][exitX] = TILE.HIDDEN_LADDER;
    this.grid[2][exitX] = TILE.HIDDEN_LADDER;
    
    // Load gold positions (scale difficulty for higher levels)
    this.gold = [];
    const baseGold = design.gold || [];
    baseGold.forEach(g => {
      this.gold.push({x: g.x, y: g.y, collected: false, carriedBy: null});
    });
    
    // Add extra gold for levels beyond the designed ones
    if (this.levelNumber > LEVEL_DESIGNS.length) {
      const extraGold = (this.levelNumber - LEVEL_DESIGNS.length) * 2;
      for (let i = 0; i < extraGold; i++) {
        this.addRandomGold();
      }
    }
    
    // Store spawn positions
    this.playerStart = design.player || {x: 1, y: GRID_HEIGHT - 2};
    this.guardStarts = design.guards || [{x: GRID_WIDTH - 3, y: GRID_HEIGHT - 2}];
    
    // Add extra guards for higher levels
    if (this.levelNumber > LEVEL_DESIGNS.length) {
      const extraGuards = Math.floor((this.levelNumber - LEVEL_DESIGNS.length) / 2);
      for (let i = 0; i < extraGuards; i++) {
        this.guardStarts.push({
          x: 5 + Math.floor(Math.random() * (GRID_WIDTH - 10)),
          y: GRID_HEIGHT - 2
        });
      }
    }
  }
  
  addRandomGold() {
    let attempts = 0;
    while (attempts < 50) {
      const x = 2 + Math.floor(Math.random() * (GRID_WIDTH - 4));
      const y = 3 + Math.floor(Math.random() * (GRID_HEIGHT - 5));
      if (this.grid[y][x] === TILE.EMPTY) {
        // Check there's ground below
        if (this.grid[y + 1][x] === TILE.BRICK || this.grid[y + 1][x] === TILE.SOLID || this.grid[y + 1][x] === TILE.LADDER) {
          this.gold.push({x, y, collected: false, carriedBy: null});
          return;
        }
      }
      attempts++;
    }
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
    
    // Visual effects
    this.digEffects = []; // Digging animation effects
    
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
    
    // Use level's defined player start position
    this.player = new Player(
      this.currentLevel.playerStart.x,
      this.currentLevel.playerStart.y
    );
    
    // Create guards from level's defined positions
    this.guards = [];
    this.currentLevel.guardStarts.forEach(pos => {
      this.guards.push(new Guard(pos.x, pos.y));
    });
    
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
      
      // Handle digging with visual feedback
      if (this.keys.digLeft) {
        if (this.player.dig(this.currentLevel, -1)) {
          this.addDigEffect(Math.floor(this.player.x) - 1, Math.floor(this.player.y) + 1);
        }
        this.keys.digLeft = false;
      }
      if (this.keys.digRight) {
        if (this.player.dig(this.currentLevel, 1)) {
          this.addDigEffect(Math.floor(this.player.x) + 1, Math.floor(this.player.y) + 1);
        }
        this.keys.digRight = false;
      }
      
      // Update dig effects
      this.digEffects = this.digEffects.filter(e => {
        e.frame++;
        return e.frame < 15;
      });
      
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
      // Reset positions to level's defined spawn points
      this.player.x = this.currentLevel.playerStart.x;
      this.player.y = this.currentLevel.playerStart.y;
      this.guards.forEach((guard, i) => {
        if (i < this.currentLevel.guardStarts.length) {
          guard.x = this.currentLevel.guardStarts[i].x;
          guard.y = this.currentLevel.guardStarts[i].y;
        }
        guard.stuck = false;
        guard.stuckTimer = 0;
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
  
  addDigEffect(x, y) {
    // Create particles for dig effect
    for (let i = 0; i < 6; i++) {
      this.digEffects.push({
        x: x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 10,
        y: y * TILE_SIZE + TILE_SIZE / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        frame: 0
      });
    }
  }
  
  drawDigEffects() {
    this.digEffects.forEach(e => {
      // Update position
      e.x += e.vx;
      e.y += e.vy;
      e.vy += 0.2; // Gravity
      
      // Draw particle
      const alpha = 1 - e.frame / 15;
      this.ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
      this.ctx.fillRect(e.x - 2, e.y - 2, 4, 4);
    });
  }
  
  drawCharacter(x, y, color, onRope) {
    this.ctx.strokeStyle = color;
    this.ctx.fillStyle = color;
    this.ctx.lineWidth = 2;
    
    // Head
    this.ctx.beginPath();
    this.ctx.arc(x, y - 8, 5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Body
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - 3);
    this.ctx.lineTo(x, y + 6);
    this.ctx.stroke();
    
    // Arms
    this.ctx.beginPath();
    if (onRope) {
      // Arms up when on rope
      this.ctx.moveTo(x - 8, y - 6);
      this.ctx.lineTo(x, y);
      this.ctx.lineTo(x + 8, y - 6);
    } else {
      // Arms down normally
      this.ctx.moveTo(x - 7, y + 4);
      this.ctx.lineTo(x, y);
      this.ctx.lineTo(x + 7, y + 4);
    }
    this.ctx.stroke();
    
    // Legs
    this.ctx.beginPath();
    this.ctx.moveTo(x - 6, y + 12);
    this.ctx.lineTo(x, y + 6);
    this.ctx.lineTo(x + 6, y + 12);
    this.ctx.stroke();
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
    
    // Draw gold (only if not being carried by a guard)
    this.currentLevel.gold.forEach(gold => {
      if (!gold.collected && !gold.carriedBy) {
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
    
    // Draw player (stick figure style)
    this.drawCharacter(
      this.player.x * TILE_SIZE + TILE_SIZE / 2,
      this.player.y * TILE_SIZE + TILE_SIZE / 2,
      COLORS.PLAYER,
      this.player.onRope
    );
    
    // Draw guards
    this.guards.forEach(guard => {
      const color = guard.stuck ? '#880000' : COLORS.GUARD;
      this.drawCharacter(
        guard.x * TILE_SIZE + TILE_SIZE / 2,
        guard.y * TILE_SIZE + TILE_SIZE / 2,
        color,
        false
      );
      
      // Draw gold indicator if guard is carrying gold
      if (guard.carriedGold) {
        this.ctx.fillStyle = COLORS.GOLD;
        this.ctx.beginPath();
        this.ctx.arc(
          guard.x * TILE_SIZE + TILE_SIZE / 2,
          guard.y * TILE_SIZE + 6,
          4,
          0,
          Math.PI * 2
        );
        this.ctx.fill();
      }
    });
    
    // Draw dig effects (particles)
    this.drawDigEffects();
    
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
