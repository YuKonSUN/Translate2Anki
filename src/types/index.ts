export interface Translation {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

export interface AnkiCard {
  front: string;
  back: string;
  tags: string[];
}

export interface ElectronAPI {
  getClipboardText: () => Promise<string>;
  onClipboardText: (callback: (text: string) => void) => void;
}

export interface TranslationResult {
  translation: string;
  grammarNotes?: string[];
  wordAnalyses?: WordAnalysis[];
  sourceLanguage: string;
  targetLanguage: string;
}

export interface WordAnalysis {
  word: string;
  pronunciation?: string;
  partOfSpeech?: string;
  definition: string;
  example?: string;
  synonyms?: string[];
}

export interface AIConfig {
  apiKey: string;
  model: string;
  baseURL: string;
  temperature: number;
  maxTokens: number;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}