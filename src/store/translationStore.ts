import { create } from 'zustand';
import { TranslationResult } from '@/types';
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
      console.error('Translation error:', error);
      let errorMessage = 'Translation failed';
      if (error instanceof Error) {
        if (error.message.includes('Unexpected token')) {
          errorMessage = 'API 返回格式错误，请重试';
        } else {
          errorMessage = error.message;
        }
      }
      set({
        error: errorMessage,
        loading: false
      });
    }
  },

  clearTranslation: () => set({ translation: null, error: null }),
}));

export default useTranslationStore;