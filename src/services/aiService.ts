import axios from 'axios';
import { AIConfig, TranslationResult, WordAnalysis } from '@/types';

export class AIService {
  private config: AIConfig;
  private client: any;

  constructor(config: AIConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async translate(
    text: string,
    sourceLanguage: string = 'auto',
    targetLanguage: string = 'en'
  ): Promise<TranslationResult> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following text from ${sourceLanguage} to ${targetLanguage}. Provide only the translation without additional commentary.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const translation = response.data.choices[0]?.message?.content?.trim();

      if (!translation) {
        throw new Error('No translation received from AI');
      }

      return {
        translation,
        sourceLanguage,
        targetLanguage,
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeWord(word: string, language: string = 'en'): Promise<WordAnalysis> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a language expert. Analyze the word "${word}" in ${language}. Provide:
1. Pronunciation (if applicable)
2. Part of speech
3. Definition
4. Example sentence
5. Synonyms (if any)

Format the response as JSON with these keys: pronunciation, partOfSpeech, definition, example, synonyms.`
          },
          {
            role: 'user',
            content: `Analyze the word: ${word}`
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const analysisText = response.data.choices[0]?.message?.content?.trim();

      if (!analysisText) {
        throw new Error('No analysis received from AI');
      }

      // Parse the JSON response
      const analysis = JSON.parse(analysisText);

      return {
        word,
        pronunciation: analysis.pronunciation,
        partOfSpeech: analysis.partOfSpeech,
        definition: analysis.definition,
        example: analysis.example,
        synonyms: analysis.synonyms,
      };
    } catch (error) {
      console.error('Word analysis error:', error);
      throw new Error(`Word analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeSentence(sentence: string, language: string = 'en'): Promise<{
    grammarNotes: string[];
    wordAnalyses: WordAnalysis[];
  }> {
    try {
      const response = await this.client.post('/chat/completions', {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a grammar expert. Analyze the sentence "${sentence}" in ${language}. Provide:
1. Grammar notes (key grammatical points)
2. Analysis of important words (pronunciation, part of speech, definition, example, synonyms)

Format the response as JSON with these keys: grammarNotes (array of strings), wordAnalyses (array of objects with word, pronunciation, partOfSpeech, definition, example, synonyms).`
          },
          {
            role: 'user',
            content: `Analyze the sentence: ${sentence}`
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const analysisText = response.data.choices[0]?.message?.content?.trim();

      if (!analysisText) {
        throw new Error('No analysis received from AI');
      }

      // Parse the JSON response
      const analysis = JSON.parse(analysisText);

      return {
        grammarNotes: analysis.grammarNotes || [],
        wordAnalyses: analysis.wordAnalyses || [],
      };
    } catch (error) {
      console.error('Sentence analysis error:', error);
      throw new Error(`Sentence analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  updateConfig(newConfig: Partial<AIConfig>) {
    this.config = { ...this.config, ...newConfig };

    // Update axios client with new config
    this.client = axios.create({
      baseURL: this.config.baseURL,
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }
}