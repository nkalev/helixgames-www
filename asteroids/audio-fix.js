// Audio fix for Asteroids - prevent freezing on sound playback
// This patches the SFX audio to be non-blocking

(function() {
  'use strict';
  
  // Wait for game to load
  setTimeout(function() {
    if (typeof SFX === 'undefined') return;
    
    console.log('🔧 Applying audio safety patch...');
    
    // Create safe wrappers for audio
    var originalLaser = SFX.laser;
    var originalExplosion = SFX.explosion;
    
    // Safe laser function
    SFX.laser = function() {
      try {
        if (originalLaser && typeof originalLaser === 'function') {
          var audio = originalLaser.call(this);
          if (audio && audio.play) {
            var playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(function(e) {
                // Silently ignore autoplay errors
                console.log('Audio play prevented (this is normal)');
              });
            }
          }
        }
      } catch (e) {
        // Silently fail - don't freeze the game
        console.log('Audio error (non-critical):', e.message);
      }
    };
    
    // Safe explosion function
    SFX.explosion = function() {
      try {
        if (originalExplosion && typeof originalExplosion === 'function') {
          var audio = originalExplosion.call(this);
          if (audio && audio.play) {
            var playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(function(e) {
                // Silently ignore autoplay errors
                console.log('Audio play prevented (this is normal)');
              });
            }
          }
        }
      } catch (e) {
        // Silently fail - don't freeze the game
        console.log('Audio error (non-critical):', e.message);
      }
    };
    
    console.log('✅ Audio safety patch applied!');
  }, 100);
})();
