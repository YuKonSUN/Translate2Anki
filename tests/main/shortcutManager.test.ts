import { ShortcutManager } from '@/main/shortcutManager';
import { globalShortcut } from 'electron';

jest.mock('electron', () => ({
  globalShortcut: {
    register: jest.fn(),
    unregisterAll: jest.fn(),
    unregister: jest.fn(),
  },
}));

describe('ShortcutManager', () => {
  let shortcutManager: ShortcutManager;

  beforeEach(() => {
    shortcutManager = new ShortcutManager();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a global shortcut', () => {
      const mockCallback = jest.fn();
      (globalShortcut.register as jest.Mock).mockReturnValue(true);

      const result = shortcutManager.register('CommandOrControl+Shift+T', mockCallback);

      expect(result).toBe(true);
      expect(globalShortcut.register).toHaveBeenCalledWith(
        'CommandOrControl+Shift+T',
        mockCallback
      );
    });

    it('should return false when registration fails', () => {
      const mockCallback = jest.fn();
      (globalShortcut.register as jest.Mock).mockReturnValue(false);

      const result = shortcutManager.register('CommandOrControl+Shift+T', mockCallback);

      expect(result).toBe(false);
      expect(globalShortcut.register).toHaveBeenCalledWith(
        'CommandOrControl+Shift+T',
        mockCallback
      );
    });
  });

  describe('unregisterAll', () => {
    it('should unregister all shortcuts', () => {
      shortcutManager.unregisterAll();
      expect(globalShortcut.unregisterAll).toHaveBeenCalled();
    });
  });

  describe('unregister', () => {
    it('should unregister a specific shortcut', () => {
      shortcutManager.unregister('CommandOrControl+Shift+T');
      expect(globalShortcut.unregister).toHaveBeenCalledWith('CommandOrControl+Shift+T');
    });
  });
});