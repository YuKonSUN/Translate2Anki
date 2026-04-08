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

describe('TTS functionality', () => {
  let service: AnkiService;

  beforeEach(() => {
    service = new AnkiService({ host: 'localhost:8765', defaultDeck: 'Test' });
    // 重置所有 mock
    jest.clearAllMocks();
  });

  it('should generate consistent hash for same text', () => {
    // 通过反射访问私有方法
    const hash1 = (service as any).textHash('hello');
    const hash2 = (service as any).textHash('hello');
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{1,12}$/);
  });

  it('should generate different hash for different text', () => {
    const hash1 = (service as any).textHash('hello');
    const hash2 = (service as any).textHash('world');
    expect(hash1).not.toBe(hash2);
  });

  it('should generate and store audio successfully', async () => {
    // Mock TTS fetch
    const mockAudioData = new ArrayBuffer(100);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockAudioData),
    });

    // Mock AnkiConnect storeMediaFile
    const mockRequest = jest.spyOn(service as any, 'request').mockResolvedValue(null);

    const filename = await service.generateAndStoreAudio('test word', 'en');

    // 验证文件名格式
    expect(filename).toMatch(/^tts_[0-9a-f]{1,12}\.mp3$/);

    // 验证 TTS API 调用
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('translate.google.com/translate_tts')
    );

    // 验证 AnkiConnect 调用
    expect(mockRequest).toHaveBeenCalledWith('storeMediaFile', {
      filename: expect.any(String),
      data: expect.any(String) // base64 encoded audio
    });
  });

  it('should handle TTS API failure gracefully', async () => {
    // Mock TTS fetch to fail
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    await expect(service.generateAndStoreAudio('test word', 'en'))
      .rejects.toThrow('TTS request failed: 500 Internal Server Error');
  });

  it('should handle network errors in TTS', async () => {
    // Mock network error
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(service.generateAndStoreAudio('test word', 'en'))
      .rejects.toThrow('Network error');
  });
});
