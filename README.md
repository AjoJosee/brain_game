# ⚡ BrainBoost v2.0 - Node 24 Cognitive Training Platform

> Modern Senior & Adult Brain Training Platform powered by **Node.js 24** and native zero-dependency `node:sqlite` DatabaseSync.

![Node 24](https://img.shields.io/badge/Node.js-v24.18.0_LTS-green.svg)
![SQLite](https://img.shields.io/badge/Database-Node_24_node:sqlite-blue.svg)
![License](https://img.shields.io/badge/License-ISC-purple.svg)

---

## 🌟 Overview

**BrainBoost v2.0** evolves the original brain game MVP into a full-stack, multi-dimensional cognitive assessment and brain training platform. It evaluates player performance across 5 key cognitive domains, calculates real-time **Mental Age**, maintains streak statistics, awards achievements, and provides global leaderboards.

---

## 🚀 Key Features & Highlights

### ⚡ 1. Node 24 Backend & Native SQLite (`node:sqlite`)
- Built with **Node.js 24 (v24.18.0 LTS)** using native ES module syntax (`type: module`).
- Zero external database drivers required! Powered by Node 24's built-in `node:sqlite` (`DatabaseSync`) engine.
- Persistent SQLite database storing users, multi-domain score logs, and historical mental age trajectory.

### 🧠 2. Multi-Dimensional Mental Age Assessment Algorithm
Calculates individual domain ages and overall mental age based on speed, accuracy, difficulty, and streak consistency:
- **Memory Domain** (*Memory Match*)
- **Focus & Attention Domain** (*Sequence Recall*, *Stroop Focus Test*)
- **Processing Speed Domain** (*Reaction Time*)
- **Numerical Reasoning Domain** (*Mental Math*)
- **Verbal & Cognitive Flexibility** (*Word Scramble*)

### 🎮 3. Expanded 6-Game Suite with 4 Difficulty Levels
Every game supports **Easy**, **Medium**, **Hard**, and **Master** difficulty modes:
1. 🧠 **Memory Match**: 3D card flips with adjustable grid sizes (up to 6x4).
2. ⚡ **Sequence Recall**: Glowing neon Simon-says pads with Web Audio synth tones.
3. 🔢 **Mental Math**: Timed equations (+, -, *, /) with streak multipliers.
4. 🔤 **Word Scramble**: Interactive letter tiles with hint & clear tools.
5. ⚡ **Reaction Time**: Millisecond-precision reflex test with false start protection.
6. 🎯 **Stroop Focus Test** *(New)*: Executive control test measuring color-word interference.

### 🎵 4. Web Audio API Sound Synthesizer (`js/audio.js`)
- Real-time audio synthesis (card flips, match chimes, Simon pitch tones, fanfare) with no external audio file assets needed.
- Mute/Unmute toggle built into the navigation bar.

### 🎨 5. Modern Dark Glassmorphism UI & Analytics
- Dark glassmorphism aesthetics (`Outfit` & `Inter` Google Fonts, cyan/emerald glowing accents).
- Interactive Dashboard with domain breakdown progress bars, daily streak counter, recent session history, and global leaderboards.
- Offline fallback via LocalStorage if network connectivity is interrupted.

---

## 🛠️ Project Structure

```text
brain_game/
├── server.js                      # Node 24 Express server & native node:sqlite database engine
├── package.json                   # Project scripts and dependencies
├── .gitignore                     # Ignored files (node_modules, db)
├── SYSTEM_CHANGES_AND_ROLLBACK.txt # System audit log and step-by-step rollback commands
├── index.html                     # Main SPA container & navigation layout
├── css/
│   └── style.css                  # Dark glassmorphism design system & game animations
└── js/
    ├── audio.js                   # Web Audio API sound synthesizer
    ├── api.js                     # REST API client & offline LocalStorage fallback adapter
    ├── games.js                   # 6 interactive cognitive training games
    └── main.js                    # SPA view router, dashboard controller & game over modals
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System status, node version, and database engine info |
| `POST` | `/api/user` | Register or retrieve user profile with daily streak counter |
| `GET` | `/api/user/:userId/stats` | Fetch domain mental ages, high scores, and score history |
| `POST` | `/api/scores` | Submit game score, calculate updated mental age & badges |
| `GET` | `/api/leaderboard` | Top 10 lowest mental age players & per-game high scores |
| `GET` | `/api/daily-challenge` | Daily recommended brain workout tasks |

---

## 💻 Getting Started

### Prerequisites
- **Node.js 24+** installed globally.

### Installation & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   npm start
   ```

3. Open your browser at:
   ```text
   http://localhost:3000
   ```

---

## 📄 License
Licensed under the [ISC License](LICENSE).
