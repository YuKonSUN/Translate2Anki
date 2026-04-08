import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TranslationPanel from '../../src/renderer/components/TranslationPanel';
import useTranslationStore from '@/store/translationStore';
import { AIService } from '@/services/aiService';
import { AnkiService } from '@/services/ankiService';

// Mock dependencies
jest.mock('@/store/translationStore');
jest.mock('@/services/aiService');
jest.mock('@/services/ankiService');
jest.mock('@/renderer/components/WordList', () => ({
  WordList: () => <div data-testid="word-list">WordList</div>,
}));
jest.mock('@/renderer/components/AddToAnkiButton', () => ({
  AddToAnkiButton: () => <div data-testid="add-to-anki-button">AddToAnkiButton</div>,
}));
jest.mock('@/renderer/components/LoadingSpinner', () => ({
  __esModule: true,
  default: () => <div data-testid="loading-spinner">Loading...</div>,
}));

const mockUseTranslationStore = useTranslationStore as jest.MockedFunction<typeof useTranslationStore>;
const mockAIService = AIService as jest.MockedClass<typeof AIService>;
const mockAnkiService = AnkiService as jest.MockedClass<typeof AnkiService>;

// Mock window.electronAPI
const mockElectronAPI = {
  onTextSelected: jest.fn(),
};

beforeEach(() => {
  (window as any).electronAPI = mockElectronAPI;
  jest.clearAllMocks();

  // Default mock for translation store
  const mockTranslateText = jest.fn();
  const mockSetAIService = jest.fn();
  const mockSetSelectedText = jest.fn();
  const mockClearTranslation = jest.fn();

  mockUseTranslationStore.mockReturnValue({
    selectedText: '',
    translation: null,
    loading: false,
    error: null,
    setSelectedText: mockSetSelectedText,
    setAIService: mockSetAIService,
    translateText: mockTranslateText,
    clearTranslation: mockClearTranslation,
  } as any);

  // Mock AIService constructor
  mockAIService.mockImplementation(() => ({
    translate: jest.fn(),
    analyzeWord: jest.fn(),
    analyzeSentence: jest.fn(),
  } as any));

  // Mock AnkiService constructor
  mockAnkiService.mockImplementation(() => ({
    addCard: jest.fn(),
    addMixedCard: jest.fn(),
    getDecks: jest.fn(),
    createDeck: jest.fn(),
  } as any));
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('TranslationPanel', () => {
  it('renders with no text selected', () => {
    render(<TranslationPanel />);

    expect(screen.getByText('选中文本')).toBeInTheDocument();
    expect(screen.getByText('请复制文本并按 Ctrl+Shift+T 翻译')).toBeInTheDocument();
  });

  it('shows selected text when provided', () => {
    mockUseTranslationStore.mockReturnValue({
      selectedText: 'Hello world',
      translation: null,
      loading: false,
      error: null,
      setSelectedText: jest.fn(),
      setAIService: jest.fn(),
      translateText: jest.fn(),
      clearTranslation: jest.fn(),
    } as any);

    render(<TranslationPanel />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows loading spinner when loading', () => {
    mockUseTranslationStore.mockReturnValue({
      selectedText: '',
      translation: null,
      loading: true,
      error: null,
      setSelectedText: jest.fn(),
      setAIService: jest.fn(),
      translateText: jest.fn(),
      clearTranslation: jest.fn(),
    } as any);

    render(<TranslationPanel />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows error when error exists', () => {
    mockUseTranslationStore.mockReturnValue({
      selectedText: '',
      translation: null,
      loading: false,
      error: 'Translation failed',
      setSelectedText: jest.fn(),
      setAIService: jest.fn(),
      translateText: jest.fn(),
      clearTranslation: jest.fn(),
    } as any);

    render(<TranslationPanel />);

    expect(screen.getByText('错误')).toBeInTheDocument();
    expect(screen.getByText('Translation failed')).toBeInTheDocument();
  });

  it('shows translation when available', () => {
    const mockTranslation = {
      original: 'Hello',
      translation: '你好',
      isSentence: false,
      words: [
        {
          word: 'Hello',
          meaning: '你好',
          partOfSpeech: 'interjection',
          root: 'Hello',
        }
      ],
    };

    mockUseTranslationStore.mockReturnValue({
      selectedText: 'Hello',
      translation: mockTranslation,
      loading: false,
      error: null,
      setSelectedText: jest.fn(),
      setAIService: jest.fn(),
      translateText: jest.fn(),
      clearTranslation: jest.fn(),
    } as any);

    render(<TranslationPanel />);

    expect(screen.getByText('翻译')).toBeInTheDocument();
    expect(screen.getByText('你好')).toBeInTheDocument();
    expect(screen.getByText('核心词汇')).toBeInTheDocument();
    expect(screen.getByTestId('add-to-anki-button')).toBeInTheDocument();
  });

  it('shows grammar analysis for sentences', () => {
    const mockTranslation = {
      original: 'Hello world.',
      translation: '你好，世界。',
      isSentence: true,
      grammar: 'Simple greeting sentence',
      words: [
        {
          word: 'Hello',
          meaning: '你好',
          partOfSpeech: 'interjection',
          root: 'Hello',
        },
        {
          word: 'world',
          meaning: '世界',
          partOfSpeech: 'noun',
          root: 'world',
        }
      ],
    };

    mockUseTranslationStore.mockReturnValue({
      selectedText: 'Hello world.',
      translation: mockTranslation,
      loading: false,
      error: null,
      setSelectedText: jest.fn(),
      setAIService: jest.fn(),
      translateText: jest.fn(),
      clearTranslation: jest.fn(),
    } as any);

    render(<TranslationPanel />);

    expect(screen.getByText('语法分析')).toBeInTheDocument();
    expect(screen.getByText('Simple greeting sentence')).toBeInTheDocument();
  });

  it('sets up electronAPI listener on mount', () => {
    render(<TranslationPanel />);

    expect(mockElectronAPI.onTextSelected).toHaveBeenCalled();
  });

  it('calls translateText when text is selected via electronAPI', async () => {
    const mockTranslateText = jest.fn();
    const mockSetSelectedText = jest.fn();

    mockUseTranslationStore.mockReturnValue({
      selectedText: '',
      translation: null,
      loading: false,
      error: null,
      setSelectedText: mockSetSelectedText,
      setAIService: jest.fn(),
      translateText: mockTranslateText,
      clearTranslation: jest.fn(),
    } as any);

    render(<TranslationPanel />);

    // Get the callback passed to onTextSelected
    const callback = mockElectronAPI.onTextSelected.mock.calls[0][0];

    await act(async () => {
      await callback('Hello world');
    });

    expect(mockSetSelectedText).toHaveBeenCalledWith('Hello world');
    expect(mockTranslateText).toHaveBeenCalledWith('Hello world');
  });

  it('shows warning when empty text is selected', async () => {
    const mockTranslateText = jest.fn();
    const mockSetSelectedText = jest.fn();

    mockUseTranslationStore.mockReturnValue({
      selectedText: '',
      translation: null,
      loading: false,
      error: null,
      setSelectedText: mockSetSelectedText,
      setAIService: jest.fn(),
      translateText: mockTranslateText,
      clearTranslation: jest.fn(),
    } as any);

    render(<TranslationPanel />);

    const callback = mockElectronAPI.onTextSelected.mock.calls[0][0];

    await act(async () => {
      await callback('');
    });

    expect(mockSetSelectedText).toHaveBeenCalledWith('⚠️ 请复制要翻译的文本（跳过命令/代码）');
    expect(mockTranslateText).not.toHaveBeenCalled();
  });
});
