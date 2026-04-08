import { AIService } from '@/services/aiService';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AIService', () => {
  const mockConfig = {
    provider: 'deepseek' as const,
    baseURL: 'https://api.deepseek.com',
    apiKey: 'test-key',
    model: 'deepseek-chat',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('translates text', async () => {
    const service = new AIService(mockConfig);

    // Mock axios response
    mockedAxios.post.mockResolvedValue({
      data: {
        choices: [{ message: { content: '这是测试翻译' } }]
      }
    });

    const result = await service.translate('test translation');
    expect(result).toBe('这是测试翻译');
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://api.deepseek.com/chat/completions',
      expect.any(Object),
      expect.any(Object)
    );
  });
});