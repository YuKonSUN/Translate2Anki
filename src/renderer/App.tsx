import React, { useEffect, useState } from 'react';
import TranslationPanel from './components/TranslationPanel';

const App: React.FC = () => {
  const [clipboardText, setClipboardText] = useState<string>('');

  // Fetch initial clipboard text on mount
  useEffect(() => {
    const fetchClipboardText = async () => {
      try {
        if (window.electronAPI) {
          const text = await window.electronAPI.getClipboardText();
          setClipboardText(text);
        }
      } catch (error) {
        console.error('Failed to fetch clipboard text:', error);
      }
    };

    fetchClipboardText();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-900">Translate2Anki</h1>
          <p className="text-gray-600">Translate text and create Anki flashcards instantly</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <TranslationPanel initialText={clipboardText} />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">📋 Clipboard Integration</h3>
            <p className="text-gray-600">Use Ctrl+Shift+T to quickly paste text from clipboard for translation.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">🌍 Translation</h3>
            <p className="text-gray-600">Get instant translations with simulated API (real API in Task 4).</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-2">📚 Anki Integration</h3>
            <p className="text-gray-600">Create flashcards directly from translations (Task 5).</p>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">
            Translate2Anki • Task 3: React UI Framework • Built with Electron, React, TypeScript, and Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;