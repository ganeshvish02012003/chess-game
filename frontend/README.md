# ♟️ Chess Game

A modern, responsive, and feature-rich **Chess Game** built with **React + Vite**.
Play chess against a **Real Computer AI powered by Stockfish**, or enjoy a clean local chess experience with smooth animations, timers, sounds, move history, captured pieces, and multiple board themes.


## ✨ Features

### 🤖 Real Computer AI

* Play against a real chess engine powered by **Stockfish**
* Multiple difficulty levels
* Computer automatically calculates legal moves
* AI plays as Black when enabled
* No paid AI API required

### ♟️ Complete Chess Gameplay

* Full standard chess rules
* Legal move validation
* Check detection
* Checkmate detection
* Stalemate detection
* Draw detection
* Castling
* Pawn promotion
* En passant
* Captured pieces display

### ⏱️ Chess Clock

* Separate timer for White and Black
* Timer runs according to the current player's turn
* Game automatically handles time expiration
* Clean chess-clock style UI

### 📜 Move History

* Complete move history
* Standard chess notation
* Easy-to-read move list
* Automatically updates after every move
* Supports undo restoration

### ↩️ Undo Move

* Undo the latest move
* Restores captured pieces
* Restores timers
* Restores move history
* Restores board position
* Works correctly with Computer AI

### 🎵 Chess Sounds

Includes sound effects for:

* Piece movement
* Capture
* Check
* Checkmate
* Game events

Background music support can also be enabled.

### 🎨 Board Themes

Choose from different visual styles for the chess board and pieces.

### ✨ Smooth Animations

* Smooth piece movement
* Capture animations
* Last-move highlighting
* Check highlighting
* Responsive transitions

### 📱 Fully Responsive

Designed for:

* 💻 Desktop
* 🖥️ Laptop
* 📱 Mobile
* 📲 Tablet

The board automatically adjusts its size while maintaining the correct **8×8 chess-board ratio**.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* Tailwind CSS
* chess.js
* Stockfish

### Chess Engine

**Stockfish**

Stockfish is used locally as the chess engine for Computer AI gameplay.

### State & Game Logic

* React Hooks
* `useState`
* `useEffect`
* `useCallback`
* `useRef`
* chess.js

## ♟️ How to Play

### Player vs Computer

1. Start a new game.
2. Select your preferred difficulty.
3. Choose your side.
4. Make your move.
5. Stockfish calculates the computer's response.
6. Continue until checkmate, draw, or timeout.

### Player vs Player

Two players can play on the same device using the chess board.

---

## 🤖 Stockfish AI

The project uses **Stockfish** as the chess engine.

The engine evaluates the current board position and searches for the best possible move based on the selected difficulty.

### AI Flow

```text
Player Move
     ↓
Update Chess Position
     ↓
Check Game Status
     ↓
Send Position to Stockfish
     ↓
Stockfish Calculates Move
     ↓
Receive Best Move
     ↓
Update Chess Board
```

---

## 🎯 Game States

The game handles important chess states including:

```text
Normal Position
      │
      ├── Check
      │
      ├── Checkmate
      │
      ├── Stalemate
      │
      ├── Draw
      │
      └── Time Expired
```

---


## 🎨 UI Highlights

The interface focuses on a modern gaming experience:

* Dark modern UI
* Responsive chess board
* Player timers
* Move history
* Captured pieces
* AI status
* Game controls
* Board themes
* Smooth transitions
* Mobile-friendly layout

---

## 📱 Responsive Design

The chess board dynamically scales according to the available screen space.

### Desktop

```text
┌─────────────────────────────────────────┐
│              Chess Game                 │
│                                         │
│       ┌─────────────────────┐           │
│       │                     │           │
│       │     CHESS BOARD     │           │
│       │                     │           │
│       └─────────────────────┘           │
│                                         │
└─────────────────────────────────────────┘
```

### Mobile

```text
┌───────────────────────┐
│      Chess Game       │
│                       │
│    ┌─────────────┐    │
│    │             │    │
│    │    BOARD    │    │
│    │             │    │
│    └─────────────┘    │
│                       │
│   Timer / Controls    │
└───────────────────────┘
```

The board always maintains the correct **1:1 aspect ratio**.

---

## 🧩 Main Components

### `ChessBoard.jsx`

Responsible for:

* Rendering the chess board
* Rendering pieces
* Handling piece movement
* Highlighting legal moves
* Highlighting the last move
* Capture animations
* Check highlighting
* Responsive board sizing

### `GameSidebar.jsx`

Responsible for:

* Move history
* Captured pieces
* Game controls
* AI information
* Player information

### `GameModal.jsx`

Responsible for:

* Game over screen
* Checkmate result
* Draw result
* Timeout result
* New game actions

### `App.jsx`

Controls the main game state:

* Chess position
* Player turn
* AI turn
* Timers
* Move history
* Undo
* Game status
* Stockfish integration
* Sound events

---

## 🔄 Undo System

Undo is designed to restore the complete previous game state.

When a move is undone, the game restores:

```text
✓ Board Position
✓ Captured Pieces
✓ Move History
✓ Current Turn
✓ Timer
✓ Last Move
✓ Check Status
✓ AI State
```

This prevents common issues such as the computer making an unexpected move immediately after undo.

---

---

## 🔮 Future Improvements

Possible future features include:

* 🌐 Online multiplayer
* 👥 Private rooms
* 🔗 Room sharing links
* 💬 In-game chat
* 🏆 ELO rating system
* 📊 Player statistics
* 🏅 Leaderboards
* 💾 Save and resume games
* 📤 Export games as PGN
* 📥 Import PGN games
* 🕐 Multiple time controls
* 🎯 Opening book
* 🧠 AI analysis
* 📈 Evaluation bar
* 🔍 Move analysis
* 👤 Player profiles
* 🌍 Online matchmaking
* 📱 PWA support

---

## 🔐 AI & Privacy

The Computer AI runs using the integrated Stockfish chess engine.

No paid AI API is required for normal Computer-vs-Player gameplay.


## ❤️ Why This Project?

This project was created to build a complete modern chess experience while learning and implementing:

* React application architecture
* Chess game logic
* Stockfish integration
* Responsive UI design
* Game state management
* Animations
* Timers
* Audio systems
* Component-based development

---

## 👨‍💻 Developer

**Ganesh Vishwakarma**

Built with ❤️ using **React + Vite + Stockfish + chess.js**

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub.

Your support helps improve the project and motivates further development!

---

## 📄 License

This project is available for educational and personal use.

See the repository license for complete terms.
