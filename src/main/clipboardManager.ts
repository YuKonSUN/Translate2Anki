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
   * Read and validate text from clipboard
   * Filters out commands, code snippets, and other non-natural language content
   * @returns Validated text or empty string if invalid
   */
  readValidText(): string {
    const text = clipboard.readText().trim();
    
    // Skip if empty
    if (!text) return '';
    
    // Skip if it looks like a curl command
    if (text.startsWith('curl ')) return '';
    
    // Skip if it looks like a shell command (contains common command patterns)
    if (/^(curl|wget|npm|yarn|pip|python|node|git|ssh|cd|ls|cat|echo)\s/i.test(text)) {
      return '';
    }
    
    // Skip if it looks like JSON (API responses, config files)
    if ((text.startsWith('{') && text.endsWith('}')) || 
        (text.startsWith('[') && text.endsWith(']'))) {
      return '';
    }
    
    // Skip if it looks like code (contains common code patterns)
    if (/^(const|let|var|function|import|export|class|interface|type)\s/i.test(text)) {
      return '';
    }
    
    return text;
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