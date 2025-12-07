# Helix Games - Database Schema

## Overview
This document defines the database schema for the Helix Games platform, including user management, scores, achievements, and leaderboards.

## Tables

### users
Stores user account information.

```sql
CREATE TABLE users (
    id INT PRIMARY_KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    total_score INT DEFAULT 0,
    games_played INT DEFAULT 0
);
```

### high_scores
Stores player high scores for each game.

```sql
CREATE TABLE high_scores (
    id INT PRIMARY_KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    game_name VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    level_reached INT,
    achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_game_score (game_name, score DESC),
    INDEX idx_user_game (user_id, game_name)
);
```

### achievements
Defines available achievements across all games.

```sql
CREATE TABLE achievements (
    id INT PRIMARY_KEY AUTO_INCREMENT,
    game_name VARCHAR(50) NOT NULL,
    achievement_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    icon_emoji VARCHAR(10),
    points INT DEFAULT 10,
    rarity ENUM('common', 'rare', 'epic', 'legendary') DEFAULT 'common',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### user_achievements
Tracks which achievements users have unlocked.

```sql
CREATE TABLE user_achievements (
    id INT PRIMARY_KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    achievement_id INT NOT NULL,
    unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_achievement (user_id, achievement_id),
    INDEX idx_user_achievements (user_id)
);
```

### game_sessions
Tracks individual game sessions for analytics.

```sql
CREATE TABLE game_sessions (
    id INT PRIMARY_KEY AUTO_INCREMENT,
    user_id INT,
    game_name VARCHAR(50) NOT NULL,
    score INT,
    duration_seconds INT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_sessions (user_id, started_at),
    INDEX idx_game_sessions (game_name, started_at)
);
```

## Game Names (Reference)
- `2048`
- `asteroids`
- `invasion`
- `lode-runner`
- `pacman`
- `space-invaders`
- `tetris`

## Achievement Examples

### Global Achievements
- **First Steps**: Play your first game (10 points)
- **Dedicated Player**: Play 10 games (25 points)
- **Achievement Hunter**: Unlock 5 achievements (50 points)
- **Master Gamer**: Unlock all achievements in one game (100 points)
- **Completionist**: Unlock all achievements (500 points)

### Game-Specific Examples

#### Tetris
- **Line Clearer**: Clear 100 lines
- **Tetris Master**: Get 5 Tetrises in one game
- **Speed Demon**: Reach level 10
- **Perfectionist**: Clear 4 lines with no gaps

#### Pac-Man
- **Dot Collector**: Eat 1000 dots
- **Ghost Hunter**: Eat 50 ghosts
- **Perfect Level**: Complete a level with all dots and ghosts
- **Marathon Runner**: Reach level 5

#### Space Invaders
- **Sharpshooter**: 90% accuracy in one game
- **Wave Clear**: Clear 10 waves
- **UFO Hunter**: Destroy 10 UFOs
- **Survivor**: Complete a game without dying

## API Endpoints (Future Implementation)

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get user profile

### Scores
- `POST /api/scores/submit` - Submit score
- `GET /api/scores/leaderboard/:game` - Get leaderboard
- `GET /api/scores/user/:userId` - Get user's scores

### Achievements
- `GET /api/achievements/:game` - Get game achievements
- `POST /api/achievements/unlock` - Unlock achievement
- `GET /api/achievements/user/:userId` - Get user achievements

## LocalStorage Structure (Temporary - Until Backend)

```javascript
// Store user data in browser
localStorage.setItem('helixGames_user', JSON.stringify({
    id: 'local_user_123',
    username: 'player',
    email: 'player@example.com',
    displayName: 'Player One',
    createdAt: Date.now()
}));

// Store scores
localStorage.setItem('helixGames_scores', JSON.stringify({
    'tetris': [100, 200, 300],
    'pacman': [500, 600],
    // ... other games
}));

// Store achievements
localStorage.setItem('helixGames_achievements', JSON.stringify({
    'tetris_first_game': { unlockedAt: Date.now() },
    'pacman_dot_collector': { unlockedAt: Date.now() }
}));
```

## Notes
- All scores are integers
- Timestamps use UNIX epoch or ISO 8601
- Password hashes use bcrypt with salt rounds = 12
- Email validation required on registration
- Username must be 3-50 characters, alphanumeric + underscore
