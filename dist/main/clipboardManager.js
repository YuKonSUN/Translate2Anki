"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipboardManager = void 0;
const electron_1 = require("electron");
/**
 * Manages clipboard operations for the application
 */
class ClipboardManager {
    /**
     * Read text from the system clipboard
     * @returns The text content from clipboard
     */
    readText() {
        return electron_1.clipboard.readText();
    }
    /**
     * Read and validate text from clipboard
     * Filters out commands, code snippets, and other non-natural language content
     * @returns Validated text or empty string if invalid
     */
    readValidText() {
        const text = electron_1.clipboard.readText().trim();
        // Skip if empty
        if (!text)
            return '';
        // Skip if it looks like a curl command
        if (text.startsWith('curl '))
            return '';
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
    writeText(text) {
        electron_1.clipboard.writeText(text);
    }
    /**
     * Clear the clipboard
     */
    clear() {
        electron_1.clipboard.clear();
    }
    /**
     * Check if clipboard has text content
     * @returns true if clipboard contains text, false otherwise
     */
    hasText() {
        const text = this.readText();
        return text.trim().length > 0;
    }
}
exports.ClipboardManager = ClipboardManager;
//# sourceMappingURL=clipboardManager.js.map