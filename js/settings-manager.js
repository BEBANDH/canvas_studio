// === SETTINGS & THEME MANAGEMENT ===

function loadSettings() {
    const saved = localStorage.getItem('canvas-settings');
    if (saved) {
        AppState.settings = { ...AppState.settings, ...JSON.parse(saved) };
    }
}

function saveSettings() {
    localStorage.setItem('canvas-settings', JSON.stringify(AppState.settings));
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('themeIcon');
    const themeLabel = document.getElementById('themeLabel');

    if (themeIcon) {
        themeIcon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }

    if (themeLabel) {
        themeLabel.textContent = theme === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
}

function toggleTheme() {
    AppState.settings.theme = AppState.settings.theme === 'dark' ? 'light' : 'dark';
    applyTheme(AppState.settings.theme);
    saveSettings();
}

// === COLOR PICKER ===

let colorPickerTarget = null;

function showColorPicker(element, x, y) {
    const colorPicker = document.getElementById('colorPicker');
    colorPickerTarget = element;
    colorPicker.classList.remove('hidden');
    colorPicker.style.left = x + 'px';
    colorPicker.style.top = y + 'px';
}

function hideColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.classList.add('hidden');
    colorPickerTarget = null;
}

function applyColor(color) {
    if (!colorPickerTarget) return;

    const id = colorPickerTarget.dataset.id;
    colorPickerTarget.dataset.color = color;

    // OPTIMIZATION 2: Differential saving
    StorageManager.savePatch(AppState.activeBoardId, id, { color });

    // Update in-memory data
    const elementData = AppState.activeBoard.elements.find(el => el.id == id);
    if (elementData) {
        elementData.color = color;
    }

    ElementManager.updateSaveStatus();
    hideColorPicker();
}

// === IMAGE COMPRESSION ===

async function compressImage(dataUrl, maxWidth = 1200, maxHeight = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            let width = img.width;
            let height = img.height;

            // Only compress if image is larger than max dimensions
            if (width <= maxWidth && height <= maxHeight) {
                resolve(dataUrl);
                return;
            }

            // Calculate new dimensions
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);

            // Create canvas and compress
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl); // Fallback to original
        img.src = dataUrl;
    });
}

// Export functions
window.SettingsManager = {
    loadSettings,
    saveSettings,
    applyTheme,
    toggleTheme,
    showColorPicker,
    hideColorPicker,
    applyColor,
    compressImage
};
