import React, { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { Translation } from '../../types';

interface TranslationPanelProps {
  initialText?: string;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ initialText = '' }) => {
  const [originalText, setOriginalText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate translation API call
  const simulateTranslation = async (text: string): Promise<Translation> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          originalText: text,
          translatedText: `Translated: ${text}`,
          sourceLanguage: 'en',
          targetLanguage: 'es',
        });
      }, 1500);
    });
  };

  const handleTranslate = async () => {
    if (!originalText.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await simulateTranslation(originalText);
      setTranslatedText(result.translatedText);
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error('Translation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToAnki = () => {
    if (!translatedText) {
      setError('No translation to add to Anki');
      return;
    }
    // TODO: Implement Anki integration in Task 5
    console.log('Adding to Anki:', { originalText, translatedText });
    alert('Anki integration will be implemented in Task 5');
  };

  // Listen for clipboard text from main process
  useEffect(() => {
    const handleClipboardText = (text: string) => {
      setOriginalText(text);
    };

    if (window.electronAPI) {
      window.electronAPI.onClipboardText(handleClipboardText);
    }

    // Cleanup
    return () => {
      // Note: In a real app, we'd need to remove the listener
    };
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Translate2Anki</h2>

      <div className="mb-4">
        <label htmlFor="originalText" className="block text-sm font-medium text-gray-700 mb-1">
          Original Text
        </label>
        <textarea
          id="originalText"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          placeholder="Enter text to translate or use Ctrl+Shift+T to paste from clipboard"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="translatedText" className="block text-sm font-medium text-gray-700 mb-1">
          Translated Text
        </label>
        <textarea
          id="translatedText"
          className="w-full p-3 border border-gray-300 rounded-md bg-gray-50"
          rows={3}
          value={translatedText}
          readOnly
          placeholder="Translation will appear here"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      <div className="flex gap-3">
        <button
          onClick={handleTranslate}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Translate
        </button>
        <button
          onClick={handleAddToAnki}
          disabled={!translatedText || isLoading}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add to Anki
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>Tip: Use Ctrl+Shift+T (Cmd+Shift+T on Mac) to quickly paste text from clipboard</p>
      </div>
    </div>
  );
};

export default TranslationPanel;