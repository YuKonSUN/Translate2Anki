"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShortcutManager = void 0;
const electron_1 = require("electron");
/**
 * Manages global keyboard shortcuts for the application
 */
class ShortcutManager {
    shortcuts = new Map();
    /**
     * Register a global keyboard shortcut
     * @param accelerator The shortcut accelerator (e.g., 'CommandOrControl+Shift+T')
     * @param callback Function to call when shortcut is pressed
     * @returns true if registration succeeded, false otherwise
     */
    register(accelerator, callback) {
        if (!electron_1.app.isReady())
            return false;
        this.shortcuts.set(accelerator, callback);
        return electron_1.globalShortcut.register(accelerator, callback);
    }
    /**
     * Unregister a specific global shortcut
     * @param accelerator The shortcut accelerator to unregister
     */
    unregister(accelerator) {
        if (!electron_1.app.isReady())
            return;
        electron_1.globalShortcut.unregister(accelerator);
        this.shortcuts.delete(accelerator);
    }
    /**
     * Unregister all global shortcuts
     */
    unregisterAll() {
        if (!electron_1.app.isReady())
            return;
        electron_1.globalShortcut.unregisterAll();
        this.shortcuts.clear();
    }
    /**
     * Check if a shortcut is already registered
     * @param accelerator The shortcut accelerator to check
     * @returns true if the shortcut is registered, false otherwise
     */
    isRegistered(accelerator) {
        if (!electron_1.app.isReady())
            return false;
        return electron_1.globalShortcut.isRegistered(accelerator);
    }
}
exports.ShortcutManager = ShortcutManager;
