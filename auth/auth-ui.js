// Helix Games - Authentication UI Components

class AuthUI {
  constructor() {
    this.createModals();
    this.attachEventListeners();
    this.updateUIState();
  }
  
  // Create modal HTML
  createModals() {
    const modalsHTML = `
      <!-- Login Modal -->
      <div id="login-modal" class="auth-modal-overlay">
        <div class="auth-modal">
          <div class="auth-modal-header">
            <h2 class="auth-modal-title">Welcome Back!</h2>
            <button class="auth-modal-close" onclick="authUI.closeModal('login-modal')">×</button>
          </div>
          <div class="auth-modal-body">
            <div id="login-error" class="auth-error"></div>
            <form id="login-form" class="auth-form" onsubmit="authUI.handleLogin(event)">
              <div class="auth-form-group">
                <label class="auth-form-label">Username or Email</label>
                <input type="text" class="auth-form-input" id="login-username" placeholder="Enter username or email" required>
              </div>
              <div class="auth-form-group">
                <label class="auth-form-label">Password</label>
                <input type="password" class="auth-form-input" id="login-password" placeholder="Enter password" required>
              </div>
              <button type="submit" class="auth-btn auth-btn-primary">
                <i class="bi bi-box-arrow-in-right"></i>
                Login
              </button>
            </form>
          </div>
          <div class="auth-modal-footer">
            Don't have an account? 
            <a class="auth-link" onclick="authUI.switchModal('login-modal', 'register-modal')">Sign up</a>
          </div>
        </div>
      </div>
      
      <!-- Register Modal -->
      <div id="register-modal" class="auth-modal-overlay">
        <div class="auth-modal">
          <div class="auth-modal-header">
            <h2 class="auth-modal-title">Create Account</h2>
            <button class="auth-modal-close" onclick="authUI.closeModal('register-modal')">×</button>
          </div>
          <div class="auth-modal-body">
            <div id="register-error" class="auth-error"></div>
            <div id="register-success" class="auth-success"></div>
            <form id="register-form" class="auth-form" onsubmit="authUI.handleRegister(event)">
              <div class="auth-form-group">
                <label class="auth-form-label">Username</label>
                <input type="text" class="auth-form-input" id="register-username" placeholder="Choose a username" required minlength="3">
              </div>
              <div class="auth-form-group">
                <label class="auth-form-label">Email</label>
                <input type="email" class="auth-form-input" id="register-email" placeholder="your@email.com" required>
              </div>
              <div class="auth-form-group">
                <label class="auth-form-label">Display Name</label>
                <input type="text" class="auth-form-input" id="register-displayname" placeholder="How should we call you?">
              </div>
              <div class="auth-form-group">
                <label class="auth-form-label">Password</label>
                <input type="password" class="auth-form-input" id="register-password" placeholder="Create a password" required minlength="6">
              </div>
              <button type="submit" class="auth-btn auth-btn-primary">
                <i class="bi bi-person-plus"></i>
                Create Account
              </button>
            </form>
          </div>
          <div class="auth-modal-footer">
            Already have an account? 
            <a class="auth-link" onclick="authUI.switchModal('register-modal', 'login-modal')">Login</a>
          </div>
        </div>
      </div>
      
    `;
    
    // Insert modals at end of body
    document.body.insertAdjacentHTML('beforeend', modalsHTML);
    
    // Insert auth controls into header menu
    this.insertHeaderControls();
  }
  
