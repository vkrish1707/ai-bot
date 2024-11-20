import { useState, FormEvent, ChangeEvent } from 'react';
import './ScrapeForm.scss';
import { processHtmlContent } from '../utils/processHtmlContent';

interface ScrapeFormProps {
  onScrapedContent: (content: string) => void;
}

export function ScrapeForm({ onScrapedContent }: ScrapeFormProps) {
  const [text, setText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const textContent = processHtmlContent(text);
      console.log('🚀 ~ handleSubmit ~ textContent:', textContent);
      onScrapedContent(textContent);
    } catch (error) {
      console.error('Error while processing text:', error);
      setError('An error occurred during text processing');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Paste text to process"
          required
          className="text-input"
        />
        <button type="submit" disabled={isLoading} className="submit-button">
          {isLoading ? 'Processing...' : 'Process'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {!error && (
        <p className="instruction">
          Paste text and click 'Process' to get started.
        </p>
      )}
    </div>
  );
}