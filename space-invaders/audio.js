// Web Audio System for Space Invaders
// Handles browser autoplay policies and provides procedural sound effects

class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.muted = false;
    this.initialized = false;
    this.masterVolume = 0.3; // Default volume (0-1)
  }
  
  // Initialize audio context (must be called after user interaction)
  init() {
    if (this.initialized) return true;
    
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
      this.enabled = true;
      console.log('Audio system initialized');
      return true;
    } catch (e) {
      console.warn('Web Audio API not supported', e);
      return false;
    }
  }
  
  // Resume context if suspended (browser autoplay policy)
  resume() {
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  }
  
  // Toggle mute
  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
  
  // Set master volume
  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
  
  // Play a tone
  playTone(frequency, duration, type = 'square', volume = 0.3) {
    if (!this.enabled || this.muted || !this.context) return;
    
    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      
      const adjustedVolume = volume * this.masterVolume;
      gainNode.gain.setValueAtTime(adjustedVolume, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    } catch (e) {
      console.warn('Error playing tone:', e);
    }
  }
  
  // Play a frequency sweep
  playSweep(startFreq, endFreq, duration, type = 'sawtooth', volume = 0.3) {
    if (!this.enabled || this.muted || !this.context) return;
    
    try {
      const oscillator = this.context.createOscillator();
      const gainNode = this.context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(startFreq, this.context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.context.currentTime + duration);
      
      const adjustedVolume = volume * this.masterVolume;
      gainNode.gain.setValueAtTime(adjustedVolume, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
      
      oscillator.start(this.context.currentTime);
      oscillator.stop(this.context.currentTime + duration);
    } catch (e) {
      console.warn('Error playing sweep:', e);
    }
  }
  
  // Play white noise burst
  playNoise(duration, volume = 0.2) {
    if (!this.enabled || this.muted || !this.context) return;
    
    try {
      const bufferSize = this.context.sampleRate * duration;
      const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.context.destination);
      
      const adjustedVolume = volume * this.masterVolume;
      gainNode.gain.setValueAtTime(adjustedVolume, this.context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
      
      source.start(this.context.currentTime);
    } catch (e) {
      console.warn('Error playing noise:', e);
    }
  }
  
  // === Space Invaders Sound Effects ===
  
  shoot() {
    // Laser shoot sound: quick high to low sweep
    this.playSweep(800, 200, 0.1, 'square', 0.2);
  }
  
  explosion() {
    // Explosion: noise burst with falling tone
    this.playNoise(0.15, 0.3);
    setTimeout(() => {
      this.playSweep(200, 50, 0.2, 'sawtooth', 0.2);
    }, 50);
  }
  
  alienHit() {
    // Alien hit: short descending tone
    this.playSweep(400, 100, 0.08, 'square', 0.25);
  }
  
  playerHit() {
    // Player death: dramatic falling sweep
    this.playNoise(0.1, 0.4);
    this.playSweep(600, 50, 0.4, 'sawtooth', 0.3);
  }
  
  mysteryShip() {
    // UFO sound: oscillating tone
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playTone(300 + (i % 2) * 50, 0.15, 'sine', 0.15);
      }, i * 150);
    }
  }
  
  alienStep(pitch = 1) {
    // Alien march sound: four distinct tones that speed up
    const baseFreq = 100 * pitch;
    this.playTone(baseFreq, 0.15, 'square', 0.15);
  }
  
  levelComplete() {
    // Victory jingle: ascending notes
    const notes = [262, 330, 392, 523]; // C, E, G, C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.2, 'square', 0.2);
      }, i * 150);
    });
  }
  
  gameOver() {
    // Game over: descending sad notes
    const notes = [392, 349, 330, 262]; // G, F, E, C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 0.3, 'sine', 0.25);
      }, i * 200);
    });
  }
}

// Create global audio manager instance
const audioManager = new AudioManager();

// Try to initialize on first user interaction
function initAudioOnInteraction() {
  if (!audioManager.initialized) {
    audioManager.init();
    audioManager.resume();
  }
}

// Listen for any user interaction to enable audio
['click', 'touchstart', 'keydown'].forEach(event => {
  document.addEventListener(event, initAudioOnInteraction, { once: true });
});
