import { globalShortcut, app } from 'electron';

/**
 * Manages global keyboard shortcuts for the application
 */
export class ShortcutManager {
  private shortcuts: Map<string, () => void> = new Map();

  /**
   * Register a global keyboard shortcut
   * @param accelerator The shortcut accelerator (e.g., 'CommandOrControl+Shift+T')
   * @param callback Function to call when shortcut is pressed
   * @returns true if registration succeeded, false otherwise
   */
  register(accelerator: string, callback: () => void): boolean {
    if (!app.isReady()) return false;
    this.shortcuts.set(accelerator, callback);
    return globalShortcut.register(accelerator, callback);
  }

  /**
   * Unregister a specific global shortcut
   * @param accelerator The shortcut accelerator to unregister
   */
  unregister(accelerator: string): void {
    if (!app.isReady()) return;
    globalShortcut.unregister(accelerator);
    this.shortcuts.delete(accelerator);
  }

  /**
   * Unregister all global shortcuts
   */
  unregisterAll(): void {
    if (!app.isReady()) return;
    globalShortcut.unregisterAll();
    this.shortcuts.clear();
  }

  /**
   * Check if a shortcut is already registered
   * @param accelerator The shortcut accelerator to check
   * @returns true if the shortcut is registered, false otherwise
   */
  isRegistered(accelerator: string): boolean {
    if (!app.isReady()) return false;
    return globalShortcut.isRegistered(accelerator);
  }
}