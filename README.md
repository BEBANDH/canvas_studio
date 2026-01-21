# Canvas Studio - Visual Moodboard Creator

A modern, feature-rich visual moodboard application for creating and organizing ideas with images and text.

![Canvas Studio](https://img.shields.io/badge/version-2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 🎨 **Core Functionality**
- **Infinite Canvas** - Unlimited scrollable workspace
- **Text Elements** - Double-click to add editable text boxes
- **Image Support** - Paste images directly (Ctrl+V) with automatic compression
- **Drag & Drop** - Smooth dragging with GPU acceleration
- **Resize Elements** - Flexible sizing for all elements

### 🎯 **Advanced Features**
- **Multi-Select** - Select multiple elements with Ctrl+Click or selection box
- **Group Operations** - Drag, duplicate, or delete multiple elements at once
- **Color Themes** - 7 beautiful color palettes for text elements
- **Board Management** - Create, rename, and switch between multiple boards
- **Context Menu** - Right-click for quick actions (duplicate, delete, layer order)
- **Dark/Light Mode** - Beautiful themes with smooth transitions

### 💾 **Data Management**
- **Auto-Save** - Changes saved automatically to browser storage
- **Export/Import** - JSON export/import for backup and sharing
- **PDF Export** - Export boards as PDF with transparent background
- **Lazy Loading** - Optimized performance with on-demand board loading

### ⚡ **Performance Optimizations**
- **GPU Acceleration** - Hardware-accelerated dragging and animations
- **Document Fragments** - Efficient DOM manipulation
- **Differential Saving** - Only changed properties are saved
- **Event Delegation** - Optimized event handling
- **Image Compression** - Automatic image optimization

## 🚀 Live Demo

[View Live Demo](https://yourusername.github.io/canvas-studio)

## 📸 Screenshots

### Dark Mode
![Dark Mode](screenshots/dark-mode.png)

### Light Mode
![Light Mode](screenshots/light-mode.png)

## 🛠️ Installation

### Option 1: Use Directly
Simply open `index.html` in your browser - no build process required!

### Option 2: Clone Repository
```bash
git clone https://github.com/yourusername/canvas-studio.git
cd canvas-studio
# Open index.html in your browser
```

## 📖 Usage

### Creating Elements
- **Text**: Double-click anywhere on the canvas
- **Images**: Copy an image and paste (Ctrl+V)

### Selecting Elements
- **Single**: Click on an element
- **Multiple**: Ctrl+Click or drag selection box
- **Clear**: Click on empty canvas or press Escape

### Moving Elements
- **Single**: Drag any element
- **Multiple**: Select multiple, then drag any selected element

### Editing
- **Text**: Click inside text element to edit
- **Color**: Click 🎨 button on text elements
- **Resize**: Drag the resize handle (bottom-right corner)
- **Delete**: Click × button or press Delete/Backspace

### Context Menu (Right-Click)
- **Bring Forward** - Move element up one layer
- **Send Backward** - Move element down one layer
- **Duplicate** - Create a copy
- **Delete** - Remove element

### Board Management
- **New Board**: Click + button in title bar
- **Switch Board**: Use dropdown selector
- **Rename**: Click ✎ button
- **Delete**: Click 🗑 button

### Keyboard Shortcuts
- `Double-Click` - Create text element
- `Ctrl+V` - Paste image
- `Ctrl+Click` - Multi-select
- `Delete/Backspace` - Delete selected
- `Escape` - Clear selection

## 🏗️ Project Structure

```
canvas-studio/
├── index.html              # Main HTML file
├── style.css              # Main stylesheet
├── context-menu.css       # Context menu styles
├── storage.js             # Storage management
├── js/
│   ├── main.js           # Application entry point
│   ├── state.js          # State management
│   ├── board-manager.js  # Board operations
│   ├── element-manager.js # Element CRUD
│   ├── selection-manager.js # Multi-select logic
│   ├── drag-manager.js   # Drag & resize
│   ├── context-menu.js   # Right-click menu
│   ├── settings-manager.js # Settings & theme
│   └── event-manager.js  # Event handling
└── README.md
```

## 🎨 Color Themes

Text elements support 7 color themes:
- **Default** - Dark gray
- **Yellow** - Warm cream
- **Purple** - Soft lavender
- **Blue** - Sky blue
- **Green** - Mint green
- **Pink** - Soft pink
- **Orange** - Peach

## 🌐 Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## 📝 Technical Details

### Technologies Used
- **Pure JavaScript** - No frameworks required
- **CSS3** - Modern styling with glassmorphism
- **LocalStorage** - Client-side data persistence
- **html2pdf.js** - PDF export functionality

### Performance Features
- GPU-accelerated animations
- Lazy loading for boards
- Differential saving (only changed data)
- Document fragments for DOM efficiency
- Event delegation for better performance

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Icons: Emoji (built-in)
- Fonts: Inter (Google Fonts)
- PDF Export: html2pdf.js

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

---

Made with ❤️ by [Your Name]
