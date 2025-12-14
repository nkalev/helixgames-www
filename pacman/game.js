// Classic Pac-Man Game Engine
// Built for Helix Games with performance optimization

const TILE_SIZE = 20;
const MAZE_WIDTH = 28;
const MAZE_HEIGHT = 31;

// Game states
const STATE_READY = 'ready';
const STATE_PLAYING = 'playing';
const STATE_DYING = 'dying';
const STATE_GAME_OVER = 'gameover';
const STATE_LEVEL_COMPLETE = 'levelcomplete';

// Classic Pac-Man maze (1 = wall, 0 = path, 2 = pellet, 3 = power pellet)
const MAZE_LAYOUT = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,0,0,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0],
  [1,1,1,1,1,1,2,1,1,0,1,0,0,0,0,0,0,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

class PacMan {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 };
    this.speed = 2;
    this.mouthOpen = 0;
    this.mouthDirection = 1;
  }
  
  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.direction = { x: 0, y: 0 };
    this.nextDirection = { x: 0, y: 0 };
  }
  
  update(maze) {
    // Animate mouth only when moving
    if (this.direction.x !== 0 || this.direction.y !== 0) {
      this.mouthOpen += this.mouthDirection * 0.15;
      if (this.mouthOpen > 0.8 || this.mouthOpen < 0) {
        this.mouthDirection *= -1;
      }
    } else {
      // Mouth closed when stationary
      this.mouthOpen = 0;
    }
    
    // Try to change direction
    if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
      // Test if we can move in the requested direction
      const testX = this.x + this.nextDirection.x * this.speed;
      const testY = this.y + this.nextDirection.y * this.speed;
      
      if (this.canMove(testX, testY, maze)) {
        this.direction = { ...this.nextDirection };
      }
    }
    
    // Move in current direction
    const nextX = this.x + this.direction.x * this.speed;
    const nextY = this.y + this.direction.y * this.speed;
    
    if (this.canMove(nextX, nextY, maze)) {
      this.x = nextX;
      this.y = nextY;
    }
    // Else: Stop at wall edge (no movement)
    
    // Wrap around tunnel (keep centered in tile)
    if (this.x < TILE_SIZE / 2) this.x = MAZE_WIDTH * TILE_SIZE - TILE_SIZE / 2;
    if (this.x > MAZE_WIDTH * TILE_SIZE - TILE_SIZE / 2) this.x = TILE_SIZE / 2;
  }
  
  canMove(x, y, maze) {
    // Pac-Man radius (sprite is drawn with TILE_SIZE/2 - 2 radius)
    const radius = TILE_SIZE / 2 - 2;
    
    // Check all four corners of Pac-Man's bounding box
    const corners = [
      { x: x - radius, y: y - radius }, // top-left
      { x: x + radius, y: y - radius }, // top-right
      { x: x - radius, y: y + radius }, // bottom-left
      { x: x + radius, y: y + radius }  // bottom-right
    ];
    
    for (const corner of corners) {
      const gridX = Math.floor(corner.x / TILE_SIZE);
      const gridY = Math.floor(corner.y / TILE_SIZE);
      
      // Allow tunnel on row 14
      if (gridX < 0 || gridX >= MAZE_WIDTH) {
        if (Math.floor(y / TILE_SIZE) === 14) continue;
        return false;
      }
      if (gridY < 0 || gridY >= MAZE_HEIGHT) {
        return false;
      }
      
      // Check if this corner is in a wall tile
      if (maze[gridY][gridX] === 1) {
        return false;
      }
    }
    
    return true;
  }
  
  getTilePos() {
    // Get tile from center position
    return {
      x: Math.round((this.x - TILE_SIZE / 2) / TILE_SIZE),
      y: Math.round((this.y - TILE_SIZE / 2) / TILE_SIZE)
    };
  }
}

// Ghost house center position
const GHOST_HOUSE_X = 14 * TILE_SIZE;
const GHOST_HOUSE_Y = 14 * TILE_SIZE;

