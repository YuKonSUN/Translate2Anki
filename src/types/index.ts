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

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}