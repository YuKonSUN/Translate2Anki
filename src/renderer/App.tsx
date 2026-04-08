import React from 'react';
import TranslationPanel from './components/TranslationPanel';

const App: React.FC = () => {
  return (
    <div className="bg-transparent min-h-screen flex items-center justify-center p-4">
      <TranslationPanel />
    </div>
  );
};

export default App;
