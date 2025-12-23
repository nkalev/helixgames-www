// Pongr - A Breakout-style game with power-ups
// Helix Games

(function() {
    'use strict';

    // Canvas setup
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Game dimensions
    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 600;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Game state
    let gameState = 'start'; // 'start', 'playing', 'paused', 'gameover', 'levelcomplete'
    let score = 0;
    let lives = 3;
    let level = 1;
    
    // Paddle
    const paddle = {
        x: GAME_WIDTH / 2 - 50,
        y: GAME_HEIGHT - 30,
        width: 100,
        height: 15,
        speed: 8,
        baseWidth: 100,
        color: '#3cd2a5',
        hasLaser: false,
        laserTimer: 0
    };
    
    // Ball(s)
    let balls = [];
    const BALL_RADIUS = 8;
    const BALL_BASE_SPEED = 5;
    let ballSpeed = BALL_BASE_SPEED;
    
    // Bricks
    let bricks = [];
    const BRICK_ROWS = 6;
    const BRICK_COLS = 10;
    const BRICK_WIDTH = 70;
    const BRICK_HEIGHT = 25;
    const BRICK_PADDING = 5;
    const BRICK_OFFSET_TOP = 60;
    const BRICK_OFFSET_LEFT = (GAME_WIDTH - (BRICK_COLS * (BRICK_WIDTH + BRICK_PADDING) - BRICK_PADDING)) / 2;
    
    // Power-ups
    let powerups = [];
    const POWERUP_TYPES = [
        { type: 'expand', color: '#4CAF50', symbol: '⬌', effect: 'Expand paddle' },
        { type: 'shrink', color: '#f44336', symbol: '⬄', effect: 'Shrink paddle' },
        { type: 'multi', color: '#9C27B0', symbol: '✦', effect: 'Multi-ball' },
        { type: 'slow', color: '#2196F3', symbol: '▼', effect: 'Slow ball' },
        { type: 'fast', color: '#FF9800', symbol: '▲', effect: 'Fast ball' },
        { type: 'life', color: '#E91E63', symbol: '♥', effect: 'Extra life' },
        { type: 'laser', color: '#FFEB3B', symbol: '⚡', effect: 'Laser paddle' }
    ];
    const POWERUP_DROP_CHANCE = 0.25;
    const POWERUP_SPEED = 3;
    
    // Lasers
    let lasers = [];
    const LASER_SPEED = 10;
    let lastLaserTime = 0;
    const LASER_COOLDOWN = 200;
    
    // Brick colors by row (from top)
    const BRICK_COLORS = [
        '#ff4444', // Red
        '#ff8844', // Orange
        '#ffcc44', // Yellow
        '#44ff44', // Green
        '#4488ff', // Blue
        '#8844ff'  // Purple
    ];
    
    // Points by row (top rows worth more)
    const BRICK_POINTS = [50, 40, 30, 20, 15, 10];
    
    // Input state
    const keys = {
        left: false,
        right: false
    };
    let mouseX = GAME_WIDTH / 2;
    let useMouseControl = false;
    
    // Audio
    let audioCtx = null;
    
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    function playSound(type) {
        if (!audioCtx) return;
        
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        switch(type) {
            case 'paddle':
                oscillator.frequency.value = 440;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialDecayTo = 0.01;
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
                break;
            case 'brick':
                oscillator.frequency.value = 660;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.05);
                break;
            case 'wall':
                oscillator.frequency.value = 220;
                oscillator.type = 'triangle';
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.05);
                break;
            case 'powerup':
                oscillator.frequency.value = 880;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.15);
                break;
            case 'lose':
                oscillator.frequency.value = 200;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;
            case 'laser':
                oscillator.frequency.value = 1000;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(500, audioCtx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
                break;
            case 'levelup':
                oscillator.frequency.value = 440;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(550, audioCtx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.4);
                break;
        }
    }
    
    // Initialize game
    function init() {
        createBricks();
        resetBall();
        updateUI();
    }
    
    function createBricks() {
        bricks = [];
        for (let row = 0; row < BRICK_ROWS; row++) {
            for (let col = 0; col < BRICK_COLS; col++) {
                // Some bricks are harder (require multiple hits) at higher levels
                let hits = 1;
                if (level > 2 && Math.random() < 0.2) hits = 2;
                if (level > 4 && Math.random() < 0.1) hits = 3;
                
                bricks.push({
                    x: BRICK_OFFSET_LEFT + col * (BRICK_WIDTH + BRICK_PADDING),
                    y: BRICK_OFFSET_TOP + row * (BRICK_HEIGHT + BRICK_PADDING),
                    width: BRICK_WIDTH,
                    height: BRICK_HEIGHT,
                    color: BRICK_COLORS[row],
                    points: BRICK_POINTS[row] * level,
                    hits: hits,
                    maxHits: hits,
                    active: true
                });
            }
        }
    }
    
    function resetBall() {
        balls = [{
            x: paddle.x + paddle.width / 2,
            y: paddle.y - BALL_RADIUS - 5,
            dx: 0,
            dy: 0,
            radius: BALL_RADIUS,
            attached: true
        }];
        ballSpeed = BALL_BASE_SPEED + (level - 1) * 0.5;
    }
    
    function launchBall() {
        balls.forEach(ball => {
            if (ball.attached) {
                ball.attached = false;
                const angle = -Math.PI / 4 - Math.random() * Math.PI / 2; // -45 to -135 degrees
                ball.dx = Math.cos(angle) * ballSpeed;
                ball.dy = Math.sin(angle) * ballSpeed;
            }
        });
    }
    
    function resetLevel() {
        paddle.width = paddle.baseWidth;
        paddle.x = GAME_WIDTH / 2 - paddle.width / 2;
        paddle.hasLaser = false;
        powerups = [];
        lasers = [];
        resetBall();
    }
    
    function nextLevel() {
        level++;
        playSound('levelup');
        createBricks();
        resetLevel();
        gameState = 'playing';
        updateUI();
    }
    
    function resetGame() {
        score = 0;
        lives = 3;
        level = 1;
        ballSpeed = BALL_BASE_SPEED;
        paddle.width = paddle.baseWidth;
        paddle.x = GAME_WIDTH / 2 - paddle.width / 2;
        paddle.hasLaser = false;
        powerups = [];
        lasers = [];
        createBricks();
        resetBall();
        gameState = 'playing';
        updateUI();
    }
    
    function updateUI() {
        document.getElementById('score').textContent = score;
        document.getElementById('level').textContent = level;
        document.getElementById('lives').textContent = lives;
    }
    
    // Input handling
    document.addEventListener('keydown', (e) => {
        initAudio();
        
        if (gameState === 'start') {
            gameState = 'playing';
            return;
        }
        
        if (gameState === 'gameover') {
            if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
                resetGame();
            }
            return;
        }
        
        if (gameState === 'levelcomplete') {
            if (e.key === ' ') {
                nextLevel();
            }
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = true;
                useMouseControl = false;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = true;
                useMouseControl = false;
                e.preventDefault();
                break;
            case ' ':
                e.preventDefault();
                if (gameState === 'playing') {
                    const hasAttached = balls.some(b => b.attached);
                    if (hasAttached) {
                        launchBall();
                    } else {
                        gameState = 'paused';
                    }
                } else if (gameState === 'paused') {
                    gameState = 'playing';
                }
                break;
            case 'p':
            case 'P':
                if (gameState === 'playing') {
                    gameState = 'paused';
                } else if (gameState === 'paused') {
                    gameState = 'playing';
                }
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = false;
                break;
        }
    });
    
    // Mouse controls
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        mouseX = (e.clientX - rect.left) * scaleX;
        useMouseControl = true;
    });
    
    canvas.addEventListener('click', (e) => {
        initAudio();
        
        if (gameState === 'start') {
            gameState = 'playing';
            return;
        }
        
        if (gameState === 'gameover') {
            resetGame();
            return;
        }
        
        if (gameState === 'levelcomplete') {
            nextLevel();
            return;
        }
        
        if (gameState === 'playing') {
            const hasAttached = balls.some(b => b.attached);
            if (hasAttached) {
                launchBall();
            } else if (paddle.hasLaser) {
                fireLaser();
            }
        }
    });
    
    // Touch controls
    document.getElementById('btn-left').addEventListener('touchstart', () => { keys.left = true; });
    document.getElementById('btn-left').addEventListener('touchend', () => { keys.left = false; });
    document.getElementById('btn-right').addEventListener('touchstart', () => { keys.right = true; });
    document.getElementById('btn-right').addEventListener('touchend', () => { keys.right = false; });
    document.getElementById('btn-launch').addEventListener('click', () => {
        initAudio();
        if (gameState === 'start') {
            gameState = 'playing';
        } else if (gameState === 'playing') {
            const hasAttached = balls.some(b => b.attached);
            if (hasAttached) {
                launchBall();
            } else if (paddle.hasLaser) {
                fireLaser();
            }
        }
    });
    
    function fireLaser() {
        const now = Date.now();
        if (now - lastLaserTime < LASER_COOLDOWN) return;
        
        lastLaserTime = now;
        playSound('laser');
        
        lasers.push({
            x: paddle.x + 10,
            y: paddle.y,
            width: 4,
            height: 15
        });
        lasers.push({
            x: paddle.x + paddle.width - 14,
            y: paddle.y,
            width: 4,
            height: 15
        });
    }
    
    // Power-up effects
    function applyPowerup(type) {
        playSound('powerup');
        
        switch(type) {
            case 'expand':
                paddle.width = Math.min(paddle.width + 30, 200);
                break;
            case 'shrink':
                paddle.width = Math.max(paddle.width - 20, 50);
                break;
            case 'multi':
                const newBalls = [];
                balls.forEach(ball => {
                    if (!ball.attached) {
                        // Create two new balls at slight angles
                        newBalls.push({
                            x: ball.x,
                            y: ball.y,
                            dx: ball.dx * Math.cos(0.3) - ball.dy * Math.sin(0.3),
                            dy: ball.dx * Math.sin(0.3) + ball.dy * Math.cos(0.3),
                            radius: BALL_RADIUS,
                            attached: false
                        });
                        newBalls.push({
                            x: ball.x,
                            y: ball.y,
                            dx: ball.dx * Math.cos(-0.3) - ball.dy * Math.sin(-0.3),
                            dy: ball.dx * Math.sin(-0.3) + ball.dy * Math.cos(-0.3),
                            radius: BALL_RADIUS,
                            attached: false
                        });
                    }
                });
                balls = balls.concat(newBalls);
                break;
            case 'slow':
                ballSpeed = Math.max(ballSpeed - 1.5, 3);
                balls.forEach(ball => {
                    if (!ball.attached) {
                        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                        const ratio = ballSpeed / speed;
                        ball.dx *= ratio;
                        ball.dy *= ratio;
                    }
                });
                break;
            case 'fast':
                ballSpeed = Math.min(ballSpeed + 1.5, 12);
                balls.forEach(ball => {
                    if (!ball.attached) {
                        const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                        const ratio = ballSpeed / speed;
                        ball.dx *= ratio;
                        ball.dy *= ratio;
                    }
                });
                break;
            case 'life':
                lives++;
                updateUI();
                break;
            case 'laser':
                paddle.hasLaser = true;
                paddle.laserTimer = 600; // 10 seconds at 60fps
                break;
        }
    }
    
    function spawnPowerup(x, y) {
        if (Math.random() < POWERUP_DROP_CHANCE) {
            const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
            powerups.push({
                x: x,
                y: y,
                width: 30,
                height: 20,
                type: type.type,
                color: type.color,
                symbol: type.symbol
            });
        }
    }
    
    // Update game state
    function update() {
        if (gameState !== 'playing') return;
        
        // Update paddle position
        if (useMouseControl) {
            paddle.x = mouseX - paddle.width / 2;
        } else {
            if (keys.left) paddle.x -= paddle.speed;
            if (keys.right) paddle.x += paddle.speed;
        }
        
        // Keep paddle in bounds
        paddle.x = Math.max(0, Math.min(GAME_WIDTH - paddle.width, paddle.x));
        
        // Update laser timer
        if (paddle.hasLaser) {
            paddle.laserTimer--;
            if (paddle.laserTimer <= 0) {
                paddle.hasLaser = false;
            }
        }
        
        // Update lasers
        for (let i = lasers.length - 1; i >= 0; i--) {
            lasers[i].y -= LASER_SPEED;
            
            // Remove if off screen
            if (lasers[i].y < 0) {
                lasers.splice(i, 1);
                continue;
            }
            
            // Check brick collision
            for (let j = bricks.length - 1; j >= 0; j--) {
                const brick = bricks[j];
                if (!brick.active) continue;
                
                if (lasers[i] && 
                    lasers[i].x < brick.x + brick.width &&
                    lasers[i].x + lasers[i].width > brick.x &&
                    lasers[i].y < brick.y + brick.height &&
                    lasers[i].y + lasers[i].height > brick.y) {
                    
                    brick.hits--;
                    if (brick.hits <= 0) {
                        brick.active = false;
                        score += brick.points;
                        spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height);
                    }
                    playSound('brick');
                    lasers.splice(i, 1);
                    updateUI();
                    break;
                }
            }
        }
        
        // Update balls
        for (let i = balls.length - 1; i >= 0; i--) {
            const ball = balls[i];
            
            if (ball.attached) {
                ball.x = paddle.x + paddle.width / 2;
                ball.y = paddle.y - ball.radius - 2;
                continue;
            }
            
            ball.x += ball.dx;
            ball.y += ball.dy;
            
            // Wall collisions
            if (ball.x - ball.radius < 0) {
                ball.x = ball.radius;
                ball.dx = Math.abs(ball.dx);
                playSound('wall');
            }
            if (ball.x + ball.radius > GAME_WIDTH) {
                ball.x = GAME_WIDTH - ball.radius;
                ball.dx = -Math.abs(ball.dx);
                playSound('wall');
            }
            if (ball.y - ball.radius < 0) {
                ball.y = ball.radius;
                ball.dy = Math.abs(ball.dy);
                playSound('wall');
            }
            
            // Bottom - lose ball
            if (ball.y + ball.radius > GAME_HEIGHT) {
                balls.splice(i, 1);
                
                if (balls.length === 0) {
                    lives--;
                    playSound('lose');
                    updateUI();
                    
                    if (lives <= 0) {
                        gameState = 'gameover';
                        submitScore();
                    } else {
                        resetBall();
                    }
                }
                continue;
            }
            
            // Paddle collision
            if (ball.dy > 0 &&
                ball.y + ball.radius > paddle.y &&
                ball.y - ball.radius < paddle.y + paddle.height &&
                ball.x > paddle.x &&
                ball.x < paddle.x + paddle.width) {
                
                // Calculate bounce angle based on where ball hit paddle
                const hitPos = (ball.x - paddle.x) / paddle.width; // 0 to 1
                const angle = (hitPos - 0.5) * Math.PI * 0.7; // -63 to +63 degrees
                
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                ball.dx = Math.sin(angle) * speed;
                ball.dy = -Math.cos(angle) * speed;
                
                ball.y = paddle.y - ball.radius;
                playSound('paddle');
            }
            
            // Brick collisions
            for (let j = 0; j < bricks.length; j++) {
                const brick = bricks[j];
                if (!brick.active) continue;
                
                if (ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brick.width &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brick.height) {
                    
                    // Determine collision side
                    const overlapLeft = ball.x + ball.radius - brick.x;
                    const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
                    const overlapTop = ball.y + ball.radius - brick.y;
                    const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);
                    
                    const minOverlapX = Math.min(overlapLeft, overlapRight);
                    const minOverlapY = Math.min(overlapTop, overlapBottom);
                    
                    if (minOverlapX < minOverlapY) {
                        ball.dx = -ball.dx;
                    } else {
                        ball.dy = -ball.dy;
                    }
                    
                    brick.hits--;
                    if (brick.hits <= 0) {
                        brick.active = false;
                        score += brick.points;
                        spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height);
                    }
                    
                    playSound('brick');
                    updateUI();
                    break;
                }
            }
        }
        
        // Update power-ups
        for (let i = powerups.length - 1; i >= 0; i--) {
            powerups[i].y += POWERUP_SPEED;
            
            // Check paddle collision
            if (powerups[i].y + powerups[i].height > paddle.y &&
                powerups[i].y < paddle.y + paddle.height &&
                powerups[i].x + powerups[i].width > paddle.x &&
                powerups[i].x < paddle.x + paddle.width) {
                
                applyPowerup(powerups[i].type);
                powerups.splice(i, 1);
                continue;
            }
            
            // Remove if off screen
            if (powerups[i].y > GAME_HEIGHT) {
                powerups.splice(i, 1);
            }
        }
        
        // Check level complete
        const activeBricks = bricks.filter(b => b.active).length;
        if (activeBricks === 0) {
            gameState = 'levelcomplete';
            playSound('levelup');
        }
    }
    
    // Drawing functions
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#0a0a1a';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw grid background
        ctx.strokeStyle = 'rgba(60, 210, 165, 0.1)';
        ctx.lineWidth = 1;
        for (let x = 0; x < GAME_WIDTH; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < GAME_HEIGHT; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }
        
        // Draw bricks
        bricks.forEach(brick => {
            if (!brick.active) return;
            
            // Brick gradient
            const gradient = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
            gradient.addColorStop(0, brick.color);
            gradient.addColorStop(1, shadeColor(brick.color, -30));
            
            ctx.fillStyle = gradient;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // Brick border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
            
            // Show hits remaining for multi-hit bricks
            if (brick.maxHits > 1) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(brick.hits, brick.x + brick.width / 2, brick.y + brick.height / 2 + 5);
            }
        });
        
        // Draw power-ups
        powerups.forEach(powerup => {
            ctx.fillStyle = powerup.color;
            ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(powerup.x, powerup.y, powerup.width, powerup.height);
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(powerup.symbol, powerup.x + powerup.width / 2, powerup.y + powerup.height / 2 + 5);
        });
        
        // Draw lasers
        ctx.fillStyle = '#FFEB3B';
        lasers.forEach(laser => {
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        });
        
        // Draw paddle
        const paddleGradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
        paddleGradient.addColorStop(0, paddle.hasLaser ? '#FFEB3B' : '#3cd2a5');
        paddleGradient.addColorStop(1, paddle.hasLaser ? '#FFA000' : '#2ba882');
        
        ctx.fillStyle = paddleGradient;
        ctx.beginPath();
        ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 5);
        ctx.fill();
        
        // Paddle glow
        ctx.shadowColor = paddle.hasLaser ? '#FFEB3B' : '#3cd2a5';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Laser indicators on paddle
        if (paddle.hasLaser) {
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(paddle.x + 10, paddle.y + paddle.height / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(paddle.x + paddle.width - 10, paddle.y + paddle.height / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw balls
        balls.forEach(ball => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Ball glow
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Ball highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(ball.x - 2, ball.y - 2, ball.radius / 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw overlays
        if (gameState === 'start') {
            drawStartScreen();
        } else if (gameState === 'paused') {
            drawPauseScreen();
        } else if (gameState === 'gameover') {
            drawGameOverScreen();
        } else if (gameState === 'levelcomplete') {
            drawLevelCompleteScreen();
        }
    }
    
    function shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + 
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + 
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + 
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }
    
    function drawStartScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PONGR', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('Break the bricks, catch power-ups!', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        
        ctx.font = '20px Arial';
        ctx.fillText('Press any key or click to start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#888';
        ctx.fillText('Use ← → or mouse to move paddle', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    }
    
    function drawPauseScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('Press SPACE or P to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }
    
    function drawGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = '32px Arial';
        ctx.fillText('Final Score: ' + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('Press R or click to play again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);
    }
    
    function drawLevelCompleteScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL ' + level + ' COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        
        ctx.font = '20px Arial';
        ctx.fillText('Press SPACE or click for next level', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    }
    
    function submitScore() {
        if (window.helixAuth && window.helixAuth.isLoggedIn()) {
            window.helixAuth.submitScore('pongr', score);
        }
    }
    
    // Game loop
    let lastTime = 0;
    function gameLoop(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        update();
        draw();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Start game
    init();
    requestAnimationFrame(gameLoop);
})();
