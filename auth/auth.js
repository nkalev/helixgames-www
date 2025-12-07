// Helix Games - Authentication System (Client-Side with localStorage)
// This will be replaced with server-side auth in production

class HelixAuth {
  constructor() {
    this.storageKey = 'helixGames_user';
    this.scoresKey = 'helixGames_scores';
    this.achievementsKey = 'helixGames_achievements';
    this.currentUser = this.getCurrentUser();
  }
  
  // Get current logged-in user
  getCurrentUser() {
    const userData = localStorage.getItem(this.storageKey);
    return userData ? JSON.parse(userData) : null;
  }
  
  // Check if user is logged in
  isLoggedIn() {
    return this.currentUser !== null;
  }
  
  // Register new user
  register(username, email, password, displayName) {
    // Validate inputs
    if (!username || username.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters' };
    }
    
    if (!email || !this.validateEmail(email)) {
      return { success: false, error: 'Invalid email address' };
    }
    
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }
    
    // Check if user already exists (in real app, this would be server-side)
    const existingUsers = this.getAllUsers();
    if (existingUsers.find(u => u.username === username)) {
      return { success: false, error: 'Username already taken' };
    }
    if (existingUsers.find(u => u.email === email)) {
      return { success: false, error: 'Email already registered' };
    }
    
