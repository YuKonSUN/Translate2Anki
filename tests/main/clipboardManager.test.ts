import { ClipboardManager } from '@/main/clipboardManager';
import { clipboard } from 'electron';

jest.mock('electron', () => ({
  clipboard: {
    readText: jest.fn(),
    writeText: jest.fn(),
  },
}));

describe('ClipboardManager', () => {
  let clipboardManager: ClipboardManager;

  beforeEach(() => {
    clipboardManager = new ClipboardManager();
    jest.clearAllMocks();
  });

  describe('readText', () => {
    it('should read text from clipboard', () => {
      const mockText = 'Sample clipboard text';
      (clipboard.readText as jest.Mock).mockReturnValue(mockText);

      const result = clipboardManager.readText();

      expect(result).toBe(mockText);
      expect(clipboard.readText).toHaveBeenCalled();
    });

    it('should return empty string when clipboard is empty', () => {
      (clipboard.readText as jest.Mock).mockReturnValue('');

      const result = clipboardManager.readText();

      expect(result).toBe('');
      expect(clipboard.readText).toHaveBeenCalled();
    });
  });

  describe('writeText', () => {
    it('should write text to clipboard', () => {
      const textToWrite = 'Text to copy to clipboard';

      clipboardManager.writeText(textToWrite);

      expect(clipboard.writeText).toHaveBeenCalledWith(textToWrite);
    });
  });
});