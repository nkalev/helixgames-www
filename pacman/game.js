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
    // Animate mouth
    this.mouthOpen += this.mouthDirection * 0.15;
    if (this.mouthOpen > 0.8 || this.mouthOpen < 0) {
      this.mouthDirection *= -1;
    }
    
    // Try to change direction
    if (this.nextDirection.x !== 0 || this.nextDirection.y !== 0) {
      if (this.canMove(this.x + this.nextDirection.x * this.speed, this.y + this.nextDirection.y * this.speed, maze)) {
        this.direction = { ...this.nextDirection };
      }
    }
    
    // Move in current direction
    if (this.canMove(this.x + this.direction.x * this.speed, this.y + this.direction.y * this.speed, maze)) {
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;
    }
    
    // Wrap around tunnel (keep centered in tile)
    if (this.x < TILE_SIZE / 2) this.x = MAZE_WIDTH * TILE_SIZE - TILE_SIZE / 2;
    if (this.x > MAZE_WIDTH * TILE_SIZE - TILE_SIZE / 2) this.x = TILE_SIZE / 2;
  }
  
  canMove(x, y, maze) {
    // Simple approach: just check the center tile
    // Characters are 8px radius, tiles are 20px, so they fit with margin
    const gridX = Math.floor((x - TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.floor((y - TILE_SIZE / 2) / TILE_SIZE);
    
    // Allow tunnel on row 14
    if (gridX < 0 || gridX >= MAZE_WIDTH || gridY < 0 || gridY >= MAZE_HEIGHT) {
      return gridY === 14;
    }
    
    // Simply check if the center is in a wall tile
    return maze[gridY][gridX] !== 1;
  }
  
  getTilePos() {
    // Characters are centered at (tile * SIZE + SIZE/2), so subtract offset first
    return {
      x: Math.round((this.x - TILE_SIZE / 2) / TILE_SIZE),
      y: Math.round((this.y - TILE_SIZE / 2) / TILE_SIZE)
    };
  }
}

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
    this.mode = 'scatter'; // scatter, chase, frightened
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
    this.mode = 'frightened';
    this.frightenedTimer = 300; // 5 seconds at 60fps
    this.direction.x *= -1;
    this.direction.y *= -1;
  }
  
  update(maze, pacman) {
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
    
    // Move
    if (this.canMove(this.x + this.direction.x * this.speed, this.y + this.direction.y * this.speed, maze)) {
      this.x += this.direction.x * this.speed;
      this.y += this.direction.y * this.speed;
    }
    
    // Wrap around tunnel (keep centered in tile)
    if (this.x < TILE_SIZE / 2) this.x = MAZE_WIDTH * TILE_SIZE - TILE_SIZE / 2;
    if (this.x > MAZE_WIDTH * TILE_SIZE - TILE_SIZE / 2) this.x = TILE_SIZE / 2;
  }
  
  canMove(x, y, maze) {
    // Simple center-point collision (same as PacMan)
    const gridX = Math.floor((x - TILE_SIZE / 2) / TILE_SIZE);
    const gridY = Math.floor((y - TILE_SIZE / 2) / TILE_SIZE);
    
    if (gridX < 0 || gridX >= MAZE_WIDTH || gridY < 0 || gridY >= MAZE_HEIGHT) {
      return gridY === 14;
    }
    
    return maze[gridY][gridX] !== 1;
  }
  
  getTilePos() {
    return {
      x: Math.round((this.x - TILE_SIZE / 2) / TILE_SIZE),
      y: Math.round((this.y - TILE_SIZE / 2) / TILE_SIZE)
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
      this.updateStats();
    } else if (this.maze[pacTile.y] && this.maze[pacTile.y][pacTile.x] === 3) {
      this.maze[pacTile.y][pacTile.x] = 0;
      this.score += 50;
      this.pelletsRemaining--;
      this.powerPelletActive = true;
      this.powerPelletTimer = 300;
      this.ghosts.forEach(ghost => ghost.setFrightened());
      this.updateStats();
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
          // Eat ghost
          this.score += 200;
          ghost.x = ghost.startX;
          ghost.y = ghost.startY;
          ghost.mode = 'scatter';
          this.updateStats();
        } else {
          // Pac-Man dies
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
          this.ctx.fillStyle = '#3cd2a5';
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
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillRect(ghost.x - 6, ghost.y - 8, 4, 6);
      this.ctx.fillRect(ghost.x + 2, ghost.y - 8, 4, 6);
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(ghost.x - 5, ghost.y - 6, 2, 3);
      this.ctx.fillRect(ghost.x + 3, ghost.y - 6, 2, 3);
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
    document.getElementById('lives').textContent = this.lives;
    document.getElementById('level').textContent = this.level;
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
    this.resetPositions();
    this.ghosts.forEach(ghost => ghost.speed = 1.5);
    this.state = STATE_READY;
    this.stateTimer = 0;
    this.updateStats();
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
