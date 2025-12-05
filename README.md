# 🎮 Helix Games

A free online gaming portal featuring classic arcade games playable directly in your browser. No downloads, no registration - just pure gaming fun!

## 🕹️ Available Games

### [2048](2048/index.html)
The addictive sliding tile puzzle game. Combine numbered tiles to reach the elusive 2048 tile!

**How to Play:**
- Use arrow keys (↑ ↓ ← →) to slide tiles
- Tiles with the same number merge when they touch
- Reach 2048 to win!

### [Asteroids](asteroids/index.html)
Classic arcade space shooter. Navigate your spaceship through an asteroid field and destroy everything in your path!

**Controls:**
- Arrow keys: Rotate and thrust
- Spacebar: Fire

### [Invasion](invasion/index.html)
Space invaders style arcade shooter. Defend Earth from waves of alien attackers!

**Controls:**
- Arrow keys: Move
- Spacebar: Fire

### [Tetris](tetris/index.html)
The legendary block-stacking puzzle game. Arrange falling tetrominoes to clear lines and score points!

**Controls:**
- Arrow keys ← →: Move piece left/right
- Arrow key ↓: Soft drop (one row)
- Arrow key ↑: Rotate piece
- Spacebar: Hard drop (instant)
- P: Pause
- R: Restart (when game over)

### [Pac-Man](pacman/index.html)
The classic maze arcade game! Navigate mazes, eat pellets, avoid ghosts, and use power pellets to turn the tables!

**Controls:**
- Arrow keys: Move Pac-Man up/down/left/right
- R: Restart (after game over)

**Features:**
- Classic maze design with tunnels
- 4 ghosts with unique behaviors
- Power pellets to eat ghosts
- Progressive difficulty
- Lives system

### [Space Invaders](space-invaders/index.html)
Defend Earth from waves of alien invaders in this classic shooter. Destroy them before they land!

**Controls:**
- Arrow keys ← →: Move ship
- Spacebar: Shoot
- R: Restart

**Features:**
- Destructible bunkers
- Mystery ship (UFO)
- Progressive difficulty
- Multiple alien types

## 🚀 Quick Start

This is a static HTML/JavaScript website. Simply serve the directory with any web server.

### Local Development

**Using Python:**
```bash
# Python 3
python3 -m http.server 8080

# Python 2
python -m SimpleHTTPServer 8080
```

**Using PHP:**
```bash
php -S localhost:8080
```

**Using Node.js (http-server):**
```bash
npx http-server -p 8080
```

Then open your browser to `http://localhost:8080`

### Production Deployment

1. Clone the repository:
   ```bash
   git clone https://github.com/nkalev/helixgames-www.git
   cd helixgames-www
   ```

2. Configure your web server (nginx, Apache, etc.) to serve the directory

3. Ensure your web server serves `index.html` as the default document

## 🛠️ Technology Stack

- **Frontend Framework:** Bootstrap 5
- **CSS:** Custom styling + Bootstrap components
- **JavaScript:** Vanilla JS + jQuery 3.7.1
- **Icons:** Bootstrap Icons, Font Awesome
- **Analytics:** Google Analytics (gtag.js)

## 📁 Project Structure

```
/var/www/html/
├── index.html              # Main landing page
├── assets/                 # Shared assets
│   ├── css/               # Stylesheets
│   ├── js/                # JavaScript libraries
│   ├── plugins/           # Third-party plugins
│   └── webfonts/          # Font files
├── 2048/                  # 2048 game
│   ├── index.html
│   ├── js/
│   └── style/
├── asteroids/             # Asteroids game
│   ├── index.html
│   └── game.js
├── invasion/              # Invasion game
│   ├── index.html
│   ├── engine.js
│   └── game.js
└── README.md
```

## 🔒 Security

- jQuery updated to latest stable version (3.7.1)
- CDN resources use Subresource Integrity (SRI) hashes
- No server-side code or database
- Static files only

## 🌐 Browser Compatibility

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Mobile Support

All games are mobile-responsive and playable on smartphones and tablets. Touch controls are supported where applicable.

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and formatting
- Test on multiple browsers before submitting
- Ensure mobile responsiveness
- Keep games lightweight and performant

## 📜 License

This project contains games with different licenses:

- **2048:** Licensed under MIT License (see `2048/LICENSE.txt`)
- **Asteroids:** Licensed under MIT License (see `asteroids/LICENSE`)
- **Invasion:** Licensed under MIT License (see `invasion/MIT-LICENSE.txt`)

## 🐛 Known Issues

None currently. Please [report issues](https://github.com/nkalev/helixgames-www/issues) if you find any bugs.

## 📈 Analytics

This site uses Google Analytics to understand visitor behavior and improve user experience. No personal data is collected or stored.

## 🔮 Future Plans

- [ ] Add more classic arcade games
- [ ] Implement high score leaderboards
- [ ] Add multiplayer support
- [ ] Progressive Web App (PWA) support
- [ ] Offline gameplay capability
- [ ] Achievement system

## 👥 Authors

**Helix Games Team**
- Website: [https://github.com/nkalev/helixgames-www](https://github.com/nkalev/helixgames-www)

## 🙏 Acknowledgments

- 2048 game original by Gabriele Cirulli
- Asteroids game inspired by the classic Atari game
- Invasion game inspired by Space Invaders

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Made with ❤️ for gamers everywhere**

*Last updated: December 2025*
