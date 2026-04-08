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

export interface WordCardData {
  word: string;
  meaning: string;
  partOfSpeech: string;
  root?: string;
  example: string; // 英文例句
  exampleTranslation: string; // 例句中文翻译
}

export interface GrammarCardData {
  sentence: string;
  translation: string;
  grammar: string;
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

  /**
   * 创建单词卡片
   * 正面：单词 + 语音播放按钮
   * 背面：含义 + 词性 + 词根 + 例句（中英对照）
   */
  async createWordCard(data: WordCardData): Promise<number> {
    // 正面：单词 + TTS 按钮（使用 Anki 的 [sound:...] 语法）
    const front = `
      <div style="font-size: 28px; font-weight: bold; text-align: center; padding: 30px; color: #1f2937; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
        ${data.word}
      </div>
      <div style="text-align: center; margin-top: 10px;">
        <span style="font-size: 14px; color: #6b7280;">🔊 点击播放发音</span>
      </div>
    `;
    
    // 背面：使用亮色主题
    const backParts = [
      `<div style="background: #ffffff; padding: 20px; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">`,
      
      // 含义 - 高对比度蓝色
      `<div style="font-size: 24px; color: #2563eb; font-weight: bold; margin-bottom: 16px; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">`,
      `${data.meaning}`,
      `</div>`,
      
      // 词性 - 深灰色
      `<div style="color: #4b5563; margin-bottom: 12px; font-size: 16px;">`,
      `<strong style="color: #1f2937;">词性：</strong>${data.partOfSpeech}`,
      `</div>`,
    ];
    
    // 词根 - 紫色
    if (data.root) {
      backParts.push(
        `<div style="color: #7c3aed; margin-bottom: 16px; font-size: 15px; line-height: 1.6;">`,
        `<strong style="color: #1f2937;">词根：</strong>${data.root}`,
        `</div>`
      );
    }
    
    // 例句部分 - 带背景色
    backParts.push(
      `<div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin-top: 16px; border-left: 4px solid #3b82f6;">`,
      `<div style="color: #1f2937; font-weight: bold; margin-bottom: 8px; font-size: 14px;">📖 例句</div>`,
      `<div style="color: #374151; font-style: italic; margin-bottom: 8px; line-height: 1.6; font-size: 15px;">`,
      `${data.example}`,
      `</div>`,
      `<div style="color: #059669; font-size: 14px; line-height: 1.6;">`,
      `${data.exampleTranslation}`,
      `</div>`,
      `</div>`,
      `</div>`
    );
    
    const back = backParts.join('');

    return this.createCard({
      deckName: 'Translate2Anki',
      front,
      back,
      tags: ['translate2anki', 'vocabulary'],
    });
  }

  /**
   * 创建语法结构卡片
   * 正面：英文句子 + 语音按钮
   * 背面：句子意思 + 结构分析
   */
  async createGrammarCard(data: GrammarCardData): Promise<number> {
    const front = `
      <div style="font-size: 20px; padding: 25px; line-height: 1.8; color: #1f2937; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 600;">
        ${data.sentence}
      </div>
      <div style="text-align: center; margin-top: 10px;">
        <span style="font-size: 14px; color: #6b7280;">🔊 点击播放发音</span>
      </div>
    `;
    
    const back = `
      <div style="background: #ffffff; padding: 20px; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="font-size: 20px; color: #059669; font-weight: bold; margin-bottom: 16px; line-height: 1.6;">
          ${data.translation}
        </div>
        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <div style="color: #92400e; font-weight: bold; margin-bottom: 8px; font-size: 14px;">📐 语法分析</div>
          <div style="color: #78350f; line-height: 1.8; font-size: 15px;">
            ${data.grammar}
          </div>
        </div>
      </div>
    `;

    return this.createCard({
      deckName: 'Translate2Anki',
      front,
      back,
      tags: ['translate2anki', 'grammar'],
    });
  }

  /**
   * 批量创建单词卡片（每个单词一张卡片）
   */
  async createWordCards(words: WordCardData[]): Promise<number[]> {
    const results = await Promise.all(
      words.map(word => 
        this.createWordCard(word).catch(err => {
          console.error(`Failed to create card for ${word.word}: ${err.message}`);
          return null;
        })
      )
    );
    return results.filter((id): id is number => id !== null);
  }

  async deckExists(deckName: string): Promise<boolean> {
    const decks = await this.request('deckNames');
    return decks.includes(deckName);
  }

  async createDeck(deckName: string): Promise<void> {
    await this.request('createDeck', { deck: deckName });
  }

  /**
   * 确保 Translate2Anki 卡组存在
   */
  async ensureTranslate2AnkiDeck(): Promise<void> {
    const exists = await this.deckExists('Translate2Anki');
    if (!exists) {
      await this.createDeck('Translate2Anki');
    }
  }
}
