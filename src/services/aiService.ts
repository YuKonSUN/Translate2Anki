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

    const content = response.data.choices[0].message.content;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (e) {
      // If JSON parsing fails, return a structured object with the raw content
      return {
        translation: content,
        partOfSpeech: 'unknown',
        root: '',
        example: ''
      };
    }
  }

  async analyzeSentence(sentence: string): Promise<any> {
    const response = await axios.post(
      `${this.config.baseURL}/chat/completions`,
      {
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'Analyze the given English sentence. Provide: 1. Chinese translation, 2. Grammar analysis (break down structure), 3. Key vocabulary words with meanings, part of speech, and etymology. Return as JSON: {translation: string, grammar: string, words: Array<{word: string, meaning: string, partOfSpeech: string, root: string}>}'
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

    const content = response.data.choices[0].message.content;
    try {
      // Try to extract JSON from markdown code block if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr);
    } catch (e) {
      // If JSON parsing fails, return a structured object with the raw content
      return {
        translation: content,
        partOfSpeech: 'unknown',
        root: '',
        example: ''
      };
    }
  }
}