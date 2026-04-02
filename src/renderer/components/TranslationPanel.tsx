import React, { useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useTranslationStore } from '@/store/translationStore';

interface TranslationPanelProps {
  initialText?: string;
}

const TranslationPanel: React.FC<TranslationPanelProps> = ({ initialText = '' }) => {
  const {
    originalText,
    translationResult,
    isLoading,
    error,
    setOriginalText,
    translate,
    clearError,
    reset,
  } = useTranslationStore();

  // Initialize with initialText if provided
  useEffect(() => {
    if (initialText) {
      setOriginalText(initialText);
    }
  }, [initialText, setOriginalText]);

  // Initialize services on mount
  useEffect(() => {
    const { initializeServices } = useTranslationStore.getState();
    initializeServices();
  }, []);

  const handleTranslate = async () => {
    await translate();
  };

  const handleAddToAnki = () => {
    if (!translationResult) {
      useTranslationStore.getState().clearError();
      useTranslationStore.setState({ error: 'No translation to add to Anki' });
      return;
    }
    // TODO: Implement Anki integration in Task 5
    console.log('Adding to Anki:', { originalText, translationResult });
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
  }, [setOriginalText]);

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-md">
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
          value={translationResult?.translation || ''}
          readOnly
          placeholder="Translation will appear here"
        />
      </div>

      {/* Grammar Notes */}
      {translationResult?.grammarNotes && translationResult.grammarNotes.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Grammar Notes</h3>
          <ul className="list-disc pl-5 space-y-1">
            {translationResult.grammarNotes.map((note, index) => (
              <li key={index} className="text-gray-600">{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Word Analyses */}
      {translationResult?.wordAnalyses && translationResult.wordAnalyses.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Word Analysis</h3>
          <div className="space-y-3">
            {translationResult.wordAnalyses.map((analysis, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-800">{analysis.word}</h4>
                  {analysis.partOfSpeech && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {analysis.partOfSpeech}
                    </span>
                  )}
                </div>
                {analysis.pronunciation && (
                  <p className="text-sm text-gray-600 mb-1">
                    Pronunciation: {analysis.pronunciation}
                  </p>
                )}
                <p className="text-gray-700 mb-2">{analysis.definition}</p>
                {analysis.example && (
                  <p className="text-sm text-gray-600 italic mb-2">Example: {analysis.example}</p>
                )}
                {analysis.synonyms && analysis.synonyms.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Synonyms: </span>
                    <span className="text-sm text-gray-600">
                      {analysis.synonyms.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Info */}
      {translationResult && (
        <div className="mb-4 text-sm text-gray-500">
          <p>
            Translated from {translationResult.sourceLanguage} to {translationResult.targetLanguage}
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900 font-medium"
            >
              Dismiss
            </button>
          </div>
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
          disabled={!translationResult || isLoading}
          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add to Anki
        </button>
        <button
          onClick={reset}
          disabled={isLoading}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        <p>Tip: Use Ctrl+Shift+T (Cmd+Shift+T on Mac) to quickly paste text from clipboard</p>
        <p className="mt-1">
          Note: AI translation requires API key configuration in settings (coming soon)
        </p>
      </div>
    </div>
  );
};

export default TranslationPanel;