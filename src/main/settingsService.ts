import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

export interface AppSettings {
  ai: {
    provider: string;
    baseURL: string;
    apiKey: string;
    model: string;
  };
  prompts: {
    translate: string;
    analyzeWord: string;
    analyzeSentence: string;
  };
}

const defaultSettings: AppSettings = {
  ai: {
    provider: 'deepseek',
    baseURL: 'https://api.deepseek.com',
    apiKey: '',
    model: 'deepseek-chat',
  },
  prompts: {
    translate: 'You are a translation assistant. Translate the given text to Chinese if it is English, or to English if it is Chinese. Return only the translation without any additional text.',
    analyzeWord: 'Analyze the given English word. Provide: 1. Chinese translation, 2. Part of speech, 3. Word root/etymology if known, 4. Example sentence. Return as JSON: {translation: string, partOfSpeech: string, root: string, example: string}',
    analyzeSentence: 'Analyze the given English sentence. Provide: 1. Chinese translation, 2. Grammar analysis (break down structure), 3. Key vocabulary words with meanings, part of speech, and etymology. Return as JSON: {translation: string, grammar: string, words: Array<{word: string, meaning: string, partOfSpeech: string, root: string}>}',
  },
};

export function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      return {
        ai: { ...defaultSettings.ai, ...saved.ai },
        prompts: { ...defaultSettings.prompts, ...saved.prompts },
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return { ...defaultSettings };
}

export function saveSettings(settings: AppSettings): void {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
