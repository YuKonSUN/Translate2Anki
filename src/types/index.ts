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

export interface AnkiConfig {
  host: string;
  defaultDeck: string;
}

export interface ElectronAPI {
  getClipboardText: () => Promise<string>;
  onTextSelected: (callback: (text: string) => void) => void;
  hideWindow: () => Promise<void>;
  quitApp: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
