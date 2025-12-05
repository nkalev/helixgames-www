// Safe audio enabler for Asteroids
// Enables audio with proper error handling to prevent freezing

(function() {
  'use strict';
  
  console.log('🔊 Enabling audio with safety wrapper...');
  
  // Don't override Audio constructor - let it load normally
  // But wrap SFX functions with error handling
  
  var checkSFX = setInterval(function() {
    if (typeof SFX !== 'undefined' && SFX.laser) {
      clearInterval(checkSFX);
      
      console.log('🔧 Wrapping audio functions with error handlers...');
      
      // Store original functions
      var originalLaser = SFX.laser;
      var originalExplosion = SFX.explosion;
      
      // Wrap laser with error handling
      SFX.laser = function() {
        try {
          var audio = originalLaser.call(this);
          if (audio && typeof audio.play === 'function') {
            var playPromise = audio.play();
            if (playPromise && playPromise.catch) {
              playPromise.catch(function(error) {
                // Browser blocked autoplay - this is normal
                console.log('Audio autoplay blocked (normal browser behavior)');
              });
            }
          }
          return audio;
        } catch (error) {
          console.log('Audio error (non-critical):', error.message);
          return { play: function() { return Promise.resolve(); } };
        }
      };
      
      // Wrap explosion with error handling
      SFX.explosion = function() {
        try {
          var audio = originalExplosion.call(this);
          if (audio && typeof audio.play === 'function') {
            var playPromise = audio.play();
            if (playPromise && playPromise.catch) {
              playPromise.catch(function(error) {
                // Browser blocked autoplay - this is normal
                console.log('Audio autoplay blocked (normal browser behavior)');
              });
            }
          }
          return audio;
        } catch (error) {
          console.log('Audio error (non-critical):', error.message);
          return { play: function() { return Promise.resolve(); } };
        }
      };
      
      console.log('✅ Audio enabled with safety wrappers!');
      console.log('Note: Audio may not play until you interact with the page');
      console.log('Press M to toggle mute, or just start playing');
    }
  }, 50);
  
  // Clear interval after 5 seconds
  setTimeout(function() {
    clearInterval(checkSFX);
  }, 5000);
})();