  // Insert header controls (login button or user menu)
  insertHeaderControls() {
    const headerMenu = document.querySelector('#header .menu');
    if (!headerMenu) return;
    
    const authControlsHTML = `
      <!-- Games Dropdown Menu -->
      <div class="games-dropdown">
        <button class="games-dropdown-trigger" onclick="authUI.toggleGamesMenu()">
          <i class="bi bi-joystick"></i>
          <span>Games</span>
          <i class="bi bi-chevron-down"></i>
        </button>
        <div id="games-dropdown-menu" class="games-dropdown-menu">
          <div class="games-menu-header">Choose a Game</div>
          <a href="2048/index.html" class="games-menu-item">
            <i class="bi bi-grid-3x3"></i>
            <span>2048</span>
          </a>
          <a href="asteroids/index.html" class="games-menu-item">
            <i class="bi bi-rocket"></i>
            <span>Asteroids</span>
          </a>
          <a href="invasion/index.html" class="games-menu-item">
            <i class="bi bi-alien"></i>
            <span>Alien Invasion</span>
          </a>
          <a href="lode-runner/index.html" class="games-menu-item">
            <i class="bi bi-ladder"></i>
            <span>Lode Runner</span>
          </a>
          <a href="pacman/index.html" class="games-menu-item">
            <i class="bi bi-circle"></i>
            <span>Pac-Man</span>
          </a>
          <a href="space-invaders/index.html" class="games-menu-item">
            <i class="bi bi-airplane"></i>
            <span>Space Invaders</span>
          </a>
          <a href="tetris/index.html" class="games-menu-item">
            <i class="bi bi-square"></i>
            <span>Tetris</span>
          </a>
        </div>
      </div>
      
      <!-- Auth Controls -->
      <div id="auth-controls" class="auth-controls">
        <!-- Login/Register Buttons (shown when logged out) -->
        <div id="auth-buttons" class="auth-buttons">
          <button class="auth-header-btn auth-header-btn-login" onclick="authUI.openModal('login-modal')">
            <i class="bi bi-box-arrow-in-right"></i>
            <span>Login</span>
          </button>
          <button class="auth-header-btn auth-header-btn-register" onclick="authUI.openModal('register-modal')">
            <i class="bi bi-person-plus"></i>
            <span>Sign Up</span>
          </button>
        </div>
        
        <!-- User Menu (shown when logged in) -->
        <div id="user-menu" class="user-menu" style="display: none;">
          <div class="user-menu-trigger" onclick="authUI.toggleUserMenu()">
            <img id="user-avatar" class="user-avatar" src="" alt="Avatar">
            <span id="user-display-name" class="user-name"></span>
            <i class="bi bi-chevron-down"></i>
          </div>
          <div id="user-menu-dropdown" class="user-menu-dropdown">
            <div class="user-menu-item" onclick="authUI.showProfile()">
              <i class="bi bi-person"></i>
              Profile
            </div>
            <div class="user-menu-item" onclick="authUI.showAchievements()">
              <i class="bi bi-trophy"></i>
              Achievements
            </div>
            <div class="user-menu-item" onclick="authUI.showLeaderboards()">
              <i class="bi bi-bar-chart"></i>
              Leaderboards
            </div>
            <div class="user-menu-item" onclick="authUI.handleLogout()">
              <i class="bi bi-box-arrow-right"></i>
              Logout
            </div>
          </div>
        </div>
      </div>
    `;
    
    headerMenu.innerHTML = authControlsHTML;
  }
  
