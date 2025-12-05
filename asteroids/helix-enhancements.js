// Helix Games Visual Enhancements for Asteroids
// Applies theme colors and visual effects to game elements

(function() {
  'use strict';
  
  const HELIX_COLORS = {
    primary: '#3cd2a5',
    primaryLight: '#5ddbb5',
    primaryDark: '#2ab88c',
    ship: '#3cd2a5',
    asteroid: '#90a2aa',
    bullet: '#3cd2a5',
    alien: '#ff6f3c',
    explosion: '#f9c622',
    text: '#3cd2a5',
    grid: '#273136',
    glow: 'rgba(60, 210, 165, 0.3)'
  };
  
  // Wait for the game to load
  $(function() {
    // Override the default stroke style
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    const originalStroke = context.stroke.bind(context);
    const originalBeginPath = context.beginPath.bind(context);
    
    let currentEntityType = 'default';
    
    // Enhanced stroke with glow effect
    context.stroke = function() {
      // Apply glow effect
      this.shadowBlur = 8;
      this.shadowColor = HELIX_COLORS.glow;
      
      // Set color based on entity type
      switch(currentEntityType) {
        case 'ship':
          this.strokeStyle = HELIX_COLORS.ship;
          this.shadowColor = HELIX_COLORS.glow;
          this.lineWidth = 2;
          break;
        case 'bullet':
          this.strokeStyle = HELIX_COLORS.bullet;
          this.shadowColor = HELIX_COLORS.glow;
          this.shadowBlur = 10;
          break;
        case 'asteroid':
          this.strokeStyle = HELIX_COLORS.asteroid;
          this.shadowBlur = 5;
          this.shadowColor = 'rgba(144, 162, 170, 0.3)';
          break;
        case 'alien':
          this.strokeStyle = HELIX_COLORS.alien;
          this.shadowColor = 'rgba(255, 111, 60, 0.5)';
          this.shadowBlur = 10;
          break;
        case 'explosion':
          this.strokeStyle = HELIX_COLORS.explosion;
          this.shadowColor = 'rgba(249, 198, 34, 0.6)';
          this.shadowBlur = 12;
          break;
        default:
          this.strokeStyle = HELIX_COLORS.primary;
      }
      
      originalStroke();
      
      // Reset shadow for next draw
      this.shadowBlur = 0;
    };
    
    // Intercept beginPath to determine entity type
    context.beginPath = function() {
      // Try to determine what's being drawn based on line width
      if (this.lineWidth >= 2) {
        currentEntityType = 'bullet';
      }
      originalBeginPath();
    };
    
    // Enhance the Sprite draw method
    if (typeof Sprite !== 'undefined') {
      const originalSpriteDraw = Sprite.prototype.draw;
      Sprite.prototype.draw = function() {
        if (!this.visible) return;
        
        // Set entity type based on sprite name
        if (this.name) {
          if (this.name.includes('ship')) {
            currentEntityType = 'ship';
            this.context.lineWidth = 2;
          } else if (this.name.includes('bullet')) {
            currentEntityType = 'bullet';
          } else if (this.name.includes('asteroid')) {
            currentEntityType = 'asteroid';
          } else if (this.name.includes('alien')) {
            currentEntityType = 'alien';
          }
        }
        
        // Call original draw
        originalSpriteDraw.call(this);
        
        // Reset
        currentEntityType = 'default';
      };
    }
    
    // Enhance Bullet draw
    if (typeof Bullet !== 'undefined') {
      Bullet.prototype.draw = function() {
        if (this.visible) {
          this.context.save();
          this.context.lineWidth = 2;
          this.context.strokeStyle = HELIX_COLORS.bullet;
          this.context.shadowBlur = 15;
          this.context.shadowColor = HELIX_COLORS.glow;
          
          this.context.beginPath();
          this.context.arc(this.x, this.y, 2, 0, Math.PI * 2, true);
          this.context.closePath();
          this.context.stroke();
          
          // Add inner glow
          this.context.fillStyle = HELIX_COLORS.primaryLight;
          this.context.fill();
          
          this.context.restore();
        }
      };
    }
    
    // Enhance AlienBullet draw
    if (typeof AlienBullet !== 'undefined') {
      AlienBullet.prototype.draw = function() {
        if (this.visible) {
          this.context.save();
          this.context.lineWidth = 2;
          this.context.strokeStyle = HELIX_COLORS.alien;
          this.context.shadowBlur = 15;
          this.context.shadowColor = 'rgba(255, 111, 60, 0.6)';
          
          this.context.beginPath();
          this.context.arc(this.x, this.y, 2, 0, Math.PI * 2, true);
          this.context.closePath();
          this.context.stroke();
          
          // Add inner glow
          this.context.fillStyle = '#ff8c00';
          this.context.fill();
          
          this.context.restore();
        }
      };
    }
    
    // Enhance Explosion draw
    if (typeof Explosion !== 'undefined') {
      const originalExplosionDraw = Explosion.prototype.draw;
      Explosion.prototype.draw = function() {
        if (this.visible) {
          this.context.save();
          this.context.lineWidth = 2;
          this.context.strokeStyle = HELIX_COLORS.explosion;
          this.context.shadowBlur = 15;
          this.context.shadowColor = 'rgba(249, 198, 34, 0.8)';
          
          // Call original
          originalExplosionDraw.call(this);
          
          this.context.restore();
        }
      };
    }
    
    // Enhance Text rendering
    if (typeof Text !== 'undefined' && Text.renderText) {
      const originalRenderText = Text.renderText;
      Text.renderText = function(string, size, x, y) {
        const context = Text.context;
        context.save();
        
        // Apply Helix theme to text
        context.fillStyle = HELIX_COLORS.text;
        context.shadowBlur = 10;
        context.shadowColor = HELIX_COLORS.glow;
        
        originalRenderText.call(this, string, size, x, y);
        
        context.restore();
      };
    }
    
    // Add particle effects for explosions
    window.createExplosionParticles = function(x, y, context) {
      const particles = 20;
      for (let i = 0; i < particles; i++) {
        const angle = (Math.PI * 2 * i) / particles;
        const velocity = 2 + Math.random() * 3;
        const distance = 10 + Math.random() * 20;
        
        const px = x + Math.cos(angle) * distance;
        const py = y + Math.sin(angle) * distance;
        
        context.save();
        context.globalAlpha = 0.8 - (distance / 30);
        context.strokeStyle = HELIX_COLORS.explosion;
        context.lineWidth = 2;
        context.shadowBlur = 10;
        context.shadowColor = 'rgba(249, 198, 34, 0.6)';
        
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(px, py);
        context.stroke();
        
        context.restore();
      }
    };
    
    console.log('🎮 Helix Games theme applied to Asteroids!');
  });
})();
