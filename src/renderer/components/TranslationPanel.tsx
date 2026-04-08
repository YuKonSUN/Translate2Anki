import React, { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { AddToAnkiButton } from './AddToAnkiButton';
import SettingsPanel from './SettingsPanel';
import useTranslationStore from '@/store/translationStore';
import { AIService } from '@/services/aiService';
import { AnkiService } from '@/services/ankiService';
import { AIConfig, AnkiConfig, WordAnalysis } from '@/types';

// 播放文本语音
const speakText = (text: string, lang: string = 'en-US') => {
  if ('speechSynthesis' in window) {
    // 取消之前的语音
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }
};

const TranslationPanel: React.FC = () => {
  const {
    selectedText,
    translation,
    loading,
    error,
    setSelectedText,
    setAIService,
    translateText,
    clearTranslation,
  } = useTranslationStore();

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [ankiService, setAnkiService] = useState<AnkiService | null>(null);
  const [apiTestResult, setApiTestResult] = useState<string | null>(null);
  const [testingApi, setTestingApi] = useState(false);
  const [expandedWord, setExpandedWord] = useState<WordAnalysis | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const reloadServices = () => {
    if (window.electronAPI?.getAppConfig) {
      window.electronAPI.getAppConfig().then((config) => {
        const cfg: AIConfig = {
          provider: config.ai.provider as AIConfig['provider'],
          baseURL: config.ai.baseURL,
          apiKey: config.ai.apiKey,
          model: config.ai.model,
        };
        setAIService(new AIService(cfg, config.prompts));
      }).catch((err) => {
        console.error('Failed to load app config:', err);
      });
    }
  };

  useEffect(() => {
    // Initialize Anki service
    const ankiConfig: AnkiConfig = {
      host: 'localhost:8765',
      defaultDeck: 'Translate2Anki',
    };
    setAnkiService(new AnkiService(ankiConfig));
  }, []);

  useEffect(() => {
    // Load AI config from main process
    if (window.electronAPI?.getAppConfig) {
      window.electronAPI.getAppConfig().then((config) => {
        const cfg: AIConfig = {
          provider: config.ai.provider as AIConfig['provider'],
          baseURL: config.ai.baseURL,
          apiKey: config.ai.apiKey,
          model: config.ai.model,
        };
        setAIService(new AIService(cfg, config.prompts));
      }).catch((err) => {
        console.error('Failed to load app config:', err);
      });
    }
  }, [setAIService]);

  useEffect(() => {
    if (window.electronAPI?.onTextSelected) {
      window.electronAPI.onTextSelected(async (text) => {
        if (!text.trim()) {
          setSelectedText('⚠️ 请复制要翻译的文本（跳过命令/代码）');
          return;
        }
        setSelectedText(text);
        setExpandedWord(null);
        setSelectedWords([]);
        await translateText(text);
      });
    }
  }, [setSelectedText, translateText]);

  const handleWordToggle = (word: string) => {
    setSelectedWords(prev =>
      prev.includes(word)
        ? prev.filter(w => w !== word)
        : [...prev, word]
    );
  };

  const handleWordClick = (word: WordAnalysis) => {
    setExpandedWord(expandedWord?.word === word.word ? null : word);
  };

  const handleClose = () => {
    window.electronAPI?.hideWindow?.();
  };

  const testApiConnection = async () => {
    setTestingApi(true);
    setApiTestResult(null);
    try {
      // Load config from main process for API test
      const config = await window.electronAPI?.getAppConfig?.();
      const baseURL = config?.ai.baseURL || 'https://api.deepseek.com';
      const apiKey = config?.ai.apiKey;
      const response = await fetch(`${baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      if (response.ok) {
        setApiTestResult('✓ API 连接正常');
      } else {
        const errorData = await response.json();
        setApiTestResult(`✗ API 错误: ${errorData.error?.message || response.statusText} (状态码: ${response.status})`);
      }
    } catch (err) {
      setApiTestResult(`✗ 连接失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setTestingApi(false);
    }
  };

  const selectAllWords = () => {
    if (translation?.words) {
      setSelectedWords(translation.words.map(w => w.word));
    }
  };

  // 解析语法分析为结构化数据
  const parseGrammar = (grammar: string): string[] => {
    if (!grammar) return [];
    return grammar
      .split(/[;；。]|\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  return (
    <>
    <div className="bg-white rounded-lg shadow-2xl overflow-hidden" style={{ width: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">📚</span>
          <span className="text-white font-semibold">Translate2Anki</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="设置"
          >
            <span className="text-white">⚙️</span>
          </button>
          {/* 播放原文按钮 */}
          {selectedText && selectedText !== '⚠️ 请复制要翻译的文本（跳过命令/代码）' && (
            <button
              onClick={() => speakText(selectedText, 'en-US')}
              className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              title="播放原文"
            >
              <span className="text-white">🔊</span>
            </button>
          )}
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="关闭"
          >
            <span className="text-white">✕</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 选中文本 */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">📋 选中文本</span>
            {selectedText && selectedText !== '⚠️ 请复制要翻译的文本（跳过命令/代码）' && (
              <button
                onClick={() => speakText(selectedText, 'en-US')}
                className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
              >
                🔊 播放
              </button>
            )}
          </div>
          <div className="text-gray-800 font-medium leading-relaxed">
            {selectedText || '请选中文本后按 Ctrl+Shift+T'}
          </div>
        </div>

        {loading && <LoadingSpinner />}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-700 mb-1">
              <span>⚠️</span>
              <span className="font-semibold text-sm">错误</span>
            </div>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={testApiConnection}
              disabled={testingApi}
              className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
            >
              {testingApi ? '测试中...' : '测试 API'}
            </button>
            {apiTestResult && (
              <div className={`mt-1 text-xs ${apiTestResult.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
                {apiTestResult}
              </div>
            )}
          </div>
        )}

        {translation && !loading && (
          <div className="space-y-3">
            {/* 翻译 */}
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-green-600 font-medium">🌐 翻译</span>
                <button
                  onClick={() => speakText(translation.translation, 'zh-CN')}
                  className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors"
                >
                  🔊 播放
                </button>
              </div>
              <div className="text-lg text-gray-800 font-medium">{translation.translation}</div>
            </div>

            {/* 语法分析 */}
            {translation.grammar && (
              <div className="bg-purple-50 rounded-lg p-3">
                <div className="text-sm text-purple-600 font-medium mb-2">📐 语法分析</div>
                <ul className="space-y-1">
                  {parseGrammar(translation.grammar).map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-purple-400 mt-0.5">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 核心词汇 */}
            {translation.words && translation.words.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-orange-600 font-medium">📚 核心词汇</span>
                  <button
                    onClick={selectAllWords}
                    className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors"
                  >
                    全选
                  </button>
                </div>
                
                {/* 词汇标签 */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {translation.words.map((word) => (
                    <div key={word.word} className="flex items-center">
                      <button
                        onClick={() => handleWordToggle(word.word)}
                        className={`px-2 py-1 rounded-l-md text-sm border-2 border-r-0 transition-all ${
                          selectedWords.includes(word.word)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <span className="font-medium">{word.word}</span>
                        <span className="text-xs opacity-75 ml-1">({word.partOfSpeech})</span>
                        {selectedWords.includes(word.word) && <span className="ml-1">✓</span>}
                      </button>
                      <button
                        onClick={() => handleWordClick(word)}
                        className={`px-2 py-1 rounded-r-md border-2 transition-all ${
                          expandedWord?.word === word.word
                            ? 'bg-orange-200 text-orange-700 border-orange-300'
                            : 'bg-white text-gray-400 border-gray-200 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                        title="查看详情"
                      >
                        🔍
                      </button>
                      <button
                        onClick={() => speakText(word.word, 'en-US')}
                        className="ml-1 p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        title="播放发音"
                      >
                        🔊
                      </button>
                    </div>
                  ))}
                </div>

                {/* 词汇详情 */}
                {expandedWord && (
                  <div className="bg-white rounded-lg p-3 border border-orange-200 mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-orange-800">{expandedWord.word}</h4>
                        <button
                          onClick={() => speakText(expandedWord.word, 'en-US')}
                          className="text-blue-500 hover:text-blue-600"
                        >
                          🔊
                        </button>
                      </div>
                      <button
                        onClick={() => setExpandedWord(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><span className="text-gray-500">释义：</span><span className="font-medium">{expandedWord.meaning}</span></div>
                      <div><span className="text-gray-500">词性：</span>{expandedWord.partOfSpeech}</div>
                      {expandedWord.root && (
                        <div><span className="text-gray-500">词根：</span><span className="text-purple-600">{expandedWord.root}</span></div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 添加到 Anki */}
            <AddToAnkiButton
              translation={translation}
              ankiService={ankiService}
              selectedWords={selectedWords}
            />

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={clearTranslation}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                🗑️ 清空
              </button>
              <button
                onClick={() => setSelectedWords([])}
                className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                ↩️ 取消选择
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* 设置面板 */}
    {showSettings && (
      <SettingsPanel
        onClose={() => setShowSettings(false)}
        onSave={reloadServices}
      />
    )}
    </>
  );
};

export default TranslationPanel;
