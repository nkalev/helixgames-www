// Audio fix for Asteroids - completely disable audio to prevent freezing
// Audio playback causes game freezes due to browser autoplay policies

(function() {
  'use strict';
  
  console.log('🔧 Disabling audio to prevent game freezing...');
  
  // Override Audio constructor to prevent any audio creation
  var OriginalAudio = window.Audio;
  window.Audio = function(src) {
    console.log('Audio blocked:', src);
    // Return a mock audio object that does nothing
    return {
      play: function() { 
        return Promise.resolve(); // Always resolve successfully
      },
      pause: function() {},
      load: function() {},
      muted: true,
      currentTime: 0,
      duration: 0,
      volume: 0
    };
  };
  
  // Also patch SFX if it gets created
  var checkSFX = setInterval(function() {
    if (typeof SFX !== 'undefined') {
      clearInterval(checkSFX);
      
      // Force mute all audio
      SFX.muted = true;
      
      // Replace all SFX functions with safe no-ops
      SFX.laser = function() {
        // Do nothing - no audio, no freezing
        return { play: function() { return Promise.resolve(); } };
      };
      
      SFX.explosion = function() {
        // Do nothing - no audio, no freezing
        return { play: function() { return Promise.resolve(); } };
      };
      
      console.log('✅ Audio completely disabled - game will not freeze!');
    }
  }, 50);
  
  // Clear interval after 5 seconds to avoid memory leak
  setTimeout(function() {
    clearInterval(checkSFX);
  }, 5000);
})();
