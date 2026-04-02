import { globalShortcut } from 'electron';

/**
 * Manages global keyboard shortcuts for the application
 */
export class ShortcutManager {
  /**
   * Register a global keyboard shortcut
   * @param accelerator The shortcut accelerator (e.g., 'CommandOrControl+Shift+T')
   * @param callback Function to call when shortcut is pressed
   * @returns true if registration succeeded, false otherwise
   */
  register(accelerator: string, callback: () => void): boolean {
    return globalShortcut.register(accelerator, callback);
  }

  /**
   * Unregister a specific global shortcut
   * @param accelerator The shortcut accelerator to unregister
   */
  unregister(accelerator: string): void {
    globalShortcut.unregister(accelerator);
  }

  /**
   * Unregister all global shortcuts
   */
  unregisterAll(): void {
    globalShortcut.unregisterAll();
  }

  /**
   * Check if a shortcut is already registered
   * @param accelerator The shortcut accelerator to check
   * @returns true if the shortcut is registered, false otherwise
   */
  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }
}