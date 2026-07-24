# Canvas Studio 🎨

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**Canvas Studio** is a powerful, local-first visual collaboration tool that works directly in your browser. Create infinite moodboards, flowcharts, and diagrams with a premium, drag-and-drop interface. No login required—everything saves seamlessly to your device.

---

## ✨ Features

### 🎨 **Visual Tools**
- **Infinite Canvas**: Unlimited workspace to brainstorm without boundaries.
- **Smart Shapes**: Choos from 10 distinct shapes including Rectangles, Circles, Stars, Hexagons, and more.
- **Dynamic Arrows**: connect elements to build flowcharts. Supports Straight, Curved, and Orthogonal styles with auto-anchoring.
- **Rich Text**: Fully editable text elements with 7+ premium color themes (Pastel, Dark Mode, etc.).
- **Image Support**: Paste images directly (`Ctrl+V`) or drag-and-drop. Auto-compression included.

### ⚡ **Productivity & Workflow**
- **Drag & Drop**: Smooth, GPU-accelerated interaction for all elements.
- **Multi-Select**: Group, move, and copy multiple items at once.
- **Context Menu**: Right-click to Layer (Bring Forward/Back) or Duplicate elements.
- **Board Management**: Organize work into distinct workspaces/boards with search.
- **Dark/Light Mode**: Beautifully crafted themes for any lighting condition.

### 💾 **Data & Export**
- **Auto-Save**: Instant local persistence via LocalStorage. Never lose your work.
- **Undo/Redo**: Full history support (`Ctrl+Z` / `Ctrl+Y`) for peace of mind.
- **JSON Import/Export**: Backup your boards or share them with others.
- **PNG Export**: High-quality export of your entire canvas.

---

## 🚀 Getting Started

Canvas Studio is built with vanilla web technologies, meaning it requires **no build step** or complex installation.

### Option 1: Run Directly
1. Download the repository.
2. Open `index.html` in any modern browser (Chrome, Edge, Firefox).
3. Start creating!

### Option 2: Local Server (Recommended for development)
If you want to contribute or run it like a pro:

```bash
# Clone the repository
git clone https://github.com/BEBANDH/canvas_studio.git

# Navigate to the directory
cd canvas_studio

# You can use any static server, for example Python:
python -m http.server 8000

# Or VS Code Live Server
```

---

## 📖 Usage Guide

### **Basic Controls**
| Action | Method |
|--------|--------|
| **Create Text** | Double-click or press `T` |
| **Add Image** | Paste (`Ctrl+V`) or press `I` |
| **Pan Canvas** | Hold `Space` + Drag (or Middle Mouse) |
| **Zoom** | `Ctrl` + Scroll |

### **Shape & Arrow Tools**
- **Change Shape**: Select an element and pick from the right-side shape panel.
- **Draw Arrows**:
  1. Press `A` or click the Arrow icon in the header.
  2. Drag from one purple anchor point to another.
  3. Click an arrow to delete it.

### **Keyboard Shortcuts**
| Key | Action |
|-----|--------|
| `A` | Toggle Arrow Mode |
| `I` | Upload Image |
| `Del` / `Backspace` | Delete selected |
| `Ctrl + A` | Select All |
| `Arrow Keys` | Nudge element (10px) |
| `Esc` | Deselect All |

---

## 🛠️ Tech Stack

- **Core**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: LocalStorage API (Custom Wrapper)
- **Rendering**: DOM-based with GPU acceleration layers
- **Exporting**: `html2canvas` for image generation
- **State**: Custom efficient state management system

---

## 📂 Project Structure

```
canvas_studio/
├── index.html          # Main Application Entry
├── style.css           # Global Styles
├── context-menu.css    # UI Component Styles
├── js/
│   ├── main.js           # Bootstrapper
│   ├── state.js          # App State
│   ├── board-manager.js  # Board CRUD
│   ├── element-manager.js# Element Rendering & Logic
│   ├── shape-manager.js  # Shape Logic
│   ├── arrow-manager.js  # Arrow Rendering (SVG)
│   ├── drag-manager.js   # Drag & Resize Interactions
│   ├── keyboard-shortcuts.js # Hotkey Manager
│   └── ...
└── ...
```

---

## 🤝 Contributing

We welcome contributions! Please feel free to open issues or submit Pull Requests.
1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/BEBANDH">BEBANDH</a>
</p>
