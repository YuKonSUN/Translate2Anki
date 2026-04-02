import { create } from 'zustand';
import { AIService } from '@/services/aiService';
import { CacheService } from '@/services/cacheService';
import { AIConfig, TranslationResult, WordAnalysis } from '@/types';

interface TranslationState {
  // State
  originalText: string;
  translationResult: TranslationResult | null;
  isLoading: boolean;
  error: string | null;
  aiConfig: AIConfig;

  // Services
  aiService: AIService | null;
  cacheService: CacheService | null;

  // Actions
  setOriginalText: (text: string) => void;
  setAiConfig: (config: Partial<AIConfig>) => void;
  initializeServices: () => void;
  translate: (text?: string, sourceLanguage?: string, targetLanguage?: string) => Promise<void>;
  analyzeWord: (word: string, language?: string) => Promise<WordAnalysis | null>;
  analyzeSentence: (sentence: string, language?: string) => Promise<{
    grammarNotes: string[];
    wordAnalyses: WordAnalysis[];
  } | null>;
  clearError: () => void;
  reset: () => void;
}

const defaultAiConfig: AIConfig = {
  apiKey: '',
  model: 'deepseek-chat',
  baseURL: 'https://api.deepseek.com',
  temperature: 0.7,
  maxTokens: 1000,
};

export const useTranslationStore = create<TranslationState>((set, get) => ({
  // Initial state
  originalText: '',
  translationResult: null,
  isLoading: false,
  error: null,
  aiConfig: defaultAiConfig,
  aiService: null,
  cacheService: null,

  // Actions
  setOriginalText: (text: string) => {
    set({ originalText: text });
  },

  setAiConfig: (config: Partial<AIConfig>) => {
    const newConfig = { ...get().aiConfig, ...config };
    set({ aiConfig: newConfig });

    // Update AI service if it exists
    const aiService = get().aiService;
    if (aiService) {
      aiService.updateConfig(newConfig);
    }
  },

  initializeServices: () => {
    const { aiConfig } = get();

    const aiService = new AIService(aiConfig);
    const cacheService = new CacheService();

    set({ aiService, cacheService });
  },

  translate: async (text?: string, sourceLanguage: string = 'auto', targetLanguage: string = 'en') => {
    const state = get();
    const textToTranslate = text || state.originalText;

    if (!textToTranslate.trim()) {
      set({ error: 'Please enter text to translate' });
      return;
    }

    // Check cache first
    const cacheKey = CacheService.generateKey(
      'translate',
      textToTranslate,
      sourceLanguage,
      targetLanguage
    );

    if (state.cacheService?.has(cacheKey)) {
      const cachedResult = state.cacheService.get<TranslationResult>(cacheKey);
      if (cachedResult) {
        set({ translationResult: cachedResult, error: null });
        return;
      }
    }

    // Initialize services if needed
    if (!state.aiService || !state.cacheService) {
      get().initializeServices();
    }

    set({ isLoading: true, error: null });

    try {
      const aiService = get().aiService!;
      const cacheService = get().cacheService!;

      // Determine if text is a single word or sentence
      const wordCount = textToTranslate.trim().split(/\s+/).length;
      let result: TranslationResult;

      if (wordCount === 1) {
        // Single word - get translation and analysis
        const [translation, wordAnalysis] = await Promise.all([
          aiService.translate(textToTranslate, sourceLanguage, targetLanguage),
          aiService.analyzeWord(textToTranslate, sourceLanguage === 'auto' ? targetLanguage : sourceLanguage),
        ]);

        result = {
          ...translation,
          wordAnalyses: [wordAnalysis],
        };
      } else {
        // Sentence - get translation and analysis
        const [translation, sentenceAnalysis] = await Promise.all([
          aiService.translate(textToTranslate, sourceLanguage, targetLanguage),
          aiService.analyzeSentence(textToTranslate, sourceLanguage === 'auto' ? targetLanguage : sourceLanguage),
        ]);

        result = {
          ...translation,
          grammarNotes: sentenceAnalysis.grammarNotes,
          wordAnalyses: sentenceAnalysis.wordAnalyses,
        };
      }

      // Cache the result
      cacheService.set(cacheKey, result, 3600000); // 1 hour TTL

      set({
        translationResult: result,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Translation error:', error);
      set({
        isLoading: false,
        error: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  },

  analyzeWord: async (word: string, language: string = 'en') => {
    const state = get();

    // Check cache first
    const cacheKey = CacheService.generateKey('analyzeWord', word, language);

    if (state.cacheService?.has(cacheKey)) {
      return state.cacheService.get<WordAnalysis>(cacheKey);
    }

    // Initialize services if needed
    if (!state.aiService || !state.cacheService) {
      get().initializeServices();
    }

    try {
      const aiService = get().aiService!;
      const cacheService = get().cacheService!;

      const analysis = await aiService.analyzeWord(word, language);

      // Cache the result
      cacheService.set(cacheKey, analysis, 3600000); // 1 hour TTL

      return analysis;
    } catch (error) {
      console.error('Word analysis error:', error);
      set({
        error: `Word analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return null;
    }
  },

  analyzeSentence: async (sentence: string, language: string = 'en') => {
    const state = get();

    // Check cache first
    const cacheKey = CacheService.generateKey('analyzeSentence', sentence, language);

    if (state.cacheService?.has(cacheKey)) {
      return state.cacheService.get<{
        grammarNotes: string[];
        wordAnalyses: WordAnalysis[];
      }>(cacheKey);
    }

    // Initialize services if needed
    if (!state.aiService || !state.cacheService) {
      get().initializeServices();
    }

    try {
      const aiService = get().aiService!;
      const cacheService = get().cacheService!;

      const analysis = await aiService.analyzeSentence(sentence, language);

      // Cache the result
      cacheService.set(cacheKey, analysis, 3600000); // 1 hour TTL

      return analysis;
    } catch (error) {
      console.error('Sentence analysis error:', error);
      set({
        error: `Sentence analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      return null;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      originalText: '',
      translationResult: null,
      isLoading: false,
      error: null,
    });
  },
}));