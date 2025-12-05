// jQuery compatibility fix for Asteroids
// The game uses $.browser which was removed in jQuery 1.9+
// This polyfill restores $.browser for compatibility

(function() {
  'use strict';
  
  console.log('🔧 Applying jQuery $.browser polyfill...');
  
  // Detect browser using navigator.userAgent
  var ua = navigator.userAgent.toLowerCase();
  
  // Create $.browser object like old jQuery
  $.browser = {
    mozilla: /mozilla/.test(ua) && !/(compatible|webkit)/.test(ua),
    webkit: /webkit/.test(ua),
    opera: /opera/.test(ua),
    msie: /msie/.test(ua) && !/opera/.test(ua)
  };
  
  // For modern browsers, default to using isPointInPath
  // (it works fine in all modern browsers including Firefox)
  $.browser.mozilla = false;
  
  console.log('✅ jQuery $.browser polyfill applied!');
  console.log('Browser detection:', $.browser);
})();
