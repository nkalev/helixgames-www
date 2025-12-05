// Helix Games Visual Enhancements for Asteroids
// Applies theme colors - safe and non-invasive

(function() {
  'use strict';
  
  const HELIX_COLORS = {
    primary: '#3cd2a5',
    cyan: '#3cd2a5'
  };
  
  // Wait for the game to load
  $(function() {
    const canvas = document.getElementById('canvas');
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    
    // Apply subtle CSS filter for better contrast
    const style = document.createElement('style');
    style.textContent = `
      #canvas {
        filter: brightness(1.05) contrast(1.05) hue-rotate(-10deg);
      }
    `;
    document.head.appendChild(style);
    
    // Override strokeStyle getter/setter to apply cyan color
    Object.defineProperty(context, 'strokeStyle', {
      get: function() {
        return this._strokeStyle || HELIX_COLORS.cyan;
      },
      set: function(value) {
        // Always use cyan instead of black/white
        if (value === 'black' || value === '#000000' || value === 'white' || value === '#ffffff') {
          this._strokeStyle = HELIX_COLORS.cyan;
        } else {
          this._strokeStyle = value;
        }
      },
      configurable: true
    });
    
    // Set initial stroke style
    context.strokeStyle = HELIX_COLORS.cyan;
    
    console.log('🎮 Helix Games theme applied to Asteroids!');
  });
})();
