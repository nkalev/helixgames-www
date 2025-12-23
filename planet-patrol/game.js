// Planet Patrol - A Moon Patrol style game
// Helix Games

(function() {
    'use strict';

    // Canvas setup
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Game dimensions
    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 400;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Ground level
    const GROUND_Y = GAME_HEIGHT - 60;
    const HORIZON_Y = GAME_HEIGHT * 0.4;
    
    // Game state
    let gameState = 'start'; // 'start', 'playing', 'paused', 'gameover'
    let score = 0;
    let lives = 3;
    let distance = 0;
    let checkpoint = 'A';
    let checkpointDistance = 0;
    const CHECKPOINT_INTERVAL = 1000;
    
    // Player vehicle
    const player = {
        x: 150,
        y: GROUND_Y,
        width: 60,
        height: 30,
        wheelRadius: 10,
        velocityY: 0,
        isJumping: false,
        speed: 3,
        baseSpeed: 3,
        maxSpeed: 6,
        minSpeed: 1,
        wheelAngle: 0
    };
    
    // Bullets
    let bullets = [];
    const BULLET_SPEED = 10;
    
    // Obstacles
    let obstacles = [];
    const OBSTACLE_TYPES = ['crater', 'rock', 'boulder'];
    
    // Enemies
    let enemies = [];
    let enemyBullets = [];
    
    // Parallax backgrounds
    let mountainOffset = 0;
    let hillOffset = 0;
    
    // Terrain - simple scrolling bumps using sine waves
    let terrainPhase = 0;
    
    // Get ground height at a specific screen x position using procedural generation
    function getGroundHeight(screenX) {
        // Use multiple sine waves for natural-looking terrain
        const phase = (screenX + terrainPhase) * 0.02;
        const height = Math.sin(phase) * 12 + 
                       Math.sin(phase * 2.3) * 6 + 
                       Math.sin(phase * 0.7) * 8;
        return height;
    }
    
    // Stars for background
    let stars = [];
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * HORIZON_Y,
            size: Math.random() * 2 + 1,
            twinkle: Math.random()
        });
    }
    
    // Input state
    const keys = {
        left: false,
        right: false,
        space: false,
        z: false,
        x: false
    };
    
    // Timers
    let lastObstacleTime = 0;
    let lastEnemyTime = 0;
    let gameTime = 0;
    
    // Audio context for sound effects
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
            case 'shoot':
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.1);
                break;
            case 'jump':
                oscillator.frequency.setValueAtTime(200, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.15);
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.15);
                break;
            case 'explosion':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(100, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;
            case 'checkpoint':
                oscillator.frequency.setValueAtTime(523, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(659, audioCtx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(784, audioCtx.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
                oscillator.start(audioCtx.currentTime);
                oscillator.stop(audioCtx.currentTime + 0.4);
                break;
        }
    }
    
    // Keyboard input
    document.addEventListener('keydown', (e) => {
        if (gameState === 'start') {
            startGame();
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
                keys.right = true;
                e.preventDefault();
                break;
            case ' ':
                keys.space = true;
                e.preventDefault();
                if (gameState === 'playing' && !player.isJumping) {
                    jump();
                }
                break;
            case 'z':
            case 'Z':
                if (gameState === 'playing') shootForward();
                break;
            case 'x':
            case 'X':
                if (gameState === 'playing') shootUpward();
                break;
            case 'p':
            case 'P':
                togglePause();
                break;
            case 'r':
            case 'R':
                if (gameState === 'gameover' || gameState === 'paused') {
                    resetGame();
                }
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                keys.left = false;
                break;
            case 'ArrowRight':
                keys.right = false;
                break;
            case ' ':
                keys.space = false;
                break;
        }
    });
    
    // Mobile touch controls
    window.touchSpeed = function(dir) {
        if (dir === -1) {
            keys.left = true;
            keys.right = false;
        } else if (dir === 1) {
            keys.right = true;
            keys.left = false;
        } else {
            keys.left = false;
            keys.right = false;
        }
    };
    
    window.touchJump = function() {
        if (gameState === 'start') {
            startGame();
        } else if (gameState === 'playing' && !player.isJumping) {
            jump();
        }
    };
    
    window.touchShoot = function(dir) {
        if (gameState === 'playing') {
            if (dir === 'forward') shootForward();
            else shootUpward();
        }
    };
    
    function startGame() {
        initAudio();
        gameState = 'playing';
    }
    
    function togglePause() {
        if (gameState === 'playing') {
            gameState = 'paused';
        } else if (gameState === 'paused') {
            gameState = 'playing';
        }
    }
    
    function resetGame() {
        score = 0;
        lives = 3;
        distance = 0;
        checkpoint = 'A';
        checkpointDistance = 0;
        player.y = GROUND_Y;
        player.velocityY = 0;
        player.isJumping = false;
        player.speed = player.baseSpeed;
        player.tilt = 0;
        obstacles = [];
        enemies = [];
        bullets = [];
        enemyBullets = [];
        gameTime = 0;
        terrainPhase = 0; // Reset terrain
        gameState = 'playing';
        updateUI();
    }
    
    function jump() {
        if (!player.isJumping) {
            player.isJumping = true;
            player.velocityY = -12;
            playSound('jump');
        }
    }
    
    function shootForward() {
        bullets.push({
            x: player.x + player.width,
            y: player.y - player.height / 2,
            vx: BULLET_SPEED,
            vy: 0,
            type: 'forward'
        });
        playSound('shoot');
    }
    
    function shootUpward() {
        bullets.push({
            x: player.x + player.width / 2,
            y: player.y - player.height,
            vx: 2,
            vy: -BULLET_SPEED,
            type: 'up'
        });
        playSound('shoot');
    }
    
    function spawnObstacle() {
        const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
        let obstacle = {
            x: GAME_WIDTH + 50,
            type: type
        };
        
        switch(type) {
            case 'crater':
                obstacle.width = 40 + Math.random() * 30;
                obstacle.height = 20;
                obstacle.y = GROUND_Y;
                break;
            case 'rock':
                obstacle.width = 25;
                obstacle.height = 25;
                obstacle.y = GROUND_Y - 25;
                break;
            case 'boulder':
                obstacle.width = 40;
                obstacle.height = 35;
                obstacle.y = GROUND_Y - 35;
                break;
        }
        
        obstacles.push(obstacle);
    }
    
    function spawnEnemy() {
        const type = Math.random() > 0.5 ? 'ufo' : 'tank';
        let enemy = {
            x: GAME_WIDTH + 30,
            type: type,
            health: 1,
            shootTimer: 0
        };
        
        if (type === 'ufo') {
            enemy.y = 50 + Math.random() * 100;
            enemy.width = 40;
            enemy.height = 20;
            enemy.speed = 2 + Math.random() * 2;
            enemy.amplitude = 20 + Math.random() * 30;
            enemy.frequency = 0.02 + Math.random() * 0.02;
            enemy.baseY = enemy.y;
            enemy.phase = Math.random() * Math.PI * 2;
        } else {
            enemy.y = GROUND_Y - 25;
            enemy.width = 35;
            enemy.height = 25;
            enemy.speed = 1.5;
        }
        
        enemies.push(enemy);
    }
    
    function update(deltaTime) {
        if (gameState !== 'playing') return;
        
        gameTime += deltaTime;
        
        // Update player speed
        if (keys.left && player.speed > player.minSpeed) {
            player.speed -= 0.1;
        }
        if (keys.right && player.speed < player.maxSpeed) {
            player.speed += 0.1;
        }
        
        // Update distance
        distance += player.speed * 0.5;
        
        // Check for checkpoint
        if (distance - checkpointDistance >= CHECKPOINT_INTERVAL) {
            checkpointDistance = Math.floor(distance / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
            checkpoint = String.fromCharCode(65 + Math.floor(distance / CHECKPOINT_INTERVAL) % 26);
            score += 500;
            playSound('checkpoint');
        }
        
        // Get current ground height at player position
        const groundHeightAtPlayer = getGroundHeight(player.x + player.width / 2);
        const currentGroundY = GROUND_Y - groundHeightAtPlayer;
        
        // Update player jump physics
        if (player.isJumping) {
            player.velocityY += 0.6; // Gravity
            player.y += player.velocityY;
            
            // Only land if falling (velocityY > 0) and below ground
            if (player.velocityY > 0 && player.y >= currentGroundY) {
                player.y = currentGroundY;
                player.isJumping = false;
                player.velocityY = 0;
            }
        } else {
            // Follow terrain when not jumping
            player.y = currentGroundY;
            
            // Add vehicle tilt based on terrain slope
            const frontHeight = getGroundHeight(player.x + player.width);
            const backHeight = getGroundHeight(player.x);
            player.tilt = Math.atan2(backHeight - frontHeight, player.width) * 0.5;
        }
        
        // Update wheel animation
        player.wheelAngle += player.speed * 0.2;
        
        // Update parallax
        mountainOffset -= player.speed * 0.3;
        hillOffset -= player.speed * 0.6;
        if (mountainOffset < -GAME_WIDTH) mountainOffset = 0;
        if (hillOffset < -GAME_WIDTH) hillOffset = 0;
        
        // Update terrain phase for scrolling
        terrainPhase += player.speed * 2;
        
        // Spawn obstacles
        if (gameTime - lastObstacleTime > 1500 / player.speed) {
            if (Math.random() > 0.3) {
                spawnObstacle();
            }
            lastObstacleTime = gameTime;
        }
        
        // Spawn enemies
        if (gameTime - lastEnemyTime > 3000) {
            if (Math.random() > 0.4) {
                spawnEnemy();
            }
            lastEnemyTime = gameTime;
        }
        
        // Update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= player.speed * 2;
            
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
                score += 10; // Points for passing obstacle
            }
        }
        
        // Update enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            enemy.x -= enemy.speed + player.speed;
            
            if (enemy.type === 'ufo') {
                enemy.phase += enemy.frequency;
                enemy.y = enemy.baseY + Math.sin(enemy.phase) * enemy.amplitude;
                
                // UFO shooting
                enemy.shootTimer += deltaTime;
                if (enemy.shootTimer > 2000 && Math.random() > 0.98) {
                    enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y + enemy.height,
                        vx: -2,
                        vy: 4
                    });
                    enemy.shootTimer = 0;
                }
            } else {
                // Tank shooting
                enemy.shootTimer += deltaTime;
                if (enemy.shootTimer > 1500 && Math.random() > 0.97) {
                    enemyBullets.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: -6,
                        vy: 0
                    });
                    enemy.shootTimer = 0;
                }
            }
            
            if (enemy.x + enemy.width < 0) {
                enemies.splice(i, 1);
            }
        }
        
        // Update player bullets
        for (let i = bullets.length - 1; i >= 0; i--) {
            bullets[i].x += bullets[i].vx;
            bullets[i].y += bullets[i].vy;
            
            if (bullets[i].x > GAME_WIDTH || bullets[i].y < 0) {
                bullets.splice(i, 1);
            }
        }
        
        // Update enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            enemyBullets[i].x += enemyBullets[i].vx;
            enemyBullets[i].y += enemyBullets[i].vy;
            
            if (enemyBullets[i].x < 0 || enemyBullets[i].y > GAME_HEIGHT) {
                enemyBullets.splice(i, 1);
            }
        }
        
        // Collision detection
        checkCollisions();
        
        // Update UI
        updateUI();
    }
    
    function checkCollisions() {
        const playerBox = {
            x: player.x,
            y: player.y - player.height,
            width: player.width,
            height: player.height
        };
        
        // Player vs obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            
            if (obs.type === 'crater') {
                // Crater collision - only when on ground and over the crater
                if (!player.isJumping && 
                    player.x + player.width > obs.x + 10 && 
                    player.x < obs.x + obs.width - 10) {
                    playerHit();
                    obstacles.splice(i, 1);
                }
            } else {
                // Rock/boulder collision
                if (boxCollision(playerBox, obs)) {
                    playerHit();
                    obstacles.splice(i, 1);
                }
            }
        }
        
        // Player vs enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (boxCollision(playerBox, enemies[i])) {
                playerHit();
                enemies.splice(i, 1);
            }
        }
        
        // Player vs enemy bullets
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            if (bullet.x > playerBox.x && bullet.x < playerBox.x + playerBox.width &&
                bullet.y > playerBox.y && bullet.y < playerBox.y + playerBox.height) {
                playerHit();
                enemyBullets.splice(i, 1);
            }
        }
        
        // Bullets vs obstacles (rocks/boulders only)
        for (let i = bullets.length - 1; i >= 0; i--) {
            for (let j = obstacles.length - 1; j >= 0; j--) {
                if (obstacles[j].type !== 'crater') {
                    if (bullets[i] && pointInBox(bullets[i].x, bullets[i].y, obstacles[j])) {
                        score += 25;
                        playSound('explosion');
                        bullets.splice(i, 1);
                        obstacles.splice(j, 1);
                        break;
                    }
                }
            }
        }
        
        // Bullets vs enemies
        for (let i = bullets.length - 1; i >= 0; i--) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                if (bullets[i] && pointInBox(bullets[i].x, bullets[i].y, enemies[j])) {
                    score += enemies[j].type === 'ufo' ? 100 : 75;
                    playSound('explosion');
                    bullets.splice(i, 1);
                    enemies.splice(j, 1);
                    break;
                }
            }
        }
    }
    
    function boxCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    function pointInBox(px, py, box) {
        return px > box.x && px < box.x + box.width &&
               py > box.y && py < box.y + box.height;
    }
    
    function playerHit() {
        lives--;
        playSound('explosion');
        
        if (lives <= 0) {
            gameOver();
        } else {
            // Brief invincibility / reset position
            player.y = GROUND_Y;
            player.isJumping = false;
            player.velocityY = 0;
        }
        
        updateUI();
    }
    
    function gameOver() {
        gameState = 'gameover';
        
        // Submit score if logged in
        if (window.helixAuth && window.helixAuth.isLoggedIn()) {
            const result = window.helixAuth.submitScore('planet-patrol', score);
            if (result.success && result.isPersonalBest) {
                console.log('🎉 New Personal Best!');
            }
        }
    }
    
    function updateUI() {
        document.getElementById('score').textContent = score;
        document.getElementById('lives').textContent = lives;
        document.getElementById('distance').textContent = Math.floor(distance);
        document.getElementById('checkpoint').textContent = checkpoint;
    }
    
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
        skyGradient.addColorStop(0, '#0a0a1a');
        skyGradient.addColorStop(1, '#1a1a3a');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, GAME_WIDTH, HORIZON_Y);
        
        // Draw stars
        ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            star.twinkle += 0.05;
            const alpha = 0.5 + Math.sin(star.twinkle) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Draw distant mountains (parallax layer 1)
        ctx.fillStyle = '#2a1a4a';
        drawMountains(mountainOffset, HORIZON_Y - 30, 80, 0.5);
        drawMountains(mountainOffset + GAME_WIDTH, HORIZON_Y - 30, 80, 0.5);
        
        // Draw hills (parallax layer 2)
        ctx.fillStyle = '#3a2a5a';
        drawMountains(hillOffset, HORIZON_Y, 50, 0.3);
        drawMountains(hillOffset + GAME_WIDTH, HORIZON_Y, 50, 0.3);
        
        // Draw ground
        const groundGradient = ctx.createLinearGradient(0, HORIZON_Y, 0, GAME_HEIGHT);
        groundGradient.addColorStop(0, '#8b4513');
        groundGradient.addColorStop(0.3, '#a0522d');
        groundGradient.addColorStop(1, '#654321');
        ctx.fillStyle = groundGradient;
        ctx.fillRect(0, HORIZON_Y, GAME_WIDTH, GAME_HEIGHT - HORIZON_Y);
        
        // Draw uneven terrain surface
        drawTerrain();
        
        // Draw checkpoint markers
        drawCheckpointMarkers();
        
        // Draw obstacles
        obstacles.forEach(obs => {
            if (obs.type === 'crater') {
                drawCrater(obs);
            } else if (obs.type === 'rock') {
                drawRock(obs);
            } else if (obs.type === 'boulder') {
                drawBoulder(obs);
            }
        });
        
        // Draw enemies
        enemies.forEach(enemy => {
            if (enemy.type === 'ufo') {
                drawUFO(enemy);
            } else {
                drawTank(enemy);
            }
        });
        
        // Draw bullets
        ctx.fillStyle = '#ffff00';
        bullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw enemy bullets
        ctx.fillStyle = '#ff4444';
        enemyBullets.forEach(bullet => {
            ctx.beginPath();
            ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw player vehicle
        drawPlayer();
        
        // Draw overlays
        if (gameState === 'start') {
            drawStartScreen();
        } else if (gameState === 'paused') {
            drawPauseScreen();
        } else if (gameState === 'gameover') {
            drawGameOverScreen();
        }
    }
    
    function drawMountains(offset, baseY, height, frequency) {
        ctx.beginPath();
        ctx.moveTo(offset, baseY + height);
        
        for (let x = 0; x <= GAME_WIDTH; x += 20) {
            const y = baseY + Math.sin((x + offset) * frequency) * height * 0.5 + 
                      Math.sin((x + offset) * frequency * 2.5) * height * 0.3;
            ctx.lineTo(offset + x, y);
        }
        
        ctx.lineTo(offset + GAME_WIDTH, baseY + height);
        ctx.closePath();
        ctx.fill();
    }
    
    function drawTerrain() {
        // Draw the uneven ground surface
        ctx.fillStyle = '#5a3d2a';
        ctx.beginPath();
        ctx.moveTo(0, GAME_HEIGHT);
        
        // Draw terrain line following the height map
        for (let x = 0; x <= GAME_WIDTH; x += 5) {
            const height = getGroundHeight(x);
            const y = GROUND_Y - height;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        // Complete the shape
        ctx.lineTo(GAME_WIDTH, GAME_HEIGHT);
        ctx.lineTo(0, GAME_HEIGHT);
        ctx.closePath();
        ctx.fill();
        
        // Draw terrain surface line (the visible ground line)
        ctx.strokeStyle = '#3cd2a5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= GAME_WIDTH; x += 5) {
            const height = getGroundHeight(x);
            const y = GROUND_Y - height;
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Add some texture/detail to terrain
        ctx.strokeStyle = '#4a2d1a';
        ctx.lineWidth = 1;
        for (let x = 0; x < GAME_WIDTH; x += 30) {
            const height = getGroundHeight(x);
            const y = GROUND_Y - height;
            ctx.beginPath();
            ctx.moveTo(x, y + 5);
            ctx.lineTo(x + 10, y + 15);
            ctx.stroke();
        }
    }
    
    function drawCheckpointMarkers() {
        const markerSpacing = 200;
        const startX = -(distance % markerSpacing);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = '12px Arial';
        
        for (let x = startX; x < GAME_WIDTH; x += markerSpacing) {
            const markerDist = Math.floor((distance + x) / markerSpacing) * markerSpacing;
            
            // Draw marker post
            ctx.fillStyle = '#666';
            ctx.fillRect(x, GROUND_Y - 30, 4, 35);
            
            // Draw distance label
            ctx.fillStyle = '#3cd2a5';
            ctx.fillText(markerDist + 'm', x - 10, GROUND_Y - 35);
        }
    }
    
    function drawCrater(crater) {
        ctx.fillStyle = '#2a1a0a';
        ctx.beginPath();
        ctx.ellipse(crater.x + crater.width / 2, crater.y + 5, crater.width / 2, crater.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Crater rim
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(crater.x + crater.width / 2, crater.y + 5, crater.width / 2, crater.height / 2, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
    }
    
    function drawRock(rock) {
        ctx.fillStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.moveTo(rock.x + rock.width / 2, rock.y);
        ctx.lineTo(rock.x + rock.width, rock.y + rock.height);
        ctx.lineTo(rock.x, rock.y + rock.height);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#3a2a1a';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    function drawBoulder(boulder) {
        ctx.fillStyle = '#6a5a4a';
        ctx.beginPath();
        ctx.arc(boulder.x + boulder.width / 2, boulder.y + boulder.height / 2, boulder.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#4a3a2a';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Texture lines
        ctx.strokeStyle = '#5a4a3a';
        ctx.beginPath();
        ctx.arc(boulder.x + boulder.width / 2 - 5, boulder.y + boulder.height / 2 - 5, boulder.width / 4, 0, Math.PI);
        ctx.stroke();
    }
    
    function drawUFO(ufo) {
        // UFO body
        ctx.fillStyle = '#8888ff';
        ctx.beginPath();
        ctx.ellipse(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2, ufo.width / 2, ufo.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // UFO dome
        ctx.fillStyle = '#aaaaff';
        ctx.beginPath();
        ctx.arc(ufo.x + ufo.width / 2, ufo.y + ufo.height / 3, ufo.width / 4, Math.PI, 0);
        ctx.fill();
        
        // UFO lights
        ctx.fillStyle = '#ffff00';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(ufo.x + ufo.width * 0.25 + i * ufo.width * 0.25, ufo.y + ufo.height * 0.6, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    function drawTank(tank) {
        // Tank body
        ctx.fillStyle = '#446644';
        ctx.fillRect(tank.x, tank.y + 10, tank.width, tank.height - 10);
        
        // Tank turret
        ctx.fillStyle = '#335533';
        ctx.fillRect(tank.x + 5, tank.y, tank.width - 15, 12);
        
        // Tank cannon
        ctx.fillStyle = '#224422';
        ctx.fillRect(tank.x - 10, tank.y + 3, 15, 6);
        
        // Tank tracks
        ctx.fillStyle = '#222222';
        ctx.fillRect(tank.x, tank.y + tank.height - 5, tank.width, 5);
    }
    
    function drawPlayer() {
        const px = player.x;
        const py = player.y; // This is the actual player Y position (follows terrain or jumping)
        const tilt = player.tilt || 0;
        
        // Wheel X positions (always the same)
        const frontWheelX = px + player.width - 15;
        const backWheelX = px + 15;
        
        // When jumping, use player.y directly; when on ground, wheels follow terrain
        let frontWheelY, backWheelY;
        
        if (player.isJumping) {
            // During jump, both wheels are at player.y (flat)
            frontWheelY = py;
            backWheelY = py;
        } else {
            // On ground, wheels follow terrain
            frontWheelY = GROUND_Y - getGroundHeight(frontWheelX);
            backWheelY = GROUND_Y - getGroundHeight(backWheelX);
        }
        
        // Save context for rotation
        ctx.save();
        
        // Translate to vehicle center and rotate based on tilt
        const centerX = px + player.width / 2;
        const centerY = (frontWheelY + backWheelY) / 2 - player.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(player.isJumping ? 0 : tilt); // No tilt during jump
        ctx.translate(-centerX, -centerY);
        
        // Adjust py to average wheel height
        const adjustedPy = (frontWheelY + backWheelY) / 2;
        
        // Vehicle body
        ctx.fillStyle = '#3cd2a5';
        ctx.beginPath();
        ctx.moveTo(px, adjustedPy - 5);
        ctx.lineTo(px + 10, adjustedPy - player.height);
        ctx.lineTo(px + player.width - 10, adjustedPy - player.height);
        ctx.lineTo(px + player.width, adjustedPy - 5);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#2ba882';
        ctx.beginPath();
        ctx.moveTo(px + 15, adjustedPy - player.height + 5);
        ctx.lineTo(px + 25, adjustedPy - player.height - 8);
        ctx.lineTo(px + 40, adjustedPy - player.height - 8);
        ctx.lineTo(px + 45, adjustedPy - player.height + 5);
        ctx.closePath();
        ctx.fill();
        
        // Window
        ctx.fillStyle = '#88ffff';
        ctx.beginPath();
        ctx.moveTo(px + 20, adjustedPy - player.height + 3);
        ctx.lineTo(px + 27, adjustedPy - player.height - 5);
        ctx.lineTo(px + 38, adjustedPy - player.height - 5);
        ctx.lineTo(px + 42, adjustedPy - player.height + 3);
        ctx.closePath();
        ctx.fill();
        
        // Gun turret
        ctx.fillStyle = '#2ba882';
        ctx.fillRect(px + player.width - 5, adjustedPy - player.height + 5, 15, 6);
        
        // Upward gun
        ctx.fillRect(px + 30, adjustedPy - player.height - 12, 5, 8);
        
        ctx.restore();
        
        // Wheels (drawn without rotation, at actual terrain positions)
        ctx.fillStyle = '#333333';
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 2;
        
        // Back wheel
        ctx.beginPath();
        ctx.arc(backWheelX, backWheelY, player.wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Front wheel
        ctx.beginPath();
        ctx.arc(frontWheelX, frontWheelY, player.wheelRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Wheel spokes
        ctx.strokeStyle = '#777777';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const angle = player.wheelAngle + (i * Math.PI / 2);
            
            // Back wheel spoke
            ctx.beginPath();
            ctx.moveTo(backWheelX, backWheelY);
            ctx.lineTo(backWheelX + Math.cos(angle) * player.wheelRadius * 0.8, 
                      backWheelY + Math.sin(angle) * player.wheelRadius * 0.8);
            ctx.stroke();
            
            // Front wheel spoke
            ctx.beginPath();
            ctx.moveTo(frontWheelX, frontWheelY);
            ctx.lineTo(frontWheelX + Math.cos(angle) * player.wheelRadius * 0.8, 
                      frontWheelY + Math.sin(angle) * player.wheelRadius * 0.8);
            ctx.stroke();
        }
    }
    
    function drawStartScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PLANET PATROL', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('Press any key to start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = '#888888';
        ctx.fillText('← → Speed | SPACE Jump | Z Shoot | X Shoot Up', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
    }
    
    function drawPauseScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.fillText('Press P to resume or R to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
    }
    
    function drawGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = '24px Arial';
        ctx.fillText('Final Score: ' + score, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.fillText('Distance: ' + Math.floor(distance) + 'm', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.fillText('Press R to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80);
    }
    
    // Game loop
    let lastTime = 0;
    
    function gameLoop(timestamp) {
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        update(deltaTime);
        draw();
        
        requestAnimationFrame(gameLoop);
    }
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
    
})();
