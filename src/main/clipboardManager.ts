import { clipboard } from 'electron';

/**
 * Manages clipboard operations for the application
 */
export class ClipboardManager {
  /**
   * Read text from the system clipboard
   * @returns The text content from clipboard
   */
  readText(): string {
    return clipboard.readText();
  }

  /**
   * Write text to the system clipboard
   * @param text The text to write to clipboard
   */
  writeText(text: string): void {
    clipboard.writeText(text);
  }

  /**
   * Clear the clipboard
   */
  clear(): void {
    clipboard.clear();
  }

  /**
   * Check if clipboard has text content
   * @returns true if clipboard contains text, false otherwise
   */
  hasText(): boolean {
    const text = this.readText();
    return text.trim().length > 0;
  }
}