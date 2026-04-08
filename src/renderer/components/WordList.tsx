import React from 'react';
import { WordAnalysis } from '@/types';

interface WordListProps {
  words: WordAnalysis[];
  selectedWords: string[];
  onWordToggle: (word: string) => void;
  onWordClick?: (word: WordAnalysis) => void;
  expandedWord?: WordAnalysis | null;
}

export const WordList: React.FC<WordListProps> = ({
  words,
  selectedWords,
  onWordToggle,
  onWordClick,
  expandedWord,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-700 flex items-center gap-2">
        <span>📚</span> 核心词汇
      </h3>
      
      {/* 词汇标签 */}
      <div className="flex flex-wrap gap-2">
        {words.map((word) => (
          <button
            key={word.word}
            onClick={() => {
              onWordToggle(word.word);
              onWordClick?.(word);
            }}
            className={`px-3 py-2 rounded-lg border-2 transition-all ${
              selectedWords.includes(word.word)
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            } ${expandedWord?.word === word.word ? 'ring-2 ring-blue-300' : ''}`}
          >
            <span className="font-medium">{word.word}</span>
            <span className="text-xs opacity-75 ml-1">({word.partOfSpeech})</span>
          </button>
        ))}
      </div>

      {/* 词汇详情 */}
      {expandedWord && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-lg text-blue-800">{expandedWord.word}</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">释义：</span>
              <span className="text-gray-800 font-medium">{expandedWord.meaning}</span>
            </div>
            <div>
              <span className="text-gray-500">词性：</span>
              <span className="text-gray-800">{expandedWord.partOfSpeech}</span>
            </div>
            {expandedWord.root && (
              <div>
                <span className="text-gray-500">词根/词源：</span>
                <span className="text-gray-800">{expandedWord.root}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