  // Attach event listeners
  attachEventListeners() {
    // Close modals on overlay click
    document.querySelectorAll('.auth-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal(overlay.id);
        }
      });
    });
    
    // Attach to signup button on homepage
    const signupBtn = document.getElementById('signup-btn');
    if (signupBtn) {
      signupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.openModal('register-modal');
      });
    }
    
    // Close user menu dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const userMenu = document.getElementById('user-menu');
      const dropdown = document.getElementById('user-menu-dropdown');
      
      if (userMenu && dropdown && !userMenu.contains(e.target)) {
        dropdown.classList.remove('active');
      }
      
      // Close games menu when clicking outside
      const gamesDropdown = document.querySelector('.games-dropdown');
      const gamesMenu = document.getElementById('games-dropdown-menu');
      
      if (gamesDropdown && gamesMenu && !gamesDropdown.contains(e.target)) {
        gamesMenu.classList.remove('active');
      }
    });
  }
  
  // Open modal
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      // Clear any previous errors
      const errorDiv = modal.querySelector('.auth-error');
      if (errorDiv) errorDiv.classList.remove('active');
    }
  }
  
  // Close modal
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  }
  
  // Switch between modals
  switchModal(fromId, toId) {
    this.closeModal(fromId);
    setTimeout(() => this.openModal(toId), 300);
  }
  
  // Handle login
  handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    const result = window.helixAuth.login(username, password);
    
    if (result.success) {
      this.closeModal('login-modal');
      this.updateUIState();
      this.showNotification('Welcome back, ' + result.user.displayName + '!', 'success');
    } else {
      this.showError('login-error', result.error);
    }
  }
  
  // Handle registration
  handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const displayName = document.getElementById('register-displayname').value;
    const password = document.getElementById('register-password').value;
    
    const result = window.helixAuth.register(username, email, password, displayName);
    
    if (result.success) {
      this.showSuccess('register-success', 'Account created successfully!');
      setTimeout(() => {
        this.closeModal('register-modal');
        this.updateUIState();
        this.showNotification('Welcome to Helix Games, ' + result.user.displayName + '!', 'success');
      }, 1500);
    } else {
      this.showError('register-error', result.error);
    }
  }
  
  // Handle logout
  handleLogout() {
    window.helixAuth.logout();
    this.updateUIState();
    this.toggleUserMenu();
    this.showNotification('You have been logged out', 'info');
    
    // Redirect to homepage if on protected page
    const protectedPages = ['profile.html', 'achievements.html', 'leaderboards.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  }
  
  // Update UI based on auth state
  updateUIState() {
    const user = window.helixAuth.getCurrentUser();
    const userMenu = document.getElementById('user-menu');
    const authButtons = document.getElementById('auth-buttons');
    const signupBtn = document.getElementById('signup-btn'); // Homepage button
    
    if (user) {
      // Show user menu in header
      if (userMenu) {
        userMenu.style.display = 'block';
        const displayNameEl = document.getElementById('user-display-name');
        const avatarEl = document.getElementById('user-avatar');
        if (displayNameEl) displayNameEl.textContent = user.displayName;
        if (avatarEl) avatarEl.src = user.avatarUrl;
      }
      
      // Hide auth buttons in header
      if (authButtons) authButtons.style.display = 'none';
      
      // Hide signup button on homepage
      if (signupBtn) signupBtn.style.display = 'none';
    } else {
      // Hide user menu
      if (userMenu) userMenu.style.display = 'none';
      
      // Show auth buttons in header
      if (authButtons) authButtons.style.display = 'flex';
      
      // Show signup button on homepage
      if (signupBtn) signupBtn.style.display = 'inline-flex';
    }
  }
  
  // Toggle user menu dropdown
  toggleUserMenu() {
    const dropdown = document.getElementById('user-menu-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }
  
  // Toggle games menu dropdown
  toggleGamesMenu() {
    const dropdown = document.getElementById('games-dropdown-menu');
    if (dropdown) {
      dropdown.classList.toggle('active');
    }
  }
  
  // Show error message
  showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.add('active');
      setTimeout(() => errorDiv.classList.remove('active'), 5000);
    }
  }
  
  // Show success message
  showSuccess(elementId, message) {
    const successDiv = document.getElementById(elementId);
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.classList.add('active');
      setTimeout(() => successDiv.classList.remove('active'), 3000);
    }
  }
  
  // Show notification (toast)
  showNotification(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#3cd2a5' : '#1a1f23'};
      color: ${type === 'success' ? '#000' : '#fff'};
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  
  // Show profile page
  showProfile() {
    this.toggleUserMenu();
    window.location.href = 'profile.html';
  }
  
  // Show achievements
  showAchievements() {
    this.toggleUserMenu();
    window.location.href = 'achievements.html';
  }
  
  // Show leaderboards
  showLeaderboards() {
    this.toggleUserMenu();
    window.location.href = 'leaderboards.html';
  }
}

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.authUI = new AuthUI();
});

// Add CSS for toast animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
