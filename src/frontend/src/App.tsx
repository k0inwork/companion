import React from 'react';
import ChatPane from './components/ChatPane';
import RadarPanel from './components/RadarPanel';
import InputLine from './components/InputLine';
import { Message, RadarWord } from './types';
import './App.css';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [radarWords, setRadarWords] = React.useState<RadarWord[]>([]);
  const [sessionId, setSessionId] = React.useState<string>('');

  // Initialize session
  React.useEffect(() => {
    fetch(`${API}/session`, { method: 'POST' })
      .then((r) => r.json())
      .then((data) => setSessionId(data.id))
      .catch(() => {
        // Dev fallback: use local session
        setSessionId('local-dev');
      });
  }, []);

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      // Dev fallback: echo
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `[dev] session not connected. you said: "${text}"`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
  };

  /**
   * Extract the full sentence containing the given word from a text.
   * Splits on sentence boundaries (. ! ? …) and returns the matching sentence.
   */
  function extractSentence(text: string, word: string): string {
    const lower = text.toLowerCase();
    const wordLower = word.toLowerCase();

    // Find the position of the word in the text
    const idx = lower.indexOf(wordLower);
    if (idx === -1) return text;

    // Walk backwards to find sentence start
    let start = 0;
    for (let i = idx; i >= 0; i--) {
      if ('.!?…\n'.includes(text[i]) && i < idx - 1) {
        start = i + 1;
        break;
      }
    }

    // Walk forward to find sentence end
    let end = text.length;
    for (let i = idx + word.length; i < text.length; i++) {
      if ('.!?…\n'.includes(text[i])) {
        end = i + 1;
        break;
      }
    }

    return text.slice(start, end).trim();
  }

  const handleCapture = async (word: string) => {
    // Find the full sentence containing the word from the most recent message
    let fullSentence = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.content.toLowerCase().includes(word.toLowerCase())) {
        fullSentence = extractSentence(msg.content, word);
        break;
      }
    }

    // Optimistic update — panel shows word only, context stored separately
    setRadarWords((prev) => {
      const existing = prev.find((w) => w.word === word);
      if (existing) {
        return [
          { ...existing, frequency: existing.frequency + 1, status: 'repeated' as const, context: fullSentence },
          ...prev.filter((w) => w.word !== word),
        ];
      }
      return [{ word, frequency: 1, context: fullSentence, status: 'new' as const }, ...prev];
    });

    // Send full sentence to backend
    fetch(`${API}/radar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        word,
        context: fullSentence,
      }),
    }).catch(() => {});
  };

  return (
    <div className="app">
      <div className="main-area">
        <ChatPane messages={messages} onCaptureWord={handleCapture} />
        <RadarPanel words={radarWords} />
      </div>
      <InputLine onSend={handleSend} onCapture={handleCapture} />
    </div>
  );
}

export default App;
