import React from 'react';
import ChatPane from './components/ChatPane';
import RadarPanel from './components/RadarPanel';
import InputLine from './components/InputLine';
import { Message, RadarWord } from './types';
import './App.css';

const API = process.env.REACT_APP_API_URL || '';

const LANGUAGES: Record<string, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  pt: 'Portuguese',
  lv: 'Latviešu',
  lt: 'Lietuvių',
  ru: 'Русский',
};

function App() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [radarWords, setRadarWords] = React.useState<RadarWord[]>([]);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [l1, setL1] = React.useState('en');
  const [l2, setL2] = React.useState('de');
  const [mode, setMode] = React.useState<'chat' | 'endgame'>('chat');
  const [endgameId, setEndgameId] = React.useState<string | null>(null);
  const [endgameComplete, setEndgameComplete] = React.useState(false);
  const [endgameSummary, setEndgameSummary] = React.useState<any>(null);

  const startSession = React.useCallback((newL1: string, newL2: string) => {
    setMessages([]);
    setRadarWords([]);
    setSessionId(null);
    fetch(`${API}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ l1: newL1, l2: newL2 }),
    })
      .then((r) => r.json())
      .then((data) => setSessionId(data.id))
      .catch(() => setSessionId('local-dev'));
  }, []);

  // Initialize session on mount
  React.useEffect(() => {
    startSession(l1, l2);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLangChange = (newL1: string, newL2: string) => {
    setL1(newL1);
    setL2(newL2);
    startSession(newL1, newL2);
  };

  const handleSend = async (text: string) => {
    if (!sessionId) return; // wait for session

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const endpoint = mode === 'endgame' ? `${API}/endgame/chat` : `${API}/chat`;
    const body =
      mode === 'endgame'
        ? { endgame_id: endgameId, message: text }
        : { session_id: sessionId, message: text };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'request failed');
      }
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (mode === 'endgame' && data.complete) {
        setEndgameComplete(true);
        setEndgameSummary(data.summary);
      }
    } catch {
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `[dev] not connected. you said: "${text}"`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }
  };

  const handleStartEndgame = async () => {
    if (!sessionId || radarWords.length === 0) return;

    setMessages([]);
    setMode('endgame');
    setEndgameComplete(false);
    setEndgameSummary(null);

    try {
      const res = await fetch(`${API}/endgame/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEndgameId(data.endgame_id);
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: Date.now(),
      };
      setMessages([aiMsg]);
    } catch (err: any) {
      setMode('chat');
      alert(err.message || 'Could not start endgame');
    }
  };

  const handleNewSession = () => {
    setMode('chat');
    setEndgameId(null);
    setEndgameComplete(false);
    setEndgameSummary(null);
    startSession(l1, l2);
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
      <div className="config-bar">
        <div className="config-bar-inner">
          <label className="config-field">
            <span className="config-label">I speak</span>
            <select value={l1} onChange={(e) => handleLangChange(e.target.value, l2)} disabled={mode === 'endgame'}>
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
          <span className="config-arrow">&#8594;</span>
          <label className="config-field">
            <span className="config-label">I'm learning</span>
            <select value={l2} onChange={(e) => handleLangChange(l1, e.target.value)} disabled={mode === 'endgame'}>
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </label>
          {mode === 'chat' && radarWords.length > 0 && (
            <button className="btn-endgame" onClick={handleStartEndgame}>
              Endgame ({radarWords.length})
            </button>
          )}
          {mode === 'endgame' && (
            <button className="btn-new-session" onClick={handleNewSession}>
              New Session
            </button>
          )}
          <span className="config-hint">
            {mode === 'chat' ? 'Ctrl+Click words to capture' : 'Endgame — recall your words!'}
          </span>
        </div>
      </div>
      <div className="main-area">
        <ChatPane messages={messages} onCaptureWord={handleCapture} />
        {mode === 'chat' && <RadarPanel words={radarWords} l2={l2} />}
        {mode === 'endgame' && endgameSummary && (
          <div className="endgame-summary">
            <div className="radar-header">Results</div>
            <div className="summary-score">
              {endgameSummary.correct}/{endgameSummary.total} correct
            </div>
            {endgameSummary.words.map((w: any) => (
              <div key={w.word} className={`summary-word ${w.correct ? 'correct' : 'incorrect'}`}>
                {w.word}
              </div>
            ))}
            <button className="btn-new-session" onClick={handleNewSession} style={{ marginTop: 16 }}>
              Start New Session
            </button>
          </div>
        )}
        {mode === 'endgame' && !endgameSummary && (
          <div className="radar-panel">
            <div className="radar-header">Recall Game</div>
            <div className="radar-empty">Chat with the AI — it will quiz you on your captured words.</div>
          </div>
        )}
      </div>
      <InputLine onSend={handleSend} onCapture={handleCapture} />
    </div>
  );
}

export default App;
