import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddToAnkiButton } from '@/renderer/components/AddToAnkiButton';

const mockTranslation = {
  original: 'Hello world',
  translation: '你好，世界',
  isSentence: true,
  grammar: 'Simple sentence',
  words: [
    { word: 'Hello', meaning: '你好', partOfSpeech: 'interjection' },
    { word: 'world', meaning: '世界', partOfSpeech: 'noun' },
  ],
};

describe('AddToAnkiButton', () => {
  it('renders button with no selection', () => {
    render(
      <AddToAnkiButton
        translation={mockTranslation}
        ankiService={null}
        selectedWords={[]}
      />
    );
    expect(screen.getByText(/添加到 Anki/)).toBeInTheDocument();
  });

  it('shows selected count when words are selected', () => {
    render(
      <AddToAnkiButton
        translation={mockTranslation}
        ankiService={null}
        selectedWords={['Hello']}
      />
    );
    expect(screen.getByText(/已选择/)).toBeInTheDocument();
  });

  it('shows grammar option for sentences', () => {
    render(
      <AddToAnkiButton
        translation={mockTranslation}
        ankiService={null}
        selectedWords={[]}
      />
    );
    expect(screen.getByText(/添加语法结构卡片/)).toBeInTheDocument();
  });

  it('shows deck name info', () => {
    render(
      <AddToAnkiButton
        translation={mockTranslation}
        ankiService={null}
        selectedWords={[]}
      />
    );
    expect(screen.getByText(/Translate2Anki/)).toBeInTheDocument();
  });
});
