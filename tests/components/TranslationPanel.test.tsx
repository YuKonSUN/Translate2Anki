import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TranslationPanel from '../../src/renderer/components/TranslationPanel';

// Mock window.electronAPI
const mockElectronAPI = {
  onClipboardText: jest.fn(),
};

beforeEach(() => {
  (window as any).electronAPI = mockElectronAPI;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('TranslationPanel', () => {
  it('renders with initial text', () => {
    render(<TranslationPanel initialText="Hello world" />);

    expect(screen.getByLabelText(/original text/i)).toHaveValue('Hello world');
    expect(screen.getByLabelText(/translated text/i)).toHaveValue('');
    expect(screen.getByText('Translate')).toBeInTheDocument();
    expect(screen.getByText('Add to Anki')).toBeInTheDocument();
  });

  it('shows error when translating empty text', () => {
    render(<TranslationPanel />);

    fireEvent.click(screen.getByText('Translate'));

    expect(screen.getByText('Please enter text to translate')).toBeInTheDocument();
  });

  it('shows loading spinner during translation', async () => {
    render(<TranslationPanel initialText="Test text" />);

    fireEvent.click(screen.getByText('Translate'));

    expect(screen.getByText('Loading translation...')).toBeInTheDocument();

    // Wait for translation to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading translation...')).not.toBeInTheDocument();
    });
  });

  it('displays translated text after translation', async () => {
    render(<TranslationPanel initialText="Hello" />);

    fireEvent.click(screen.getByText('Translate'));

    await waitFor(() => {
      expect(screen.getByLabelText(/translated text/i)).toHaveValue('Translated: Hello');
    });
  });

  it('disables Add to Anki button when no translation exists', () => {
    render(<TranslationPanel />);

    expect(screen.getByText('Add to Anki')).toBeDisabled();
  });

  it('enables Add to Anki button after translation', async () => {
    render(<TranslationPanel initialText="Test" />);

    fireEvent.click(screen.getByText('Translate'));

    await waitFor(() => {
      expect(screen.getByText('Add to Anki')).not.toBeDisabled();
    });
  });
});