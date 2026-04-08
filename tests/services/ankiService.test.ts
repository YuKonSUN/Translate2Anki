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

  it('creates word card', async () => {
    const service = new AnkiService(mockConfig);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 12345, error: null }),
    });
    
    const cardId = await service.createWordCard({
      word: 'Hello',
      meaning: '你好',
      partOfSpeech: 'interjection',
      root: 'Old English',
      example: 'Hello, world!',
    });
    
    expect(cardId).toBe(12345);
  });

  it('creates grammar card', async () => {
    const service = new AnkiService(mockConfig);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: 12346, error: null }),
    });
    
    const cardId = await service.createGrammarCard({
      sentence: 'Hello, world!',
      translation: '你好，世界！',
      grammar: 'Simple greeting sentence',
    });
    
    expect(cardId).toBe(12346);
  });

  it('creates multiple word cards', async () => {
    const service = new AnkiService(mockConfig);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 12345, error: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ result: 12346, error: null }),
      });
    
    const cardIds = await service.createWordCards([
      { word: 'Hello', meaning: '你好', partOfSpeech: 'interjection', example: 'Hello!' },
      { word: 'world', meaning: '世界', partOfSpeech: 'noun', example: 'Hello world!' },
    ]);
    
    expect(cardIds).toHaveLength(2);
    expect(cardIds).toEqual([12345, 12346]);
  });

  it('ensures Translate2Anki deck exists', async () => {
    const service = new AnkiService(mockConfig);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: ['Default'], error: null }),
    });
    
    await service.ensureTranslate2AnkiDeck();
    expect(global.fetch).toHaveBeenCalled();
  });
});