class Ghost {
  constructor(x, y, color, name) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.color = color;
    this.name = name;
    this.direction = { x: 0, y: -1 };
    this.speed = 1.5;
    this.mode = 'scatter'; // scatter, chase, frightened, eaten
    this.frightenedTimer = 0;
  }
  
  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.direction = { x: 0, y: -1 };
    this.mode = 'scatter';
    this.frightenedTimer = 0;
  }
  
  setFrightened() {
    if (this.mode !== 'eaten') {
      this.mode = 'frightened';
      this.frightenedTimer = 300; // 5 seconds at 60fps
      this.direction.x *= -1;
      this.direction.y *= -1;
    }
  }
  
  setEaten() {
    this.mode = 'eaten';
    this.frightenedTimer = 0;
  }
  
  update(maze, pacman) {
    // Handle eaten mode - eyes return to ghost house
    if (this.mode === 'eaten') {
      const distToHouse = Math.sqrt(
        Math.pow(this.x - GHOST_HOUSE_X, 2) + 
        Math.pow(this.y - GHOST_HOUSE_Y, 2)
      );
      
      if (distToHouse < TILE_SIZE) {
        // Arrived at ghost house, respawn
        this.x = this.startX;
        this.y = this.startY;
        this.mode = 'scatter';
        return;
      }
      
      // Move towards ghost house (fast)
      const dx = GHOST_HOUSE_X - this.x;
      const dy = GHOST_HOUSE_Y - this.y;
      const eatenSpeed = this.speed * 3;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = { x: dx > 0 ? 1 : -1, y: 0 };
      } else {
        this.direction = { x: 0, y: dy > 0 ? 1 : -1 };
      }
      
      this.x += this.direction.x * eatenSpeed;
      this.y += this.direction.y * eatenSpeed;
      return;
    }
    
    if (this.frightenedTimer > 0) {
      this.frightenedTimer--;
      if (this.frightenedTimer === 0) {
        this.mode = 'chase';
      }
    }
    
    // Simple AI: move towards Pac-Man or scatter
    if (Math.random() < 0.05) { // 5% chance to choose new direction
      const possibleDirs = [];
      const dirs = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 }
      ];
      
      for (let dir of dirs) {
        // Don't reverse
        if (dir.x === -this.direction.x && dir.y === -this.direction.y) continue;
        
        if (this.canMove(this.x + dir.x * this.speed * 2, this.y + dir.y * this.speed * 2, maze)) {
          possibleDirs.push(dir);
        }
      }
      
      if (possibleDirs.length > 0) {
        if (this.mode === 'frightened') {
          // Random movement when frightened
          this.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        } else {
          // Chase Pac-Man
          const target = this.mode === 'chase' ? pacman.getTilePos() : { x: 0, y: 0 };
          let bestDir = possibleDirs[0];
          let bestDist = 999999;
          
          for (let dir of possibleDirs) {
            const nextX = Math.floor((this.x + dir.x * TILE_SIZE) / TILE_SIZE);
            const nextY = Math.floor((this.y + dir.y * TILE_SIZE) / TILE_SIZE);
            const dist = Math.abs(nextX - target.x) + Math.abs(nextY - target.y);
            
            if (dist < bestDist) {
              bestDist = dist;
              bestDir = dir;
            }
          }
          
          this.direction = bestDir;
        }
      }
    }
    
    // Move (slower when frightened)
    const currentSpeed = this.mode === 'frightened' ? this.speed * 0.5 : this.speed;
    if (this.canMove(this.x + this.direction.x * currentSpeed, this.y + this.direction.y * currentSpeed, maze)) {
      this.x += this.direction.x * currentSpeed;
      this.y += this.direction.y * currentSpeed;
    }
    
    // Wrap around tunnel (keep centered in tile)
    if (this.x < TILE_SIZE / 2) this.x = MAZE_WIDTH * TILE_SIZE - TILE_SIZE / 2;
    if (this.x > MAZE_WIDTH * TILE_SIZE - TILE_SIZE / 2) this.x = TILE_SIZE / 2;
  }
  
  canMove(x, y, maze) {
    // Ghost radius (similar to Pac-Man)
    const radius = TILE_SIZE / 2 - 2;
    
    // Check all four corners of ghost's bounding box
    const corners = [
      { x: x - radius, y: y - radius },
      { x: x + radius, y: y - radius },
      { x: x - radius, y: y + radius },
      { x: x + radius, y: y + radius }
    ];
    
    for (const corner of corners) {
      const gridX = Math.floor(corner.x / TILE_SIZE);
      const gridY = Math.floor(corner.y / TILE_SIZE);
      
      // Allow tunnel on row 14
      if (gridX < 0 || gridX >= MAZE_WIDTH) {
        if (Math.floor(y / TILE_SIZE) === 14) continue;
        return false;
      }
      if (gridY < 0 || gridY >= MAZE_HEIGHT) {
        return false;
      }
      
      if (maze[gridY][gridX] === 1) {
        return false;
      }
    }
    
    return true;
  }
  
  getTilePos() {
    // Get tile from center position
    return {
      x: Math.floor(this.x / TILE_SIZE),
      y: Math.floor(this.y / TILE_SIZE)
    };
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('pacman-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = MAZE_WIDTH * TILE_SIZE;
    this.canvas.height = MAZE_HEIGHT * TILE_SIZE;
    
    this.maze = JSON.parse(JSON.stringify(MAZE_LAYOUT)); // Deep copy
    // Center Pac-Man and ghosts in their tiles
    this.pacman = new PacMan(14 * TILE_SIZE + TILE_SIZE / 2, 23 * TILE_SIZE + TILE_SIZE / 2);
    this.ghosts = [
      new Ghost(12 * TILE_SIZE + TILE_SIZE / 2, 14 * TILE_SIZE + TILE_SIZE / 2, '#FF0000', 'Blinky'),
      new Ghost(14 * TILE_SIZE + TILE_SIZE / 2, 14 * TILE_SIZE + TILE_SIZE / 2, '#FFB8FF', 'Pinky'),
      new Ghost(13 * TILE_SIZE + TILE_SIZE / 2, 14 * TILE_SIZE + TILE_SIZE / 2, '#00FFFF', 'Inky'),
      new Ghost(15 * TILE_SIZE + TILE_SIZE / 2, 14 * TILE_SIZE + TILE_SIZE / 2, '#FFB852', 'Clyde')
    ];
    
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.pelletsRemaining = this.countPellets();
    this.state = STATE_READY;
    this.stateTimer = 0;
    this.powerPelletActive = false;
    this.powerPelletTimer = 0;
    this.frameCount = 0; // For animations like power pellet blinking
    this.pauseFrames = 0; // Pause when eating dots
    
    // Fruit system
    this.fruit = null;
    this.fruitTimer = 0;
    this.dotsEaten = 0;
    this.fruitTypes = [
      { name: 'cherry', color: '#FF0000', points: 100 },
      { name: 'strawberry', color: '#FF6B6B', points: 300 },
      { name: 'orange', color: '#FFA500', points: 500 },
      { name: 'apple', color: '#00FF00', points: 700 },
      { name: 'melon', color: '#90EE90', points: 1000 },
      { name: 'galaxian', color: '#00BFFF', points: 2000 },
      { name: 'bell', color: '#FFD700', points: 3000 },
      { name: 'key', color: '#C0C0C0', points: 5000 }
    ];
    
    this.setupControls();
  }
  
  countPellets() {
    let count = 0;
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (this.maze[y][x] === 2 || this.maze[y][x] === 3) {
          count++;
        }
      }
    }
    return count;
  }
  
  setupControls() {
    document.addEventListener('keydown', (e) => {
      if (this.state === STATE_READY) {
        this.state = STATE_PLAYING;
      }
      
      if (this.state === STATE_GAME_OVER && e.key === 'r') {
        this.restart();
        return;
      }
      
      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          this.pacman.nextDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.pacman.nextDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.pacman.nextDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.pacman.nextDirection = { x: 1, y: 0 };
          break;
      }
    });
  }
  
  update() {
    if (this.state === STATE_READY) {
      this.stateTimer++;
      return;
    }
    
    if (this.state === STATE_DYING) {
      this.stateTimer++;
      if (this.stateTimer > 60) {
        this.lives--;
        if (this.lives <= 0) {
          this.state = STATE_GAME_OVER;
          this.submitScore();
        } else {
          this.resetPositions();
          this.state = STATE_READY;
          this.stateTimer = 0;
        }
      }
      return;
    }
    
    if (this.state === STATE_LEVEL_COMPLETE) {
      this.stateTimer++;
      if (this.stateTimer > 120) {
        this.nextLevel();
      }
      return;
    }
    
    if (this.state !== STATE_PLAYING) return;
    
    // Increment frame counter for animations
    this.frameCount++;
    
    // Handle pause frames (1-frame pause when eating dots)
    if (this.pauseFrames > 0) {
      this.pauseFrames--;
      return;
    }
    
    // Update power pellet timer
    if (this.powerPelletTimer > 0) {
      this.powerPelletTimer--;
      if (this.powerPelletTimer === 0) {
        this.powerPelletActive = false;
      }
    }
    
    // Update Pac-Man
    this.pacman.update(this.maze);
    
    // Check pellet collection
    const pacTile = this.pacman.getTilePos();
    if (this.maze[pacTile.y] && this.maze[pacTile.y][pacTile.x] === 2) {
      this.maze[pacTile.y][pacTile.x] = 0;
      this.score += 10;
      this.pelletsRemaining--;
      this.dotsEaten++;
      this.pauseFrames = 1; // 1-frame pause when eating dot
      this.updateStats();
      
      // Spawn fruit at 70 and 170 dots eaten
      if ((this.dotsEaten === 70 || this.dotsEaten === 170) && !this.fruit) {
        this.spawnFruit();
      }
    } else if (this.maze[pacTile.y] && this.maze[pacTile.y][pacTile.x] === 3) {
      this.maze[pacTile.y][pacTile.x] = 0;
      this.score += 50;
      this.pelletsRemaining--;
      this.dotsEaten++;
      this.pauseFrames = 3; // Slightly longer pause for power pellet
      this.powerPelletActive = true;
      this.powerPelletTimer = 300;
      this.ghosts.forEach(ghost => ghost.setFrightened());
      this.updateStats();
    }
    
    // Update fruit timer
    if (this.fruit) {
      this.fruitTimer--;
      if (this.fruitTimer <= 0) {
        this.fruit = null;
      }
      
      // Check fruit collection
      const fruitTileX = 14;
      const fruitTileY = 17;
      if (pacTile.x === fruitTileX && pacTile.y === fruitTileY) {
        this.score += this.fruit.points;
        this.fruit = null;
        this.updateStats();
      }
    }
    
    // Check level complete
    if (this.pelletsRemaining === 0) {
      this.state = STATE_LEVEL_COMPLETE;
      this.stateTimer = 0;
      return;
    }
    
    // Update ghosts
    this.ghosts.forEach(ghost => {
      ghost.update(this.maze, this.pacman);
      
      // Check collision
      const dist = Math.sqrt(
        Math.pow(ghost.x - this.pacman.x, 2) + 
        Math.pow(ghost.y - this.pacman.y, 2)
      );
      
      if (dist < TILE_SIZE) {
        if (ghost.mode === 'frightened') {
          // Eat ghost - eyes float back to house
          this.score += 200;
          ghost.setEaten();
          this.updateStats();
        } else if (ghost.mode !== 'eaten') {
          // Pac-Man dies (but not if ghost is just eyes)
          this.state = STATE_DYING;
          this.stateTimer = 0;
        }
      }
    });
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw maze
    this.drawMaze();
    
    // Draw pellets
    this.drawPellets();
    
    // Draw fruit
    this.drawFruit();
    
    // Draw ghosts
    if (this.state !== STATE_DYING) {
      this.ghosts.forEach(ghost => this.drawGhost(ghost));
    }
    
    // Draw Pac-Man
    if (this.state !== STATE_GAME_OVER) {
      this.drawPacman();
    }
    
    // Draw messages
    if (this.state === STATE_READY) {
      this.drawCenteredText('READY!', this.canvas.height / 2, '24px', '#3cd2a5');
    } else if (this.state === STATE_GAME_OVER) {
      this.drawCenteredText('GAME OVER', this.canvas.height / 2 - 20, '32px', '#3cd2a5');
      this.drawCenteredText('Press R to restart', this.canvas.height / 2 + 20, '18px', '#3cd2a5');
    } else if (this.state === STATE_LEVEL_COMPLETE) {
      this.drawCenteredText('LEVEL COMPLETE!', this.canvas.height / 2, '24px', '#3cd2a5');
    }
  }
  
  drawMaze() {
    this.ctx.strokeStyle = '#3cd2a5';
    this.ctx.lineWidth = 2;
    
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (this.maze[y][x] === 1) {
          this.ctx.strokeRect(x * TILE_SIZE + 1, y * TILE_SIZE + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }
  }
  
  drawPellets() {
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (this.maze[y][x] === 2) {
          this.ctx.fillStyle = '#FFB852';
          this.ctx.beginPath();
          this.ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 2, 0, Math.PI * 2);
          this.ctx.fill();
        } else if (this.maze[y][x] === 3) {
          // Power pellets blink (alternate every 10 frames)
          const blinkOn = Math.floor(this.frameCount / 10) % 2 === 0;
          this.ctx.fillStyle = blinkOn ? '#3cd2a5' : '#1a5c4a';
          this.ctx.beginPath();
          this.ctx.arc(x * TILE_SIZE + TILE_SIZE / 2, y * TILE_SIZE + TILE_SIZE / 2, 5, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }
  
  drawPacman() {
    const angle = Math.atan2(this.pacman.direction.y, this.pacman.direction.x);
    const mouthAngle = this.pacman.mouthOpen * Math.PI / 4;
    
    this.ctx.fillStyle = '#FFFF00';
    this.ctx.beginPath();
    this.ctx.arc(this.pacman.x, this.pacman.y, TILE_SIZE / 2 - 2, angle + mouthAngle, angle + Math.PI * 2 - mouthAngle);
    this.ctx.lineTo(this.pacman.x, this.pacman.y);
    this.ctx.fill();
  }
  
  drawGhost(ghost) {
    // Eaten mode - only draw eyes floating back to house
    if (ghost.mode === 'eaten') {
      // Eye whites
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(ghost.x - 6, ghost.y - 4, 5, 7);
      this.ctx.fillRect(ghost.x + 1, ghost.y - 4, 5, 7);
      
      // Pupils - offset based on travel direction
      const pupilOffsetX = ghost.direction.x * 2;
      const pupilOffsetY = ghost.direction.y * 2;
      this.ctx.fillStyle = '#0000FF';
      this.ctx.fillRect(ghost.x - 5 + pupilOffsetX, ghost.y - 1 + pupilOffsetY, 2, 3);
      this.ctx.fillRect(ghost.x + 3 + pupilOffsetX, ghost.y - 1 + pupilOffsetY, 2, 3);
      return;
    }
    
    const color = ghost.mode === 'frightened' ? '#5ddbb5' : ghost.color;
    this.ctx.fillStyle = color;
    
    // Body
    this.ctx.beginPath();
    this.ctx.arc(ghost.x, ghost.y - TILE_SIZE / 4, TILE_SIZE / 2 - 2, Math.PI, 0);
    this.ctx.rect(ghost.x - TILE_SIZE / 2 + 2, ghost.y - TILE_SIZE / 4, TILE_SIZE - 4, TILE_SIZE / 2);
    this.ctx.fill();
    
    // Wave bottom
    for (let i = 0; i < 3; i++) {
      this.ctx.beginPath();
      this.ctx.arc(ghost.x - TILE_SIZE / 3 + i * TILE_SIZE / 3, ghost.y + TILE_SIZE / 4, TILE_SIZE / 6, 0, Math.PI);
      this.ctx.fill();
    }
    
    // Eyes
    if (ghost.mode !== 'frightened') {
      // Eye whites
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(ghost.x - 6, ghost.y - 8, 5, 7);
      this.ctx.fillRect(ghost.x + 1, ghost.y - 8, 5, 7);
      
      // Pupils - offset based on travel direction
      const pupilOffsetX = ghost.direction.x * 2;
      const pupilOffsetY = ghost.direction.y * 2;
      this.ctx.fillStyle = '#0000FF';
      this.ctx.fillRect(ghost.x - 5 + pupilOffsetX, ghost.y - 5 + pupilOffsetY, 2, 3);
      this.ctx.fillRect(ghost.x + 3 + pupilOffsetX, ghost.y - 5 + pupilOffsetY, 2, 3);
    } else {
      // Frightened mode - bulging worried eyes
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.beginPath();
      this.ctx.arc(ghost.x - 4, ghost.y - 4, 3, 0, Math.PI * 2);
      this.ctx.arc(ghost.x + 4, ghost.y - 4, 3, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.fillStyle = '#FF0000';
      this.ctx.beginPath();
      this.ctx.arc(ghost.x - 4, ghost.y - 4, 1.5, 0, Math.PI * 2);
      this.ctx.arc(ghost.x + 4, ghost.y - 4, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
  
  spawnFruit() {
    // Get fruit type based on level (capped at 8 types)
    const fruitIndex = Math.min(this.level - 1, this.fruitTypes.length - 1);
    this.fruit = this.fruitTypes[fruitIndex];
    this.fruitTimer = 600; // 10 seconds at 60fps
  }
  
  drawFruit() {
    if (!this.fruit) return;
    
    const fruitX = 14 * TILE_SIZE + TILE_SIZE / 2;
    const fruitY = 17 * TILE_SIZE + TILE_SIZE / 2;
    
    this.ctx.fillStyle = this.fruit.color;
    
    // Draw different fruit shapes based on type
    switch (this.fruit.name) {
      case 'cherry':
        // Two circles with stem
        this.ctx.beginPath();
        this.ctx.arc(fruitX - 3, fruitY + 2, 4, 0, Math.PI * 2);
        this.ctx.arc(fruitX + 3, fruitY + 2, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#00AA00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(fruitX - 3, fruitY - 2);
        this.ctx.lineTo(fruitX, fruitY - 6);
        this.ctx.lineTo(fruitX + 3, fruitY - 2);
        this.ctx.stroke();
        break;
      case 'strawberry':
        // Triangle-ish shape
        this.ctx.beginPath();
        this.ctx.moveTo(fruitX, fruitY - 5);
        this.ctx.lineTo(fruitX + 5, fruitY + 5);
        this.ctx.lineTo(fruitX - 5, fruitY + 5);
        this.ctx.closePath();
        this.ctx.fill();
        break;
      default:
        // Generic circle for other fruits
        this.ctx.beginPath();
        this.ctx.arc(fruitX, fruitY, 6, 0, Math.PI * 2);
        this.ctx.fill();
        break;
    }
  }
  
  drawCenteredText(text, y, fontSize, color) {
    this.ctx.fillStyle = color;
    this.ctx.font = `bold ${fontSize} Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(text, this.canvas.width / 2, y);
  }
  
  updateStats() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('level').textContent = this.level;
    
    // Display lives as Pac-Man icons
    const livesContainer = document.getElementById('lives-container');
    livesContainer.innerHTML = '';
    for (let i = 0; i < this.lives; i++) {
      const pacIcon = document.createElement('span');
      pacIcon.className = 'pac-life-icon';
      pacIcon.innerHTML = '&#9679;'; // Circle that we'll style as Pac-Man
      livesContainer.appendChild(pacIcon);
    }
  }
  
  resetPositions() {
    this.pacman.reset();
    this.ghosts.forEach(ghost => ghost.reset());
    this.powerPelletActive = false;
    this.powerPelletTimer = 0;
  }
  
  nextLevel() {
    this.level++;
    this.maze = JSON.parse(JSON.stringify(MAZE_LAYOUT));
    this.pelletsRemaining = this.countPellets();
    this.dotsEaten = 0;
    this.fruit = null;
    this.resetPositions();
    this.ghosts.forEach(ghost => ghost.speed += 0.2);
    this.state = STATE_READY;
    this.stateTimer = 0;
    this.updateStats();
  }
  
  restart() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.maze = JSON.parse(JSON.stringify(MAZE_LAYOUT));
    this.pelletsRemaining = this.countPellets();
    this.dotsEaten = 0;
    this.fruit = null;
    this.resetPositions();
    this.ghosts.forEach(ghost => ghost.speed = 1.5);
    this.state = STATE_READY;
    this.stateTimer = 0;
    this.updateStats();
  }
  
  submitScore() {
    // Check if auth system is available and user is logged in
    if (typeof window.helixAuth !== 'undefined' && window.helixAuth.isLoggedIn()) {
      const result = window.helixAuth.submitScore('pacman', this.score, this.level);
      
      if (result.success && result.isPersonalBest) {
        // Show personal best notification
        setTimeout(() => {
          console.log('🎉 New Personal Best!', this.score);
        }, 100);
      }
    }
  }
  
  run() {
    this.update();
    this.draw();
    requestAnimationFrame(() => this.run());
  }
}

// Initialize game
let game;
window.addEventListener('DOMContentLoaded', () => {
  game = new Game();
  game.updateStats();
  game.run();
});
