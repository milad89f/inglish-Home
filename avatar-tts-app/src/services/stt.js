import { DEEPGRAM_API_KEY } from '../config/apiKeys';

const DG_LISTEN_URL = 'https://api.deepgram.com/v1/listen?model=nova-2-general&smart_format=true&words=true';

// language: 'en' or 'tr' hint; Deepgram can auto-detect, but we pass hints via 'language' param optionally
export async function transcribeWithDeepgram(fileUri, languageHint = 'en', options = {}) {
  const { maxRetries = 3, retryDelay = 1000, onRetry } = options;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Fetch file and send as binary to Deepgram
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const url = `${DG_LISTEN_URL}${languageHint ? `&language=${encodeURIComponent(languageHint)}` : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': blob.type || 'audio/m4a',
        },
        body: blob,
      });

      if (!res.ok) {
        const text = await res.text();
        const error = new Error(`Deepgram error: ${res.status} ${text}`);
        
        // Retry on server errors (5xx) or rate limits (429)
        if ((res.status >= 500 || res.status === 429) && attempt < maxRetries) {
          lastError = error;
          const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
          if (onRetry) onRetry(attempt + 1, maxRetries, delay);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw error;
      }

      const data = await res.json();
      const alternative = data?.results?.channels?.[0]?.alternatives?.[0];
      const transcript = alternative?.transcript || '';
      const words = alternative?.words || [];
      
      return {
        text: transcript,
        words: words.map(w => ({
          word: w.word || '',
          confidence: w.confidence || 0,
          start: w.start || 0,
          end: w.end || 0,
        })),
      };
    } catch (error) {
      lastError = error;
      
      // Retry on network errors
      if (attempt < maxRetries && (
        error.message.includes('Network') ||
        error.message.includes('fetch') ||
        error.message.includes('timeout')
      )) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        if (onRetry) onRetry(attempt + 1, maxRetries, delay);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last attempt or a non-retryable error, throw
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError || new Error('Transcription failed after all retries');
}








