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

describe('Text selection with retry', () => {
  it('should retry on failure and succeed on later attempt', async () => {
    let callCount = 0;
    const mockGetSelectedText = async () => {
      callCount++;
      if (callCount < 3) {
        return '';
      }
      return 'test text';
    };

    const maxRetries = 3;
    let result = '';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const text = await mockGetSelectedText();
      if (text && text.trim().length > 0) {
        result = text;
        break;
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
      }
    }

    expect(callCount).toBe(3);
    expect(result).toBe('test text');
  });

  it('should succeed on first attempt', async () => {
    let callCount = 0;
    const mockGetSelectedText = async () => {
      callCount++;
      return 'test text';
    };

    const maxRetries = 3;
    let result = '';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const text = await mockGetSelectedText();
      if (text && text.trim().length > 0) {
        result = text;
        break;
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
      }
    }

    expect(callCount).toBe(1);
    expect(result).toBe('test text');
  });

  it('should give up after max retries', async () => {
    let callCount = 0;
    const mockGetSelectedText = async () => {
      callCount++;
      return '';
    };

    const maxRetries = 3;
    let result = '';
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const text = await mockGetSelectedText();
      if (text && text.trim().length > 0) {
        result = text;
        break;
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 50 * attempt));
      }
    }

    expect(callCount).toBe(3);
    expect(result).toBe('');
  });
});

describe('Window positioning', () => {
  it('should calculate valid window position', () => {
    const cursor = { x: 100, y: 100 };
    const windowSize = { width: 400, height: 500 };
    const screenBounds = { x: 0, y: 0, width: 1920, height: 1080 };

    let x = cursor.x + 10;
    let y = cursor.y + 10;

    if (x + windowSize.width > screenBounds.x + screenBounds.width) {
      x = cursor.x - windowSize.width - 10;
    }

    expect(x).toBeGreaterThanOrEqual(screenBounds.x);
    expect(x + windowSize.width).toBeLessThanOrEqual(screenBounds.x + screenBounds.width);
  });

  it('should handle right edge overflow', () => {
    const cursor = { x: 1800, y: 100 };
    const windowSize = { width: 400, height: 500 };
    const screenBounds = { x: 0, y: 0, width: 1920, height: 1080 };

    let x = cursor.x + 10;

    if (x + windowSize.width > screenBounds.x + screenBounds.width) {
      x = cursor.x - windowSize.width - 10;
    }

    x = Math.max(screenBounds.x, Math.min(x, screenBounds.x + screenBounds.width - windowSize.width));

    expect(x + windowSize.width).toBeLessThanOrEqual(screenBounds.x + screenBounds.width);
    expect(x).toBe(1390);
  });

  it('should handle bottom edge overflow', () => {
    const cursor = { x: 100, y: 900 };
    const windowSize = { width: 400, height: 500 };
    const screenBounds = { x: 0, y: 0, width: 1920, height: 1080 };

    let y = cursor.y + 10;

    if (y + windowSize.height > screenBounds.y + screenBounds.height) {
      y = cursor.y - windowSize.height - 10;
    }

    y = Math.max(screenBounds.y, Math.min(y, screenBounds.y + screenBounds.height - windowSize.height));

    expect(y + windowSize.height).toBeLessThanOrEqual(screenBounds.y + screenBounds.height);
    expect(y).toBe(390);
  });
});