    // Create new user
    const user = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      username: username,
      email: email,
      displayName: displayName || username,
      avatarUrl: this.getGravatarUrl(email),
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      totalScore: 0,
      gamesPlayed: 0,
      achievements: []
    };
    
    // Save user
    this.saveUser(user);
    existingUsers.push({ 
      id: user.id, 
      username: user.username, 
      email: user.email 
    });
    localStorage.setItem('helixGames_allUsers', JSON.stringify(existingUsers));
    
    // Log in the user
    this.currentUser = user;
    
    return { success: true, user: user };
  }
  
  // Login
  login(usernameOrEmail, password) {
    const existingUsers = this.getAllUsers();
    const user = existingUsers.find(
      u => u.username === usernameOrEmail || u.email === usernameOrEmail
    );
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // In real app, verify password hash here
    // For now, just load the user
    
    const fullUser = this.loadUserData(user.id);
    if (!fullUser) {
      return { success: false, error: 'User data not found' };
    }
    
    fullUser.lastLogin = new Date().toISOString();
    this.saveUser(fullUser);
    this.currentUser = fullUser;
    
    return { success: true, user: fullUser };
  }
  
  // Logout
  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    return { success: true };
  }
  
  // Save user data
  saveUser(user) {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    localStorage.setItem('helixGames_user_' + user.id, JSON.stringify(user));
  }
  
  // Load user data
  loadUserData(userId) {
    const userData = localStorage.getItem('helixGames_user_' + userId);
    return userData ? JSON.parse(userData) : null;
  }
  
  // Get all users (for checking duplicates)
  getAllUsers() {
    const users = localStorage.getItem('helixGames_allUsers');
    return users ? JSON.parse(users) : [];
  }
  
  // Submit score
  submitScore(gameName, score, level = null) {
    if (!this.isLoggedIn()) {
      return { success: false, error: 'Must be logged in to save scores' };
    }
    
    const scores = this.getScores(gameName);
    const newScore = {
      score: score,
      level: level,
      achievedAt: new Date().toISOString()
    };
    
    scores.push(newScore);
    scores.sort((a, b) => b.score - a.score);
    
    // Keep only top 10 scores per game
    const topScores = scores.slice(0, 10);
    
    // Save scores
    const allScores = this.getAllScores();
    allScores[gameName] = topScores;
    localStorage.setItem(this.scoresKey + '_' + this.currentUser.id, JSON.stringify(allScores));
    
    // Update user stats
    this.currentUser.gamesPlayed++;
    const personalBest = topScores[0].score;
    if (score === personalBest) {
      this.currentUser.totalScore += score;
    }
    this.saveUser(this.currentUser);
    
    // Check for achievements
    this.checkAchievements(gameName, score, level);
    
    return { 
      success: true, 
      isPersonalBest: score === personalBest,
      rank: scores.findIndex(s => s.score === score && s.achievedAt === newScore.achievedAt) + 1
    };
  }
  
  // Get user's scores for a game
  getScores(gameName) {
    if (!this.isLoggedIn()) return [];
    
    const allScores = this.getAllScores();
    return allScores[gameName] || [];
  }
  
  // Get all scores
  getAllScores() {
    if (!this.isLoggedIn()) return {};
    
    const scores = localStorage.getItem(this.scoresKey + '_' + this.currentUser.id);
    return scores ? JSON.parse(scores) : {};
  }
  
  // Get leaderboard for a game
  getLeaderboard(gameName, limit = 10) {
    const allUsers = this.getAllUsers();
    const leaderboard = [];
    
    allUsers.forEach(user => {
      const userScores = localStorage.getItem(this.scoresKey + '_' + user.id);
      if (userScores) {
        const scores = JSON.parse(userScores);
        if (scores[gameName] && scores[gameName].length > 0) {
          const topScore = scores[gameName][0];
          leaderboard.push({
            username: user.username,
            score: topScore.score,
            level: topScore.level,
            achievedAt: topScore.achievedAt
          });
        }
      }
    });
    
    leaderboard.sort((a, b) => b.score - a.score);
    return leaderboard.slice(0, limit);
  }
  
  // Unlock achievement
  unlockAchievement(achievementKey, achievementData) {
    if (!this.isLoggedIn()) return { success: false };
    
    const achievements = this.getAchievements();
    
    // Check if already unlocked
    if (achievements[achievementKey]) {
      return { success: false, alreadyUnlocked: true };
    }
    
    achievements[achievementKey] = {
      ...achievementData,
      unlockedAt: new Date().toISOString()
    };
    
    localStorage.setItem(this.achievementsKey + '_' + this.currentUser.id, JSON.stringify(achievements));
    
    // Update user
    this.currentUser.achievements = Object.keys(achievements);
    this.saveUser(this.currentUser);
    
    return { success: true, achievement: achievements[achievementKey] };
  }
  
  // Get user achievements
  getAchievements() {
    if (!this.isLoggedIn()) return {};
    
    const achievements = localStorage.getItem(this.achievementsKey + '_' + this.currentUser.id);
    return achievements ? JSON.parse(achievements) : {};
  }
  
  // Check and unlock achievements
  checkAchievements(gameName, score, level) {
    const achievements = {
      // First game
      'first_game': {
        title: 'First Steps',
        description: 'Play your first game',
        icon: '🎮',
        points: 10,
        condition: () => this.currentUser.gamesPlayed === 1
      },
      // 10 games
      'dedicated_player': {
        title: 'Dedicated Player',
        description: 'Play 10 games',
        icon: '🏃',
        points: 25,
        condition: () => this.currentUser.gamesPlayed >= 10
      },
      // High score milestones
      [`${gameName}_1000`]: {
        title: '1000 Club',
        description: `Score 1000+ in ${gameName}`,
        icon: '🌟',
        points: 50,
        condition: () => score >= 1000
      },
      [`${gameName}_5000`]: {
        title: '5000 Master',
        description: `Score 5000+ in ${gameName}`,
        icon: '⭐',
        points: 100,
        condition: () => score >= 5000
      }
    };
    
    Object.keys(achievements).forEach(key => {
      const ach = achievements[key];
      if (ach.condition && ach.condition()) {
        this.unlockAchievement(key, ach);
      }
    });
  }
  
  // Helper: Validate email
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  // Helper: Get Gravatar URL
  getGravatarUrl(email) {
    // Simple hash for demo (in production use MD5)
    const hash = email.toLowerCase().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `https://www.gravatar.com/avatar/${Math.abs(hash)}?d=identicon&s=200`;
  }
}

// Create global instance
window.helixAuth = new HelixAuth();
