# Translate2Anki Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core Electron desktop application with text capture, DeepSeek API translation, and basic AnkiConnect integration.

**Architecture:** Electron main process handles system integration (shortcuts, clipboard), renderer process uses React for UI, services layer manages API calls and Anki communication, with TypeScript for type safety.

**Tech Stack:** Electron + Vite + React + TypeScript + Tailwind CSS, Zustand for state, axios for HTTP, AnkiConnect API.

---

## File Structure

**Main Process (Electron)**
- `src/main/main.ts` - Electron app entry, window creation
- `src/main/shortcutManager.ts` - Global shortcut registration
- `src/main/clipboardManager.ts` - System clipboard access
- `src/main/configManager.ts` - Configuration loading/saving

**Renderer Process (React)**
- `src/renderer/App.tsx` - Root component
- `src/renderer/components/TranslationPanel.tsx` - Main translation UI
- `src/renderer/components/WordList.tsx` - Word selection list
- `src/renderer/components/AddToAnkiButton.tsx` - Anki integration button
- `src/renderer/components/LoadingSpinner.tsx` - Loading indicator

**Services**
- `src/services/aiService.ts` - DeepSeek API client
- `src/services/ankiService.ts` - AnkiConnect API client
- `src/services/cacheService.ts` - Local response caching

**State & Types**
- `src/types/index.ts` - Shared TypeScript interfaces
- `src/store/translationStore.ts` - Zustand store for app state

**Configuration**
- `electron-builder.yml` - Build configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build setup

**Tests**
- `tests/main/shortcutManager.test.ts`
- `tests/services/aiService.test.ts`
- `tests/services/ankiService.test.ts`
- `tests/components/TranslationPanel.test.tsx`

---

### Task 1: Project Scaffolding and Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `electron-builder.yml`
- Create: `src/main/main.ts`

- [ ] **Step 1: Write the failing test for package.json validation**

Create `tests/config/package.test.js`:
```javascript
import { readFileSync } from 'fs';
import { join } from 'path';

describe('package.json', () => {
  it('has required dependencies', () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
    expect(pkg.dependencies).toHaveProperty('electron');
    expect(pkg.dependencies).toHaveProperty('react');
    expect(pkg.dependencies).toHaveProperty('react-dom');
    expect(pkg.devDependencies).toHaveProperty('typescript');
    expect(pkg.devDependencies).toHaveProperty('vite');
    expect(pkg.devDependencies).toHaveProperty('@types/node');
    expect(pkg.devDependencies).toHaveProperty('@types/react');
    expect(pkg.devDependencies).toHaveProperty('@types/react-dom');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/config/package.test.js`
Expected: FAIL with "Cannot find module '../../package.json'"

- [ ] **Step 3: Create package.json with minimal dependencies**

Create `package.json`:
```json
{
  "name": "translate2anki",
  "version": "0.1.0",
  "private": true,
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "start": "electron .",
    "test": "jest"
  },
  "dependencies": {
    "electron": "^30.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/jest": "^29.5.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "electron-builder": "^24.0.0"
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/config/package.test.js`
Expected: PASS

- [ ] **Step 5: Create TypeScript configuration**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 6: Create Vite configuration**

