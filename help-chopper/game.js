// Help Chopper - A Choplifter-style rescue game
// Helix Games

(function() {
    'use strict';

    // Canvas setup
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    
    // Game dimensions
    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 500;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // World dimensions (scrolling)
    const WORLD_WIDTH = 2400;
    const BASE_X = 100; // Base location
    
    // Game state
    let gameState = 'start'; // 'start', 'playing', 'paused', 'gameover', 'victory'
    let score = 0;
    let lives = 3;
    let totalRescued = 0;
    let totalHostages = 16;
    
    // Camera
    let cameraX = 0;
    
    // Helicopter
    const chopper = {
        x: 150,
        y: 200,
        width: 60,
        height: 30,
        vx: 0,
        vy: 0,
        maxSpeed: 4,
        acceleration: 0.3,
        friction: 0.95,
        facing: 1, // 1 = right, -1 = left, 0 = forward
        rotorAngle: 0,
        passengers: 0,
        maxPassengers: 8,
        landed: false,
        invincible: 0,
        bladeSpeed: 0.3
    };
    
    // Ground level
    const GROUND_Y = GAME_HEIGHT - 60;
    
    // Hostages
    let hostages = [];
    const HOSTAGE_CAMPS = [
        { x: 600, count: 4 },
        { x: 1000, count: 4 },
        { x: 1400, count: 4 },
        { x: 1800, count: 4 }
    ];
    
    // Enemies
    let tanks = [];
    let jets = [];
    let enemyBullets = [];
    
    // Player bullets
    let bullets = [];
    const BULLET_SPEED = 8;
    
    // Explosions
    let explosions = [];
    
    // Buildings/structures
    let buildings = [];
    
    // Base
    const base = {
        x: 50,
        y: GROUND_Y - 40,
        width: 80,
        height: 40
    };
    
    // Input state
    const keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        fire: false
    };
    let lastFireTime = 0;
    const FIRE_COOLDOWN = 200;
    
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
            case 'shoot':
                oscillator.frequency.value = 150;
                oscillator.type = 'square';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
                break;
            case 'explosion':
                oscillator.frequency.value = 100;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;
            case 'pickup':
                oscillator.frequency.value = 600;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.15);
                break;
            case 'rescue':
                oscillator.frequency.value = 400;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
                oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.3);
                break;
            case 'hit':
                oscillator.frequency.value = 200;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.2);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.2);
                break;
            case 'jet':
                oscillator.frequency.value = 300;
                oscillator.type = 'sawtooth';
                gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
                oscillator.frequency.linearRampToValueAtTime(600, audioCtx.currentTime + 0.5);
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.5);
                break;
        }
    }
    
    // Initialize game
    function init() {
        createHostages();
        createEnemies();
        createBuildings();
        resetChopper();
        updateUI();
    }
    
    function createHostages() {
        hostages = [];
        HOSTAGE_CAMPS.forEach(camp => {
            for (let i = 0; i < camp.count; i++) {
                hostages.push({
                    x: camp.x + (i - camp.count/2) * 20,
                    y: GROUND_Y,
                    state: 'waiting', // 'waiting', 'running', 'boarding', 'rescued', 'dead'
                    targetX: 0,
                    animFrame: 0
                });
            }
        });
    }
    
    function createEnemies() {
        tanks = [];
        jets = [];
        
        // Create tanks near hostage camps
        HOSTAGE_CAMPS.forEach((camp, index) => {
            tanks.push({
                x: camp.x - 100,
                y: GROUND_Y - 20,
                width: 50,
                height: 25,
                direction: 1,
                fireTimer: Math.random() * 120,
                health: 2
            });
            if (index > 0) {
                tanks.push({
                    x: camp.x + 100,
                    y: GROUND_Y - 20,
                    width: 50,
                    height: 25,
                    direction: -1,
                    fireTimer: Math.random() * 120,
                    health: 2
                });
            }
        });
    }
    
    function createBuildings() {
        buildings = [];
        
        // Hostage barracks
        HOSTAGE_CAMPS.forEach(camp => {
            buildings.push({
                x: camp.x - 30,
                y: GROUND_Y - 50,
                width: 60,
                height: 50,
                type: 'barracks',
                destroyed: false
            });
        });
        
        // Some additional structures
        buildings.push({ x: 800, y: GROUND_Y - 35, width: 40, height: 35, type: 'tower', destroyed: false });
        buildings.push({ x: 1200, y: GROUND_Y - 35, width: 40, height: 35, type: 'tower', destroyed: false });
        buildings.push({ x: 1600, y: GROUND_Y - 35, width: 40, height: 35, type: 'tower', destroyed: false });
        buildings.push({ x: 2000, y: GROUND_Y - 35, width: 40, height: 35, type: 'tower', destroyed: false });
    }
    
    function resetChopper() {
        chopper.x = 150;
        chopper.y = 200;
        chopper.vx = 0;
        chopper.vy = 0;
        chopper.facing = 1;
        chopper.landed = false;
        chopper.invincible = 120; // 2 seconds of invincibility
    }
    
    function resetGame() {
        score = 0;
        lives = 3;
        totalRescued = 0;
        bullets = [];
        enemyBullets = [];
        explosions = [];
        jets = [];
        createHostages();
        createEnemies();
        createBuildings();
        resetChopper();
        cameraX = 0;
        gameState = 'playing';
        updateUI();
    }
    
    function updateUI() {
        document.getElementById('score').textContent = score;
        document.getElementById('rescued').textContent = totalRescued + '/' + totalHostages;
        document.getElementById('onboard').textContent = chopper.passengers;
        document.getElementById('lives').textContent = lives;
    }
    
    // Input handling
    document.addEventListener('keydown', (e) => {
        initAudio();
        
        if (gameState === 'start') {
            gameState = 'playing';
            return;
        }
        
        if (gameState === 'gameover' || gameState === 'victory') {
            if (e.key === 'r' || e.key === 'R' || e.key === ' ') {
                resetGame();
            }
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = true;
                e.preventDefault();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                keys.up = true;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                keys.down = true;
                e.preventDefault();
                break;
            case ' ':
            case 'x':
            case 'X':
                keys.fire = true;
                e.preventDefault();
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
            case 'ArrowUp':
            case 'w':
            case 'W':
                keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                keys.down = false;
                break;
            case ' ':
            case 'x':
            case 'X':
                keys.fire = false;
                break;
        }
    });
    
    // Touch controls
    function setupTouchControl(id, key) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('touchstart', (e) => { 
                e.preventDefault();
                keys[key] = true; 
                initAudio();
            });
            btn.addEventListener('touchend', (e) => { 
                e.preventDefault();
                keys[key] = false; 
            });
            btn.addEventListener('mousedown', () => { keys[key] = true; initAudio(); });
            btn.addEventListener('mouseup', () => { keys[key] = false; });
        }
    }
    
    setupTouchControl('btn-left', 'left');
    setupTouchControl('btn-right', 'right');
    setupTouchControl('btn-up', 'up');
    setupTouchControl('btn-down', 'down');
    setupTouchControl('btn-fire', 'fire');
    
    // Shooting
    function shoot() {
        const now = Date.now();
        if (now - lastFireTime < FIRE_COOLDOWN) return;
        
        lastFireTime = now;
        playSound('shoot');
        
        if (chopper.facing === 0) {
            // Facing forward - shoot down
            bullets.push({
                x: chopper.x + chopper.width / 2,
                y: chopper.y + chopper.height,
                vx: 0,
                vy: BULLET_SPEED
            });
        } else {
            // Facing left or right
            bullets.push({
                x: chopper.x + (chopper.facing > 0 ? chopper.width : 0),
                y: chopper.y + chopper.height / 2,
                vx: BULLET_SPEED * chopper.facing,
                vy: 0
            });
        }
    }
    
    // Spawn jet
    function spawnJet() {
        if (jets.length < 2 && Math.random() < 0.005) {
            const fromLeft = Math.random() > 0.5;
            jets.push({
                x: fromLeft ? cameraX - 50 : cameraX + GAME_WIDTH + 50,
                y: 50 + Math.random() * 100,
                vx: fromLeft ? 5 : -5,
                width: 50,
                height: 20,
                fireTimer: 60
            });
            playSound('jet');
        }
    }
    
    // Update game state
    function update() {
        if (gameState !== 'playing') return;
        
        // Update rotor animation
        chopper.rotorAngle += chopper.bladeSpeed;
        
        // Decrease invincibility
        if (chopper.invincible > 0) chopper.invincible--;
        
        // Handle input
        if (keys.left) {
            chopper.vx -= chopper.acceleration;
            chopper.facing = -1;
        }
        if (keys.right) {
            chopper.vx += chopper.acceleration;
            chopper.facing = 1;
        }
        if (keys.up) {
            chopper.vy -= chopper.acceleration;
        }
        if (keys.down) {
            chopper.vy += chopper.acceleration;
        }
        
        // If not moving horizontally, face forward
        if (!keys.left && !keys.right && Math.abs(chopper.vx) < 0.5) {
            chopper.facing = 0;
        }
        
        // Shooting
        if (keys.fire) {
            shoot();
        }
        
        // Apply friction
        chopper.vx *= chopper.friction;
        chopper.vy *= chopper.friction;
        
        // Clamp speed
        chopper.vx = Math.max(-chopper.maxSpeed, Math.min(chopper.maxSpeed, chopper.vx));
        chopper.vy = Math.max(-chopper.maxSpeed, Math.min(chopper.maxSpeed, chopper.vy));
        
        // Apply gravity when not pressing up
        if (!keys.up) {
            chopper.vy += 0.1;
        }
        
        // Update position
        chopper.x += chopper.vx;
        chopper.y += chopper.vy;
        
        // World bounds
        chopper.x = Math.max(0, Math.min(WORLD_WIDTH - chopper.width, chopper.x));
        chopper.y = Math.max(20, Math.min(GROUND_Y - chopper.height, chopper.y));
        
        // Check if landed
        chopper.landed = chopper.y >= GROUND_Y - chopper.height - 5 && Math.abs(chopper.vy) < 1;
        
        // Update camera
        const targetCameraX = chopper.x - GAME_WIDTH / 3;
        cameraX = Math.max(0, Math.min(WORLD_WIDTH - GAME_WIDTH, targetCameraX));
        
        // Update hostages
        updateHostages();
        
        // Update enemies
        updateTanks();
        updateJets();
        spawnJet();
        
        // Update bullets
        updateBullets();
        updateEnemyBullets();
        
        // Update explosions
        updateExplosions();
        
        // Check victory
        if (totalRescued >= totalHostages) {
            gameState = 'victory';
            submitScore();
        }
        
        updateUI();
    }
    
    function updateHostages() {
        hostages.forEach(hostage => {
            if (hostage.state === 'dead' || hostage.state === 'rescued') return;
            
            hostage.animFrame = (hostage.animFrame + 0.1) % 2;
            
            // Check if chopper is nearby and landed
            const dx = hostage.x - (chopper.x + chopper.width / 2);
            const distance = Math.abs(dx);
            
            if (hostage.state === 'waiting') {
                // Start running toward chopper if it's landed nearby
                if (chopper.landed && distance < 150 && chopper.passengers < chopper.maxPassengers) {
                    hostage.state = 'running';
                    hostage.targetX = chopper.x + chopper.width / 2;
                }
            }
            
            if (hostage.state === 'running') {
                // Move toward chopper
                const moveDir = hostage.targetX > hostage.x ? 1 : -1;
                hostage.x += moveDir * 1.5;
                
                // Update target if chopper moved
                if (chopper.landed) {
                    hostage.targetX = chopper.x + chopper.width / 2;
                }
                
                // Board the chopper
                if (distance < 20 && chopper.landed && chopper.passengers < chopper.maxPassengers) {
                    hostage.state = 'boarding';
                    chopper.passengers++;
                    score += 50;
                    playSound('pickup');
                }
                
                // Give up if chopper flew away
                if (!chopper.landed && distance > 200) {
                    hostage.state = 'waiting';
                }
            }
        });
        
        // Drop off passengers at base
        if (chopper.landed && chopper.x < base.x + base.width + 30 && chopper.passengers > 0) {
            const rescued = chopper.passengers;
            totalRescued += rescued;
            score += rescued * 100;
            chopper.passengers = 0;
            playSound('rescue');
            
            // Mark hostages as rescued
            let count = 0;
            hostages.forEach(h => {
                if (h.state === 'boarding' && count < rescued) {
                    h.state = 'rescued';
                    count++;
                }
            });
        }
    }
    
    function updateTanks() {
        tanks.forEach(tank => {
            // Move tank
            tank.x += tank.direction * 0.5;
            
            // Reverse at boundaries
            if (tank.x < 400 || tank.x > WORLD_WIDTH - 100) {
                tank.direction *= -1;
            }
            
            // Fire at chopper
            tank.fireTimer--;
            if (tank.fireTimer <= 0) {
                const dx = chopper.x - tank.x;
                const dy = chopper.y - tank.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 400) {
                    enemyBullets.push({
                        x: tank.x + tank.width / 2,
                        y: tank.y,
                        vx: (dx / dist) * 4,
                        vy: (dy / dist) * 4
                    });
                    tank.fireTimer = 90 + Math.random() * 60;
                } else {
                    tank.fireTimer = 30;
                }
            }
        });
    }
    
    function updateJets() {
        for (let i = jets.length - 1; i >= 0; i--) {
            const jet = jets[i];
            jet.x += jet.vx;
            
            // Fire at chopper
            jet.fireTimer--;
            if (jet.fireTimer <= 0) {
                const dx = chopper.x - jet.x;
                const dy = chopper.y - jet.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < 500) {
                    enemyBullets.push({
                        x: jet.x + jet.width / 2,
                        y: jet.y + jet.height,
                        vx: (dx / dist) * 5,
                        vy: (dy / dist) * 5
                    });
                }
                jet.fireTimer = 40;
            }
            
            // Remove if off screen
            if (jet.x < cameraX - 100 || jet.x > cameraX + GAME_WIDTH + 100) {
                jets.splice(i, 1);
            }
        }
    }
    
    function updateBullets() {
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // Remove if off screen
            if (bullet.x < cameraX - 50 || bullet.x > cameraX + GAME_WIDTH + 50 ||
                bullet.y < 0 || bullet.y > GAME_HEIGHT) {
                bullets.splice(i, 1);
                continue;
            }
            
            // Hit ground
            if (bullet.y > GROUND_Y) {
                createExplosion(bullet.x, GROUND_Y, 'small');
                bullets.splice(i, 1);
                continue;
            }
            
            // Hit tanks
            for (let j = tanks.length - 1; j >= 0; j--) {
                const tank = tanks[j];
                if (bullet.x > tank.x && bullet.x < tank.x + tank.width &&
                    bullet.y > tank.y && bullet.y < tank.y + tank.height) {
                    
                    tank.health--;
                    if (tank.health <= 0) {
                        createExplosion(tank.x + tank.width / 2, tank.y, 'medium');
                        tanks.splice(j, 1);
                        score += 200;
                    }
                    bullets.splice(i, 1);
                    break;
                }
            }
            
            // Hit jets
            for (let j = jets.length - 1; j >= 0; j--) {
                const jet = jets[j];
                if (bullet.x > jet.x && bullet.x < jet.x + jet.width &&
                    bullet.y > jet.y && bullet.y < jet.y + jet.height) {
                    
                    createExplosion(jet.x + jet.width / 2, jet.y, 'medium');
                    jets.splice(j, 1);
                    score += 300;
                    bullets.splice(i, 1);
                    break;
                }
            }
            
            // Hit buildings
            for (let j = 0; j < buildings.length; j++) {
                const bld = buildings[j];
                if (!bld.destroyed && bld.type === 'tower' &&
                    bullet.x > bld.x && bullet.x < bld.x + bld.width &&
                    bullet.y > bld.y && bullet.y < bld.y + bld.height) {
                    
                    bld.destroyed = true;
                    createExplosion(bld.x + bld.width / 2, bld.y + bld.height / 2, 'medium');
                    score += 100;
                    bullets.splice(i, 1);
                    break;
                }
            }
        }
    }
    
    function updateEnemyBullets() {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            // Remove if off screen
            if (bullet.x < cameraX - 50 || bullet.x > cameraX + GAME_WIDTH + 50 ||
                bullet.y < 0 || bullet.y > GAME_HEIGHT) {
                enemyBullets.splice(i, 1);
                continue;
            }
            
            // Hit chopper
            if (chopper.invincible <= 0 &&
                bullet.x > chopper.x && bullet.x < chopper.x + chopper.width &&
                bullet.y > chopper.y && bullet.y < chopper.y + chopper.height) {
                
                chopperHit();
                enemyBullets.splice(i, 1);
            }
            
            // Hit ground
            if (bullet.y > GROUND_Y) {
                // Check if hit hostages
                hostages.forEach(hostage => {
                    if (hostage.state !== 'dead' && hostage.state !== 'rescued' && hostage.state !== 'boarding') {
                        if (Math.abs(bullet.x - hostage.x) < 15) {
                            hostage.state = 'dead';
                            totalHostages--;
                        }
                    }
                });
                enemyBullets.splice(i, 1);
            }
        }
    }
    
    function chopperHit() {
        playSound('hit');
        createExplosion(chopper.x + chopper.width / 2, chopper.y + chopper.height / 2, 'large');
        
        // Lose passengers
        let lostPassengers = chopper.passengers;
        chopper.passengers = 0;
        
        // Mark boarding hostages as dead
        let count = 0;
        hostages.forEach(h => {
            if (h.state === 'boarding' && count < lostPassengers) {
                h.state = 'dead';
                totalHostages--;
                count++;
            }
        });
        
        lives--;
        
        if (lives <= 0) {
            gameState = 'gameover';
            submitScore();
        } else {
            resetChopper();
        }
    }
    
    function createExplosion(x, y, size) {
        playSound('explosion');
        explosions.push({
            x: x,
            y: y,
            size: size,
            frame: 0,
            maxFrames: size === 'large' ? 30 : size === 'medium' ? 20 : 10
        });
    }
    
    function updateExplosions() {
        for (let i = explosions.length - 1; i >= 0; i--) {
            explosions[i].frame++;
            if (explosions[i].frame >= explosions[i].maxFrames) {
                explosions.splice(i, 1);
            }
        }
    }
    
    // Drawing functions
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#1a1a3e';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Draw sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
        skyGradient.addColorStop(0, '#0a0a2e');
        skyGradient.addColorStop(0.5, '#1a1a4e');
        skyGradient.addColorStop(1, '#2a1a3e');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, GAME_WIDTH, GROUND_Y);
        
        // Draw stars
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 50; i++) {
            const sx = ((i * 137 + cameraX * 0.1) % GAME_WIDTH);
            const sy = (i * 73) % (GROUND_Y - 50);
            ctx.fillRect(sx, sy, 1, 1);
        }
        
        // Draw mountains (parallax)
        drawMountains();
        
        // Draw ground
        ctx.fillStyle = '#2d4a2d';
        ctx.fillRect(0, GROUND_Y, GAME_WIDTH, GAME_HEIGHT - GROUND_Y);
        
        // Draw ground line
        ctx.strokeStyle = '#3cd2a5';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        ctx.lineTo(GAME_WIDTH, GROUND_Y);
        ctx.stroke();
        
        // Draw base
        drawBase();
        
        // Draw buildings
        drawBuildings();
        
        // Draw hostages
        drawHostages();
        
        // Draw tanks
        drawTanks();
        
        // Draw jets
        drawJets();
        
        // Draw bullets
        drawBullets();
        
        // Draw enemy bullets
        drawEnemyBullets();
        
        // Draw chopper
        drawChopper();
        
        // Draw explosions
        drawExplosions();
        
        // Draw UI overlay
        drawMinimap();
        
        // Draw overlays
        if (gameState === 'start') {
            drawStartScreen();
        } else if (gameState === 'paused') {
            drawPauseScreen();
        } else if (gameState === 'gameover') {
            drawGameOverScreen();
        } else if (gameState === 'victory') {
            drawVictoryScreen();
        }
    }
    
    function drawMountains() {
        ctx.fillStyle = '#1a2a3a';
        ctx.beginPath();
        ctx.moveTo(0, GROUND_Y);
        
        for (let x = 0; x <= GAME_WIDTH; x += 50) {
            const worldX = x + cameraX * 0.3;
            const height = Math.sin(worldX * 0.005) * 50 + Math.sin(worldX * 0.01) * 30 + 80;
            ctx.lineTo(x, GROUND_Y - height);
        }
        
        ctx.lineTo(GAME_WIDTH, GROUND_Y);
        ctx.closePath();
        ctx.fill();
    }
    
    function drawBase() {
        const screenX = base.x - cameraX;
        
        if (screenX < -100 || screenX > GAME_WIDTH + 100) return;
        
        // Helipad
        ctx.fillStyle = '#444';
        ctx.fillRect(screenX, base.y + base.height - 5, base.width, 5);
        
        // Building
        ctx.fillStyle = '#3cd2a5';
        ctx.fillRect(screenX + 10, base.y, base.width - 20, base.height - 5);
        
        // H marking
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('H', screenX + base.width / 2, base.y + base.height - 15);
        
        // Flag
        ctx.fillStyle = '#3cd2a5';
        ctx.fillRect(screenX + base.width - 15, base.y - 30, 3, 35);
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(screenX + base.width - 12, base.y - 30, 20, 12);
    }
    
    function drawBuildings() {
        buildings.forEach(bld => {
            const screenX = bld.x - cameraX;
            
            if (screenX < -100 || screenX > GAME_WIDTH + 100) return;
            if (bld.destroyed) return;
            
            if (bld.type === 'barracks') {
                // Barracks building
                ctx.fillStyle = '#4a3a2a';
                ctx.fillRect(screenX, bld.y, bld.width, bld.height);
                
                // Roof
                ctx.fillStyle = '#3a2a1a';
                ctx.beginPath();
                ctx.moveTo(screenX - 5, bld.y);
                ctx.lineTo(screenX + bld.width / 2, bld.y - 15);
                ctx.lineTo(screenX + bld.width + 5, bld.y);
                ctx.closePath();
                ctx.fill();
                
                // Door
                ctx.fillStyle = '#2a1a0a';
                ctx.fillRect(screenX + bld.width / 2 - 8, bld.y + bld.height - 25, 16, 25);
            } else if (bld.type === 'tower') {
                // Guard tower
                ctx.fillStyle = '#5a4a3a';
                ctx.fillRect(screenX + 10, bld.y, bld.width - 20, bld.height);
                
                // Top
                ctx.fillStyle = '#4a3a2a';
                ctx.fillRect(screenX, bld.y - 10, bld.width, 15);
            }
        });
    }
    
    function drawHostages() {
        hostages.forEach(hostage => {
            if (hostage.state === 'dead' || hostage.state === 'rescued' || hostage.state === 'boarding') return;
            
            const screenX = hostage.x - cameraX;
            
            if (screenX < -20 || screenX > GAME_WIDTH + 20) return;
            
            // Simple stick figure
            ctx.fillStyle = '#ffcc00';
            
            // Head
            ctx.beginPath();
            ctx.arc(screenX, hostage.y - 15, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Body
            ctx.strokeStyle = '#ffcc00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX, hostage.y - 10);
            ctx.lineTo(screenX, hostage.y - 2);
            ctx.stroke();
            
            // Legs (animated)
            const legOffset = hostage.state === 'running' ? Math.sin(hostage.animFrame * Math.PI) * 3 : 0;
            ctx.beginPath();
            ctx.moveTo(screenX, hostage.y - 2);
            ctx.lineTo(screenX - 3 + legOffset, hostage.y);
            ctx.moveTo(screenX, hostage.y - 2);
            ctx.lineTo(screenX + 3 - legOffset, hostage.y);
            ctx.stroke();
            
            // Arms
            ctx.beginPath();
            ctx.moveTo(screenX - 5, hostage.y - 8);
            ctx.lineTo(screenX + 5, hostage.y - 8);
            ctx.stroke();
        });
    }
    
    function drawTanks() {
        tanks.forEach(tank => {
            const screenX = tank.x - cameraX;
            
            if (screenX < -60 || screenX > GAME_WIDTH + 60) return;
            
            // Tank body
            ctx.fillStyle = '#4a5a4a';
            ctx.fillRect(screenX, tank.y + 10, tank.width, tank.height - 10);
            
            // Turret
            ctx.fillStyle = '#3a4a3a';
            ctx.fillRect(screenX + 15, tank.y, 20, 12);
            
            // Cannon
            ctx.fillStyle = '#2a3a2a';
            const cannonDir = tank.direction;
            ctx.fillRect(screenX + (cannonDir > 0 ? 35 : 0), tank.y + 3, 15, 6);
            
            // Tracks
            ctx.fillStyle = '#2a2a2a';
            ctx.fillRect(screenX, tank.y + tank.height - 5, tank.width, 5);
        });
    }
    
    function drawJets() {
        jets.forEach(jet => {
            const screenX = jet.x - cameraX;
            
            // Jet body
            ctx.fillStyle = '#6a6a7a';
            const dir = jet.vx > 0 ? 1 : -1;
            
            ctx.beginPath();
            ctx.moveTo(screenX + (dir > 0 ? 0 : jet.width), jet.y + jet.height / 2);
            ctx.lineTo(screenX + (dir > 0 ? jet.width : 0), jet.y);
            ctx.lineTo(screenX + (dir > 0 ? jet.width : 0), jet.y + jet.height);
            ctx.closePath();
            ctx.fill();
            
            // Wings
            ctx.fillStyle = '#5a5a6a';
            ctx.fillRect(screenX + jet.width / 2 - 5, jet.y - 5, 10, jet.height + 10);
            
            // Cockpit
            ctx.fillStyle = '#88ccff';
            ctx.beginPath();
            ctx.arc(screenX + (dir > 0 ? jet.width - 10 : 10), jet.y + jet.height / 2, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function drawBullets() {
        ctx.fillStyle = '#ffff00';
        bullets.forEach(bullet => {
            const screenX = bullet.x - cameraX;
            ctx.fillRect(screenX - 3, bullet.y - 3, 6, 6);
        });
    }
    
    function drawEnemyBullets() {
        ctx.fillStyle = '#ff4444';
        enemyBullets.forEach(bullet => {
            const screenX = bullet.x - cameraX;
            ctx.beginPath();
            ctx.arc(screenX, bullet.y, 4, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function drawChopper() {
        const screenX = chopper.x - cameraX;
        const screenY = chopper.y;
        
        // Flashing when invincible
        if (chopper.invincible > 0 && Math.floor(chopper.invincible / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.save();
        ctx.translate(screenX + chopper.width / 2, screenY + chopper.height / 2);
        
        // Body
        ctx.fillStyle = '#3cd2a5';
        ctx.beginPath();
        if (chopper.facing === 0) {
            // Facing forward (toward screen)
            ctx.ellipse(0, 0, chopper.width / 3, chopper.height / 2, 0, 0, Math.PI * 2);
        } else {
            // Facing left or right
            ctx.ellipse(0, 0, chopper.width / 2.5, chopper.height / 2.5, 0, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#88ffff';
        if (chopper.facing === 0) {
            ctx.beginPath();
            ctx.ellipse(0, -5, 10, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.ellipse(chopper.facing * 8, -3, 8, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Tail
        if (chopper.facing !== 0) {
            ctx.fillStyle = '#2ba882';
            ctx.fillRect(-chopper.facing * 25, -3, 20, 6);
            
            // Tail rotor
            ctx.fillStyle = '#666';
            ctx.fillRect(-chopper.facing * 28, -8, 3, 16);
        }
        
        // Main rotor
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const rotorLen = 35;
        ctx.moveTo(Math.cos(chopper.rotorAngle) * rotorLen, -chopper.height / 2 - 5);
        ctx.lineTo(Math.cos(chopper.rotorAngle + Math.PI) * rotorLen, -chopper.height / 2 - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(Math.cos(chopper.rotorAngle + Math.PI/2) * rotorLen, -chopper.height / 2 - 5);
        ctx.lineTo(Math.cos(chopper.rotorAngle + Math.PI*1.5) * rotorLen, -chopper.height / 2 - 5);
        ctx.stroke();
        
        // Rotor hub
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.arc(0, -chopper.height / 2 - 5, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Skids
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, chopper.height / 2);
        ctx.lineTo(-15, chopper.height / 2 + 8);
        ctx.lineTo(15, chopper.height / 2 + 8);
        ctx.lineTo(15, chopper.height / 2);
        ctx.stroke();
        
        ctx.restore();
        ctx.globalAlpha = 1;
        
        // Show passenger count
        if (chopper.passengers > 0) {
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(chopper.passengers, screenX + chopper.width / 2, screenY - 20);
        }
    }
    
    function drawExplosions() {
        explosions.forEach(exp => {
            const screenX = exp.x - cameraX;
            const progress = exp.frame / exp.maxFrames;
            const radius = (exp.size === 'large' ? 40 : exp.size === 'medium' ? 25 : 15) * (1 - progress * 0.5);
            
            // Outer glow
            ctx.fillStyle = `rgba(255, ${100 + progress * 100}, 0, ${1 - progress})`;
            ctx.beginPath();
            ctx.arc(screenX, exp.y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Inner core
            ctx.fillStyle = `rgba(255, 255, ${progress * 200}, ${1 - progress})`;
            ctx.beginPath();
            ctx.arc(screenX, exp.y, radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    function drawMinimap() {
        const mapWidth = 150;
        const mapHeight = 20;
        const mapX = GAME_WIDTH - mapWidth - 10;
        const mapY = 10;
        
        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(mapX, mapY, mapWidth, mapHeight);
        
        // Border
        ctx.strokeStyle = '#3cd2a5';
        ctx.lineWidth = 1;
        ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
        
        // Base
        ctx.fillStyle = '#3cd2a5';
        const baseMapX = mapX + (base.x / WORLD_WIDTH) * mapWidth;
        ctx.fillRect(baseMapX, mapY + 2, 5, mapHeight - 4);
        
        // Hostage camps
        ctx.fillStyle = '#ffcc00';
        HOSTAGE_CAMPS.forEach(camp => {
            const campMapX = mapX + (camp.x / WORLD_WIDTH) * mapWidth;
            ctx.fillRect(campMapX, mapY + mapHeight - 6, 3, 4);
        });
        
        // Chopper position
        ctx.fillStyle = '#ffffff';
        const chopperMapX = mapX + (chopper.x / WORLD_WIDTH) * mapWidth;
        ctx.fillRect(chopperMapX - 2, mapY + 5, 4, 4);
        
        // View area
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        const viewStart = mapX + (cameraX / WORLD_WIDTH) * mapWidth;
        const viewWidth = (GAME_WIDTH / WORLD_WIDTH) * mapWidth;
        ctx.strokeRect(viewStart, mapY, viewWidth, mapHeight);
    }
    
    function drawStartScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('HELP CHOPPER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('Rescue hostages from enemy territory!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 30);
        
        ctx.font = '16px Arial';
        ctx.fillText('🚁 Fly to camps and land to pick up hostages', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        ctx.fillText('🏠 Return them safely to the base', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 35);
        ctx.fillText('⚠️ Watch out for tanks and jets!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = '24px Arial';
        ctx.fillText('Press any key to start', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110);
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
        ctx.fillText('Press P to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    }
    
    function drawGameOverScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('Rescued: ' + totalRescued + ' hostages', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = '32px Arial';
        ctx.fillText('Score: ' + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('Press R or SPACE to play again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
    }
    
    function drawVictoryScreen() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        ctx.fillStyle = '#3cd2a5';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('MISSION COMPLETE!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText('All hostages rescued!', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        
        ctx.fillStyle = '#ffcc00';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('Score: ' + score, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('Press R or SPACE to play again', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 110);
    }
    
    function submitScore() {
        if (window.helixAuth && window.helixAuth.isLoggedIn()) {
            window.helixAuth.submitScore('help-chopper', score);
        }
    }
    
    // Game loop
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    // Start game
    init();
    requestAnimationFrame(gameLoop);
})();
