import React, { useState } from 'react';
import { AnkiService, WordCardData, GrammarCardData } from '@/services/ankiService';
import { TranslationResult, WordAnalysis } from '@/types';

interface AddToAnkiButtonProps {
  translation: TranslationResult;
  ankiService: AnkiService | null;
  selectedWords: string[];
}

export const AddToAnkiButton: React.FC<AddToAnkiButtonProps> = ({
  translation,
  ankiService,
  selectedWords,
}) => {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [addGrammar, setAddGrammar] = useState(true);

  const handleAddToAnki = async () => {
    if (!ankiService) {
      setError('Anki 服务未配置');
      return;
    }

    if (selectedWords.length === 0 && !addGrammar) {
      setError('请至少选择一个单词或勾选添加语法卡片');
      return;
    }

    setAdding(true);
    setError(null);
    setSuccess(null);

    try {
      // 确保卡组存在
      await ankiService.ensureTranslate2AnkiDeck();

      const createdCards: number[] = [];

      // 1. 创建单词卡片（每个单词一张）
      if (selectedWords.length > 0) {
        const wordDataList: WordCardData[] = selectedWords
          .map(wordStr => {
            const wordInfo = translation.words?.find(w => w.word === wordStr);
            if (!wordInfo) return null;
            return {
              word: wordInfo.word,
              meaning: wordInfo.meaning,
              partOfSpeech: wordInfo.partOfSpeech,
              root: wordInfo.root,
              example: translation.original, // 原文句子作为例句
              exampleTranslation: translation.translation, // 句子翻译作为例句翻译
            };
          })
          .filter((data): data is WordCardData => data !== null);

        const wordCardIds = await ankiService.createWordCards(wordDataList, true);
        createdCards.push(...wordCardIds);
      }

      // 2. 创建语法结构卡片（如果勾选）
      if (addGrammar && translation.isSentence && translation.grammar) {
        const grammarData: GrammarCardData = {
          sentence: translation.original,
          translation: translation.translation,
          grammar: translation.grammar,
        };
        const grammarCardId = await ankiService.createGrammarCard(grammarData);
        createdCards.push(grammarCardId);
      }

      // 显示成功信息
      const wordCount = selectedWords.length;
      const grammarCount = addGrammar && translation.isSentence ? 1 : 0;
      setSuccess(`成功添加 ${wordCount} 个单词卡片${grammarCount > 0 ? ' + 1 个语法卡片' : ''}到 Translate2Anki`);
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加到 Anki 失败');
    } finally {
      setAdding(false);
    }
  };

  const selectedCount = selectedWords.length;
  const canAddGrammar = translation.isSentence && translation.grammar;

  return (
    <div className="space-y-4">
      {/* 选项 */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="text-sm font-medium text-gray-700 mb-2">添加选项：</div>
        
        {/* 语法卡片选项 */}
        {canAddGrammar && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={addGrammar}
              onChange={(e) => setAddGrammar(e.target.checked)}
              className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              添加语法结构卡片（正面：英文句子，背面：翻译+语法分析）
            </span>
          </label>
        )}
        
        {/* 单词卡片统计 */}
        <div className="text-sm text-gray-600">
          已选择 <span className="font-semibold text-blue-600">{selectedCount}</span> 个单词
          {selectedCount > 0 && '（每个单词生成一张卡片）'}
        </div>
      </div>

      {/* 添加按钮 */}
      <button
        onClick={handleAddToAnki}
        disabled={adding || !ankiService || (selectedCount === 0 && !addGrammar)}
        className={`w-full px-4 py-3 rounded-xl font-medium transition-all ${
          adding || !ankiService || (selectedCount === 0 && !addGrammar)
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {adding ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span> 添加中...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span>🎯</span>
            {selectedCount > 0 || addGrammar
              ? `添加到 Anki (${selectedCount} 单词${addGrammar && canAddGrammar ? ' + 语法' : ''})`
              : '请选择要添加的内容'}
          </span>
        )}
      </button>
      
      {/* 错误提示 */}
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}
      
      {/* 成功提示 */}
      {success && (
        <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm flex items-center gap-2">
          <span>✓</span> {success}
        </div>
      )}

      {/* 说明 */}
      <div className="text-xs text-gray-400 text-center">
        卡片将添加到「Translate2Anki」卡组
      </div>
    </div>
  );
};