Create `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    rollupOptions: {
      input: resolve(__dirname, 'src/renderer/index.html'),
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

- [ ] **Step 7: Create Electron main process entry**

Create `src/main/main.ts`:
```typescript
import { app, BrowserWindow, globalShortcut } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Global shortcut registration (to be implemented in Task 2)
app.on('ready', () => {
  const ret = globalShortcut.register('CommandOrControl+Shift+T', () => {
    console.log('Translation shortcut pressed');
    // Will trigger translation in Task 2
  });
  if (!ret) {
    console.log('Shortcut registration failed');
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

- [ ] **Step 8: Create directory structure**

Run: `mkdir -p src/main src/renderer/components src/services src/types src/store tests/config tests/main tests/services tests/components`

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts src/main/main.ts
git commit -m "feat: project scaffolding with Electron + React + TypeScript"
```

---

### Task 2: Shortcut Manager and Clipboard Integration

**Files:**
- Create: `src/main/shortcutManager.ts`
- Create: `src/main/clipboardManager.ts`
- Modify: `src/main/main.ts:45-55` (shortcut callback)
- Create: `tests/main/shortcutManager.test.ts`
- Create: `tests/main/clipboardManager.test.ts`

- [ ] **Step 1: Write failing test for shortcut registration**

Create `tests/main/shortcutManager.test.ts`:
```typescript
import { ShortcutManager } from '@/main/shortcutManager';

describe('ShortcutManager', () => {
  it('registers global shortcut', () => {
    const manager = new ShortcutManager();
    const result = manager.register('Ctrl+Shift+T', () => {});
    expect(result).toBe(true);
  });

  it('unregisters all shortcuts', () => {
    const manager = new ShortcutManager();
    manager.register('Ctrl+Shift+T', () => {});
    manager.unregisterAll();
    // Verification through Electron mock
    expect(manager.isRegistered('Ctrl+Shift+T')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/main/shortcutManager.test.ts`
Expected: FAIL with "Cannot find module '@/main/shortcutManager'"

- [ ] **Step 3: Implement ShortcutManager class**

Create `src/main/shortcutManager.ts`:
```typescript
import { globalShortcut } from 'electron';

export class ShortcutManager {
  private registeredShortcuts: Set<string> = new Set();

  register(accelerator: string, callback: () => void): boolean {
    const success = globalShortcut.register(accelerator, callback);
    if (success) {
      this.registeredShortcuts.add(accelerator);
    }
    return success;
  }

  unregister(accelerator: string): void {
    globalShortcut.unregister(accelerator);
    this.registeredShortcuts.delete(accelerator);
  }

  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
  }

  isRegistered(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  getRegisteredShortcuts(): string[] {
    return Array.from(this.registeredShortcuts);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/main/shortcutManager.test.ts`
Expected: PASS

- [ ] **Step 5: Write failing test for clipboard access**

Create `tests/main/clipboardManager.test.ts`:
```typescript
import { ClipboardManager } from '@/main/clipboardManager';

describe('ClipboardManager', () => {
  it('reads text from clipboard', () => {
    const manager = new ClipboardManager();
    const text = manager.readText();
    // Mock clipboard returns empty string initially
    expect(text).toBe('');
  });

  it('writes text to clipboard', () => {
    const manager = new ClipboardManager();
    const success = manager.writeText('test text');
    expect(success).toBe(true);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/main/clipboardManager.test.ts`
Expected: FAIL with "Cannot find module '@/main/clipboardManager'"

- [ ] **Step 7: Implement ClipboardManager class**

Create `src/main/clipboardManager.ts`:
```typescript
import { clipboard } from 'electron';

export class ClipboardManager {
  readText(): string {
    return clipboard.readText();
  }

  writeText(text: string): void {
    clipboard.writeText(text);
  }

  readHTML(): string {
    return clipboard.readHTML();
  }

  clear(): void {
    clipboard.clear();
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/main/clipboardManager.test.ts`
Expected: PASS

- [ ] **Step 9: Update main.ts to use managers**

Modify `src/main/main.ts` (add imports and integrate):
```typescript
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron';
import { join } from 'path';
import { ShortcutManager } from './shortcutManager';
import { ClipboardManager } from './clipboardManager';

let mainWindow: BrowserWindow | null = null;
const shortcutManager = new ShortcutManager();
const clipboardManager = new ClipboardManager();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload/preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Register translation shortcut
  shortcutManager.register('CommandOrControl+Shift+T', () => {
    const selectedText = clipboardManager.readText();
    if (selectedText.trim()) {
      // Send to renderer via IPC
      mainWindow?.webContents.send('text-selected', selectedText);
    }
  });

  // IPC handler for translation requests
  ipcMain.handle('get-clipboard-text', () => {
    return clipboardManager.readText();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  shortcutManager.unregisterAll();
});
```

- [ ] **Step 10: Commit**

```bash
git add src/main/shortcutManager.ts src/main/clipboardManager.ts src/main/main.ts tests/main/
git commit -m "feat: shortcut and clipboard managers for text capture"
```

---

### Task 3: React UI Framework and IPC Communication

**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/index.tsx`
- Create: `src/renderer/App.tsx`
- Create: `src/renderer/components/TranslationPanel.tsx`
- Create: `src/renderer/components/LoadingSpinner.tsx`
- Create: `src/preload/preload.ts`
- Create: `src/types/index.ts`
- Modify: `src/main/main.ts` (add preload path)
- Create: `tests/components/TranslationPanel.test.tsx`

- [ ] **Step 1: Create HTML entry point**

Create `src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Translate2Anki</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/renderer/index.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create React entry point**

Create `src/renderer/index.tsx`:
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Create basic CSS with Tailwind**

Create `src/renderer/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 4: Create preload script for IPC**

Create `src/preload/preload.ts`:
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onTextSelected: (callback: (text: string) => void) => {
    ipcRenderer.on('text-selected', (_, text) => callback(text));
  },
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),
  // Add more IPC methods as needed
});
```

- [ ] **Step 5: Update main.ts to include preload**

Modify `src/main/main.ts` (update webPreferences):
```typescript
preload: join(__dirname, '../preload/preload.js'),
```

- [ ] **Step 6: Create shared types**

Create `src/types/index.ts`:
```typescript
export interface TranslationResult {
  original: string;
  translation: string;
  isSentence: boolean;
  words?: WordAnalysis[];
  grammar?: string;
}

export interface WordAnalysis {
  word: string;
  meaning: string;
  partOfSpeech: string;
  root?: string;
}

export interface AIConfig {
  provider: 'deepseek' | 'openai' | 'custom';
  baseURL: string;
  apiKey: string;
  model: string;
}
```

- [ ] **Step 7: Create LoadingSpinner component**

Create `src/renderer/components/LoadingSpinner.tsx`:
```typescript
import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );
};
```

- [ ] **Step 8: Create TranslationPanel component (basic)**

Create `src/renderer/components/TranslationPanel.tsx`:
```typescript
import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

declare global {
  interface Window {
    electronAPI: {
      onTextSelected: (callback: (text: string) => void) => void;
      getClipboardText: () => Promise<string>;
    };
  }
}

export const TranslationPanel: React.FC = () => {
  const [selectedText, setSelectedText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.electronAPI.onTextSelected((text) => {
      setSelectedText(text);
      setLoading(true);
      // Simulate API call (will be replaced with actual API in Task 4)
      setTimeout(() => setLoading(false), 1000);
    });
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-lg font-bold mb-2">Selected Text</h2>
      <div className="p-3 bg-gray-100 rounded mb-4">
        {selectedText || 'No text selected'}
      </div>
      
      {loading ? (
        <LoadingSpinner />
      ) : selectedText ? (
        <div className="text-gray-600">
          Translation will appear here after API integration (Task 4)
        </div>
      ) : null}
      
      <div className="mt-4 text-sm text-gray-500">
        Press Ctrl+Shift+T to translate selected text
      </div>
    </div>
  );
};
```

- [ ] **Step 9: Create App component**

Create `src/renderer/App.tsx`:
```typescript
import React from 'react';
import { TranslationPanel } from './components/TranslationPanel';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Translate2Anki</h1>
        <p className="text-gray-600">Select text and press Ctrl+Shift+T to translate</p>
      </header>
      <main>
        <TranslationPanel />
      </main>
    </div>
  );
};

export default App;
```

- [ ] **Step 10: Write failing test for TranslationPanel**

Create `tests/components/TranslationPanel.test.tsx`:
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { TranslationPanel } from '@/renderer/components/TranslationPanel';

// Mock electronAPI
window.electronAPI = {
  onTextSelected: jest.fn(),
  getClipboardText: jest.fn(),
};

describe('TranslationPanel', () => {
  it('renders without selected text', () => {
    render(<TranslationPanel />);
    expect(screen.getByText('No text selected')).toBeInTheDocument();
  });
});
```

- [ ] **Step 11: Run test to verify it fails**

Run: `npm test -- tests/components/TranslationPanel.test.tsx`
Expected: FAIL (component renders but test may pass - we'll check)

- [ ] **Step 12: Install testing libraries**

Update `package.json` devDependencies:
```json
"@testing-library/react": "^14.0.0",
"@testing-library/jest-dom": "^6.0.0",
"jest-environment-jsdom": "^29.5.0"
```

Run: `npm install`

- [ ] **Step 13: Update jest config for React**

Create `jest.config.js`:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

Create `jest.setup.js`:
```javascript
import '@testing-library/jest-dom';
```

- [ ] **Step 14: Run test again**

Run: `npm test -- tests/components/TranslationPanel.test.tsx`
Expected: PASS

- [ ] **Step 15: Commit**

```bash
git add src/renderer/ src/preload/ src/types/ tests/components/ tailwind.config.js jest.config.js
git commit -m "feat: React UI framework with IPC communication"
```

---

### Task 4: DeepSeek API Integration

**Files:**
- Create: `src/services/aiService.ts`
- Create: `src/services/cacheService.ts`
- Create: `src/store/translationStore.ts`
- Modify: `src/renderer/components/TranslationPanel.tsx` (integrate AI service)
- Create: `tests/services/aiService.test.ts`
- Create: `tests/services/cacheService.test.ts`

- [ ] **Step 1: Write failing test for AI service**

Create `tests/services/aiService.test.ts`:
```typescript
import { AIService } from '@/services/aiService';

describe('AIService', () => {
  const mockConfig = {
    provider: 'deepseek' as const,
    baseURL: 'https://api.deepseek.com',
    apiKey: 'test-key',
    model: 'deepseek-chat',
  };

  it('translates text', async () => {
    const service = new AIService(mockConfig);
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: '这是测试翻译' } }]
      }),
    });
    
    const result = await service.translate('test translation');
    expect(result).toBe('这是测试翻译');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/services/aiService.test.ts`
Expected: FAIL with "Cannot find module '@/services/aiService'"

- [ ] **Step 3: Implement AIService class**

Create `src/services/aiService.ts`:
```typescript
import axios from 'axios';
import { AIConfig } from '@/types';

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  async translate(text: string): Promise<string> {
    const response = await axios.post(
      `${this.config.baseURL}/chat/completions`,
      {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a translation assistant. Translate the given text to Chinese if it is English, or to English if it is Chinese. Return only the translation without any additional text.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  }

  async analyzeWord(word: string): Promise<any> {
    const response = await axios.post(
      `${this.config.baseURL}/chat/completions`,
      {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Analyze the given English word. Provide: 1. Chinese translation, 2. Part of speech, 3. Word root/etymology if known, 4. Example sentence. Return as JSON: {translation: string, partOfSpeech: string, root: string, example: string}'
          },
          {
            role: 'user',
            content: word
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  }

  async analyzeSentence(sentence: string): Promise<any> {
    const response = await axios.post(
      `${this.config.baseURL}/chat/completions`,
      {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Analyze the given English sentence. Provide: 1. Chinese translation, 2. Grammar analysis (break down structure), 3. Key vocabulary words with meanings. Return as JSON: {translation: string, grammar: string, words: Array<{word: string, meaning: string}>}'
          },
          {
            role: 'user',
            content: sentence
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/services/aiService.test.ts`
Expected: PASS (with mock)

- [ ] **Step 5: Write failing test for cache service**

Create `tests/services/cacheService.test.ts`:
```typescript
import { CacheService } from '@/services/cacheService';

describe('CacheService', () => {
  it('stores and retrieves cache entries', () => {
    const cache = new CacheService();
    cache.set('key1', 'value1', 60); // 60 minutes
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns null for expired entries', () => {
    const cache = new CacheService();
    cache.set('key2', 'value2', 0); // Expired immediately
    expect(cache.get('key2')).toBeNull();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npm test -- tests/services/cacheService.test.ts`
Expected: FAIL with "Cannot find module '@/services/cacheService'"

- [ ] **Step 7: Implement CacheService class**

Create `src/services/cacheService.ts`:
```typescript
interface CacheEntry {
  value: any;
  expiry: number;
}

export class CacheService {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number = 100; // Max entries

  set(key: string, value: any, ttlMinutes: number = 60): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry (simple implementation)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + ttlMinutes * 60 * 1000;
    this.cache.set(key, { value, expiry });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npm test -- tests/services/cacheService.test.ts`
Expected: PASS

- [ ] **Step 9: Create Zustand store for translation state**

Create `src/store/translationStore.ts`:
```typescript
import { create } from 'zustand';
import { TranslationResult, WordAnalysis } from '@/types';
import { AIService } from '@/services/aiService';
import { CacheService } from '@/services/cacheService';

interface TranslationStore {
  selectedText: string;
  translation: TranslationResult | null;
  loading: boolean;
  error: string | null;
  cache: CacheService;
  aiService: AIService | null;

  setSelectedText: (text: string) => void;
  setAIService: (service: AIService) => void;
  translateText: (text: string) => Promise<void>;
  clearTranslation: () => void;
}

const useTranslationStore = create<TranslationStore>((set, get) => ({
  selectedText: '',
  translation: null,
  loading: false,
  error: null,
  cache: new CacheService(),
  aiService: null,

  setSelectedText: (text) => set({ selectedText: text }),
  
  setAIService: (service) => set({ aiService: service }),

  translateText: async (text) => {
    const { aiService, cache } = get();
    if (!aiService) {
      set({ error: 'AI service not configured' });
      return;
    }

    // Check cache first
    const cached = cache.get<TranslationResult>(`translation:${text}`);
    if (cached) {
      set({ translation: cached, loading: false });
      return;
    }

    set({ loading: true, error: null });
    
    try {
      const isSentence = text.split(' ').length > 3 || /[.!?]/.test(text);
      let translation: TranslationResult;

      if (isSentence) {
        const analysis = await aiService.analyzeSentence(text);
        translation = {
          original: text,
          translation: analysis.translation,
          isSentence: true,
          grammar: analysis.grammar,
          words: analysis.words,
        };
      } else {
        const analysis = await aiService.analyzeWord(text);
        translation = {
          original: text,
          translation: analysis.translation,
          isSentence: false,
          words: [{
            word: text,
            meaning: analysis.translation,
            partOfSpeech: analysis.partOfSpeech,
            root: analysis.root,
          }],
        };
      }

      // Cache for 24 hours
      cache.set(`translation:${text}`, translation, 24 * 60);
      
      set({ translation, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Translation failed',
        loading: false 
      });
    }
  },

  clearTranslation: () => set({ translation: null, error: null }),
}));

export default useTranslationStore;
```

- [ ] **Step 10: Update TranslationPanel to use store**

Modify `src/renderer/components/TranslationPanel.tsx`:
```typescript
import React, { useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import useTranslationStore from '@/store/translationStore';
import { AIService } from '@/services/aiService';
import { AIConfig } from '@/types';

const TranslationPanel: React.FC = () => {
  const {
    selectedText,
    translation,
    loading,
    error,
    setSelectedText,
    setAIService,
    translateText,
    clearTranslation,
  } = useTranslationStore();

  useEffect(() => {
    // Initialize AI service (config should come from settings later)
    const config: AIConfig = {
      provider: 'deepseek',
      baseURL: 'https://api.deepseek.com',
      apiKey: '', // Will be configured by user
      model: 'deepseek-chat',
    };
    setAIService(new AIService(config));
  }, [setAIService]);

  useEffect(() => {
    window.electronAPI.onTextSelected(async (text) => {
      setSelectedText(text);
      if (text.trim()) {
        await translateText(text);
      }
    });
  }, [setSelectedText, translateText]);

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-lg font-bold mb-2">Selected Text</h2>
      <div className="p-3 bg-gray-100 rounded mb-4">
        {selectedText || 'No text selected'}
      </div>
      
      {loading && <LoadingSpinner />}
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {translation && !loading && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">Translation</h3>
            <p className="p-2 bg-blue-50 rounded">{translation.translation}</p>
          </div>
          
          {translation.grammar && (
            <div>
              <h3 className="font-semibold text-gray-700">Grammar Analysis</h3>
              <p className="p-2 bg-green-50 rounded">{translation.grammar}</p>
            </div>
          )}
          
          {translation.words && translation.words.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-700">Key Words</h3>
              <ul className="space-y-2">
                {translation.words.map((word, idx) => (
                  <li key={idx} className="p-2 bg-yellow-50 rounded">
                    <strong>{word.word}</strong>: {word.meaning} ({word.partOfSpeech})
                    {word.root && <div className="text-sm text-gray-600">Root: {word.root}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <button
            onClick={clearTranslation}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 11: Commit**

```bash
git add src/services/ src/store/ src/renderer/components/TranslationPanel.tsx tests/services/
git commit -m "feat: DeepSeek API integration with caching and state management"
```

---

### Task 5: AnkiConnect Basic Integration

**Files:**
- Create: `src/services/ankiService.ts`
- Create: `src/renderer/components/AddToAnkiButton.tsx`
- Create: `src/renderer/components/WordList.tsx`
- Modify: `src/renderer/components/TranslationPanel.tsx` (add Anki buttons)
- Create: `tests/services/ankiService.test.ts`
- Create: `tests/components/AddToAnkiButton.test.tsx`

- [ ] **Step 1: Write failing test for AnkiService**

Create `tests/services/ankiService.test.ts`:
```typescript
import { AnkiService } from '@/services/ankiService';

describe('AnkiService', () => {
  const mockConfig = {
    host: 'localhost:8765',
    defaultDeck: 'Default',
  };

  it('connects to AnkiConnect', async () => {
    const service = new AnkiService(mockConfig);
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 6, error: null }),
    });
    
    const version = await service.getVersion();
    expect(version).toBe(6);
  });

  it('creates card', async () => {
    const service = new AnkiService(mockConfig);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 12345, error: null }),
    });
    
    const cardId = await service.createCard({
      deckName: 'Default',
      front: 'Hello',
      back: '你好',
      tags: ['test'],
    });
    
    expect(cardId).toBe(12345);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/services/ankiService.test.ts`
Expected: FAIL with "Cannot find module '@/services/ankiService'"

- [ ] **Step 3: Implement AnkiService class**

Create `src/services/ankiService.ts`:
```typescript
import { WordAnalysis } from '@/types';

export interface AnkiCard {
  deckName: string;
  front: string;
  back: string;
  tags: string[];
}

export interface AnkiConfig {
  host: string;
  defaultDeck: string;
}

export class AnkiService {
  private config: AnkiConfig;
  private baseURL: string;

  constructor(config: AnkiConfig) {
    this.config = config;
    this.baseURL = `http://${config.host}`;
  }

  async request(action: string, params: any = {}): Promise<any> {
    const response = await fetch(this.baseURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        version: 6,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`AnkiConnect request failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`AnkiConnect error: ${data.error}`);
    }

    return data.result;
  }

  async getVersion(): Promise<number> {
    return this.request('version');
  }

  async createCard(card: AnkiCard): Promise<number> {
    return this.request('addNote', {
      note: {
        deckName: card.deckName,
        modelName: 'Basic',
        fields: {
          Front: card.front,
          Back: card.back,
        },
        tags: card.tags,
        options: {
          allowDuplicate: false,
          duplicateScope: 'deck',
        },
      },
    });
  }

  async createCards(cards: AnkiCard[]): Promise<number[]> {
    const results = await Promise.all(
      cards.map(card => this.createCard(card).catch(err => {
        console.error(`Failed to create card: ${err.message}`);
        return null;
      }))
    );
    return results.filter((id): id is number => id !== null);
  }

  async createMixedCard(
    original: string,
    translation: string,
    words: WordAnalysis[],
    grammar?: string
  ): Promise<number> {
    const front = Math.random() < 0.6 ? original : translation;
    const isReverse = front === translation;
    
    const back = `
      <div class="translation-result">
        <h3>${isReverse ? 'Original' : 'Translation'}</h3>
        <p>${isReverse ? original : translation}</p>
        
        ${grammar ? `<h3>Grammar Analysis</h3><p>${grammar}</p>` : ''}
        
        ${words.length > 0 ? `
          <h3>Key Vocabulary</h3>
          <ul>
            ${words.map(word => `
              <li>
                <strong>${word.word}</strong>: ${word.meaning} (${word.partOfSpeech})
                ${word.root ? `<br/><small>Root: ${word.root}</small>` : ''}
              </li>
            `).join('')}
          </ul>
        ` : ''}
        
        <h3>Your Practice</h3>
        <textarea placeholder="Write your answer here..." rows="3" style="width:100%"></textarea>
      </div>
    `;

    return this.createCard({
      deckName: this.config.defaultDeck,
      front,
      back,
      tags: ['translate2anki', 'mixed-card'],
    });
  }

  async deckExists(deckName: string): Promise<boolean> {
    const decks = await this.request('deckNames');
    return decks.includes(deckName);
  }

  async createDeck(deckName: string): Promise<void> {
    await this.request('createDeck', { deck: deckName });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/services/ankiService.test.ts`
Expected: PASS (with mock)

- [ ] **Step 5: Create WordList component for word selection**

Create `src/renderer/components/WordList.tsx`:
```typescript
import React from 'react';
import { WordAnalysis } from '@/types';

interface WordListProps {
  words: WordAnalysis[];
  selectedWords: string[];
  onWordToggle: (word: string) => void;
}

export const WordList: React.FC<WordListProps> = ({
  words,
  selectedWords,
  onWordToggle,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700">Select words to add to Anki:</h3>
      <div className="flex flex-wrap gap-2">
        {words.map((word) => (
          <button
            key={word.word}
            onClick={() => onWordToggle(word.word)}
            className={`px-3 py-1 rounded-full border ${
              selectedWords.includes(word.word)
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
            }`}
          >
            {word.word}
          </button>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 6: Create AddToAnkiButton component**

Create `src/renderer/components/AddToAnkiButton.tsx`:
```typescript
import React, { useState } from 'react';
import { AnkiService } from '@/services/ankiService';
import { TranslationResult } from '@/types';

interface AddToAnkiButtonProps {
  translation: TranslationResult;
  ankiService: AnkiService | null;
  selectedWords: string[];
}

export const AddToAnkiButton: React.FC<AddToAnkiButtonProps> = ({
  translation,
  ankiService,
  selectedWords,
}) => {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAddToAnki = async () => {
    if (!ankiService) {
      setError('Anki service not available');
      return;
    }

    setAdding(true);
    setError(null);
    setSuccess(false);

    try {
      // Filter words based on selection
      const filteredWords = translation.words?.filter(word => 
        selectedWords.includes(word.word)
      ) || [];

      await ankiService.createMixedCard(
        translation.original,
        translation.translation,
        filteredWords,
        translation.grammar
      );

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to Anki');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleAddToAnki}
        disabled={adding || !ankiService}
        className={`px-4 py-2 rounded font-medium ${
          adding
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {adding ? 'Adding to Anki...' : 'Add to Anki'}
      </button>
      
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      
      {success && (
        <div className="text-green-600 text-sm">✓ Added to Anki successfully!</div>
      )}
    </div>
  );
};
```

- [ ] **Step 7: Update TranslationPanel to include Anki integration**

Modify `src/renderer/components/TranslationPanel.tsx` (add new state and components):
```typescript
import React, { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { WordList } from './WordList';
import { AddToAnkiButton } from './AddToAnkiButton';
import useTranslationStore from '@/store/translationStore';
import { AIService } from '@/services/aiService';
import { AnkiService } from '@/services/ankiService';
import { AIConfig, AnkiConfig } from '@/types';

const TranslationPanel: React.FC = () => {
  const {
    selectedText,
    translation,
    loading,
    error,
    setSelectedText,
    setAIService,
    translateText,
    clearTranslation,
  } = useTranslationStore();
  
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [ankiService, setAnkiService] = useState<AnkiService | null>(null);

  useEffect(() => {
    // Initialize AI service
    const aiConfig: AIConfig = {
      provider: 'deepseek',
      baseURL: 'https://api.deepseek.com',
      apiKey: '', // Will be configured by user in Phase 2
      model: 'deepseek-chat',
    };
    setAIService(new AIService(aiConfig));

    // Initialize Anki service
    const ankiConfig: AnkiConfig = {
      host: 'localhost:8765',
      defaultDeck: 'Default',
    };
    setAnkiService(new AnkiService(ankiConfig));
  }, [setAIService]);

  useEffect(() => {
    window.electronAPI.onTextSelected(async (text) => {
      setSelectedText(text);
      if (text.trim()) {
        await translateText(text);
      }
    });
  }, [setSelectedText, translateText]);

  const handleWordToggle = (word: string) => {
    setSelectedWords(prev =>
      prev.includes(word)
        ? prev.filter(w => w !== word)
        : [...prev, word]
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-lg font-bold mb-2">Selected Text</h2>
      <div className="p-3 bg-gray-100 rounded mb-4">
        {selectedText || 'No text selected'}
      </div>
      
      {loading && <LoadingSpinner />}
      
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded mb-4">
          Error: {error}
        </div>
      )}
      
      {translation && !loading && (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">Translation</h3>
            <p className="p-2 bg-blue-50 rounded">{translation.translation}</p>
          </div>
          
          {translation.grammar && (
            <div>
              <h3 className="font-semibold text-gray-700">Grammar Analysis</h3>
              <p className="p-2 bg-green-50 rounded">{translation.grammar}</p>
            </div>
          )}
          
          {translation.words && translation.words.length > 0 && (
            <>
              <WordList
                words={translation.words}
                selectedWords={selectedWords}
                onWordToggle={handleWordToggle}
              />
              
              <AddToAnkiButton
                translation={translation}
                ankiService={ankiService}
                selectedWords={selectedWords}
              />
            </>
          )}
          
          <div className="flex gap-2">
            <button
              onClick={clearTranslation}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear
            </button>
            
            <button
              onClick={() => setSelectedWords([])}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslationPanel;
```

- [ ] **Step 8: Write failing test for AddToAnkiButton**

Create `tests/components/AddToAnkiButton.test.tsx`:
```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddToAnkiButton } from '@/renderer/components/AddToAnkiButton';

const mockTranslation = {
  original: 'Hello',
  translation: '你好',
  isSentence: false,
  words: [{ word: 'Hello', meaning: '你好', partOfSpeech: 'interjection' }],
};

describe('AddToAnkiButton', () => {
  it('renders button', () => {
    render(
      <AddToAnkiButton
        translation={mockTranslation}
        ankiService={null}
        selectedWords={[]}
      />
    );
    expect(screen.getByText('Add to Anki')).toBeInTheDocument();
  });
});
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npm test -- tests/components/AddToAnkiButton.test.tsx`
Expected: PASS

- [ ] **Step 10: Test complete workflow**

1. Start dev server: `npm run dev`
2. Start Electron: `npm start`
3. Select text in any application, copy (Ctrl+C)
4. Press Ctrl+Shift+T
5. Verify translation appears
6. Select words and click "Add to Anki"
7. Verify card created in Anki (if AnkiConnect running)

- [ ] **Step 11: Commit**

```bash
git add src/services/ankiService.ts src/renderer/components/WordList.tsx src/renderer/components/AddToAnkiButton.tsx src/renderer/components/TranslationPanel.tsx
git commit -m "feat: AnkiConnect integration with word selection and mixed cards"
```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-02-translate2anki-phase1-implementation.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**