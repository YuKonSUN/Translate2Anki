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

    // Mock the request method to handle both storeMediaFile and addNote
    const mockRequest = jest.spyOn(service as any, 'request')
      // First call: storeMediaFile for audio
      .mockResolvedValueOnce(null)
      // Second call: addNote for card creation
      .mockResolvedValueOnce(12345);

    // Mock fetch for TTS
    const mockAudioData = new ArrayBuffer(100);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockAudioData),
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

    // Mock the request method - it will be called multiple times
    let requestCallCount = 0;
    const mockRequest = jest.spyOn(service as any, 'request').mockImplementation(() => {
      requestCallCount++;
      // First two calls: storeMediaFile (return null)
      if (requestCallCount <= 2) {
        return Promise.resolve(null);
      }
      // Next two calls: addNote (return card IDs)
      else if (requestCallCount === 3) {
        return Promise.resolve(12345);
      } else if (requestCallCount === 4) {
        return Promise.resolve(12346);
      }
      return Promise.reject(new Error('Unexpected call'));
    });

    // Mock fetch for TTS (will be called twice, once for each word)
    const mockAudioData = new ArrayBuffer(100);
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioData),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(mockAudioData),
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

  it('should reject empty text', async () => {
    await expect(service.generateAndStoreAudio('', 'en'))
      .rejects.toThrow('Text cannot be empty');

    await expect(service.generateAndStoreAudio('   ', 'en'))
      .rejects.toThrow('Text cannot be empty');
  });

  it('should reject text that is too long', async () => {
    const longText = 'a'.repeat(201);
    await expect(service.generateAndStoreAudio(longText, 'en'))
      .rejects.toThrow('Text too long (201 characters, max 200)');
  });

  it('should accept text at maximum length', async () => {
    const maxLengthText = 'a'.repeat(200);
    // Mock successful response
    const mockAudioData = new ArrayBuffer(100);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockAudioData),
    });
    const mockRequest = jest.spyOn(service as any, 'request').mockResolvedValue(null);

    await expect(service.generateAndStoreAudio(maxLengthText, 'en')).resolves.toBeDefined();
  });

  it('should reject invalid language codes', async () => {
    await expect(service.generateAndStoreAudio('test', 'en123'))
      .rejects.toThrow('Invalid language code: en123');

    await expect(service.generateAndStoreAudio('test', 'en_US'))
      .rejects.toThrow('Invalid language code: en_US');

    // 测试有效的语言代码（带连字符）
    const mockAudioData = new ArrayBuffer(100);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockAudioData),
    });
    const mockRequest = jest.spyOn(service as any, 'request').mockResolvedValue(null);

    await expect(service.generateAndStoreAudio('test', 'en-us')).resolves.toBeDefined(); // 连字符应该被允许
    await expect(service.generateAndStoreAudio('test', 'zh-CN')).resolves.toBeDefined(); // 连字符应该被允许
  });

  it('should encode language parameter in URL', async () => {
    const mockAudioData = new ArrayBuffer(100);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockAudioData),
    });
    const mockRequest = jest.spyOn(service as any, 'request').mockResolvedValue(null);

    await service.generateAndStoreAudio('test', 'zh-CN');

    // 验证 URL 包含编码的语言参数
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('tl=zh-CN')
    );
  });
});
