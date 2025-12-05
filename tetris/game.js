// Classic Tetris Game Engine
// Built for Helix Games with performance in mind

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
  null,
  '#3cd2a5', // Cyan (Helix primary) - I piece
  '#5ddbb5', // Light cyan - O piece
  '#2ab88c', // Dark cyan - T piece
  '#4ae6b8', // Bright cyan - S piece
  '#29d4a0', // Mid cyan - Z piece
  '#1fa37a', // Deep cyan - J piece
  '#6be8c8', // Pale cyan - L piece
];

// Tetromino shapes
const SHAPES = [
  [], // Empty
  [[1,1,1,1]], // I
  [[2,2],[2,2]], // O
  [[0,3,0],[3,3,3]], // T
  [[0,4,4],[4,4,0]], // S
  [[5,5,0],[0,5,5]], // Z
  [[6,0,0],[6,6,6]], // J
  [[0,0,7],[7,7,7]], // L
];

class Tetris {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = COLS * BLOCK_SIZE;
    this.canvas.height = ROWS * BLOCK_SIZE;
    
    this.grid = this.createGrid();
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.dropCounter = 0;
    this.dropInterval = 1000;
    this.lastTime = 0;
    
    this.setupControls();
    this.spawnPiece();
    this.spawnNextPiece();
  }
  
  createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }
  
  spawnPiece() {
    if (this.nextPiece) {
      this.currentPiece = this.nextPiece;
    } else {
      const type = Math.floor(Math.random() * 7) + 1;
      this.currentPiece = {
        shape: SHAPES[type],
        type: type,
        x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
        y: 0
      };
    }
    
    if (this.collides()) {
      this.gameOver = true;
    }
  }
  
  spawnNextPiece() {
    const type = Math.floor(Math.random() * 7) + 1;
    this.nextPiece = {
      shape: SHAPES[type],
      type: type,
      x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
      y: 0
    };
  }
  
  collides(offsetX = 0, offsetY = 0, shape = this.currentPiece.shape) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = this.currentPiece.x + x + offsetX;
          const newY = this.currentPiece.y + y + offsetY;
          
          if (newX < 0 || newX >= COLS || newY >= ROWS) {
            return true;
          }
          
          if (newY >= 0 && this.grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }
  
  merge() {
    this.currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const gridY = this.currentPiece.y + y;
          const gridX = this.currentPiece.x + x;
          if (gridY >= 0) {
            this.grid[gridY][gridX] = value;
          }
        }
      });
    });
  }
  
  rotate() {
    const rotated = this.currentPiece.shape[0].map((_, i) =>
      this.currentPiece.shape.map(row => row[i]).reverse()
    );
    
    if (!this.collides(0, 0, rotated)) {
      this.currentPiece.shape = rotated;
    }
  }
  
  move(dir) {
    if (!this.collides(dir, 0)) {
      this.currentPiece.x += dir;
    }
  }
  
  drop() {
    if (!this.collides(0, 1)) {
      this.currentPiece.y++;
      this.dropCounter = 0;
      return true;
    } else {
      this.merge();
      this.clearLines();
      this.spawnPiece();
      this.spawnNextPiece();
      return false;
    }
  }
  
  hardDrop() {
    while (this.drop()) {}
  }
  
  clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell !== 0)) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array(COLS).fill(0));
        linesCleared++;
        y++;
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      const points = [0, 100, 300, 500, 800];
      this.score += points[linesCleared] * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      this.updateStats();
    }
  }
  
  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    this.drawGrid();
    
    // Draw current piece
    this.drawPiece(this.currentPiece);
    
    // Draw game over
    if (this.gameOver) {
      this.drawGameOver();
    }
    
    // Draw pause
    if (this.isPaused && !this.gameOver) {
      this.drawPause();
    }
  }
  
  drawGrid() {
    this.grid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          this.ctx.fillStyle = COLORS[value];
          this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          this.ctx.strokeStyle = '#0a0e10';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });
  }
  
  drawPiece(piece) {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const drawX = (piece.x + x) * BLOCK_SIZE;
          const drawY = (piece.y + y) * BLOCK_SIZE;
          this.ctx.fillStyle = COLORS[value];
          this.ctx.fillRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
          this.ctx.strokeStyle = '#0a0e10';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(drawX, drawY, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });
  }
  
  drawNextPiece() {
    const nextCanvas = document.getElementById('next-piece');
    if (!nextCanvas) return;
    
    const ctx = nextCanvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    const offsetX = (4 - this.nextPiece.shape[0].length) * BLOCK_SIZE / 2;
    const offsetY = (4 - this.nextPiece.shape.length) * BLOCK_SIZE / 2;
    
    this.nextPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          ctx.fillStyle = COLORS[value];
          ctx.fillRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
          ctx.strokeStyle = '#0a0e10';
          ctx.lineWidth = 2;
          ctx.strokeRect(offsetX + x * BLOCK_SIZE, offsetY + y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        }
      });
    });
  }
  
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#3cd2a5';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
    
    this.ctx.font = '18px Arial';
    this.ctx.fillText('Press R to restart', this.canvas.width / 2, this.canvas.height / 2 + 20);
  }
  
  drawPause() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#3cd2a5';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
  }
  
  updateStats() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('lines').textContent = this.lines;
    document.getElementById('level').textContent = this.level;
  }
  
  setupControls() {
    document.addEventListener('keydown', (e) => {
      if (this.gameOver) {
        if (e.key === 'r' || e.key === 'R') {
          this.restart();
        }
        return;
      }
      
      if (this.isPaused && e.key !== 'p' && e.key !== 'P') {
        return;
      }
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.move(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.move(1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.drop();
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          this.rotate();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          this.togglePause();
          break;
      }
      this.draw();
      this.drawNextPiece();
    });
  }
  
  togglePause() {
    this.isPaused = !this.isPaused;
  }
  
  restart() {
    this.grid = this.createGrid();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.dropInterval = 1000;
    this.updateStats();
    this.spawnPiece();
    this.spawnNextPiece();
  }
  
  update(time = 0) {
    if (this.gameOver || this.isPaused) {
      requestAnimationFrame(this.update.bind(this));
      return;
    }
    
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += deltaTime;
    
    if (this.dropCounter > this.dropInterval) {
      this.drop();
    }
    
    this.draw();
    this.drawNextPiece();
    requestAnimationFrame(this.update.bind(this));
  }
  
  start() {
    this.updateStats();
    this.update();
  }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
  game = new Tetris('tetris-canvas');
  game.start();
});
