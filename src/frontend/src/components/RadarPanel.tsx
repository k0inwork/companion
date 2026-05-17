import React from 'react';
import { RadarWord } from '../types';

const API = process.env.REACT_APP_API_URL || '';

const DEFAULT_STEPS: Record<string, string> = {
  step1: "Chat with the AI — it will mix in words from the language you're learning",
  step2: "Ctrl+Click any word that catches your eye to capture it",
  step3: "Captured words appear here with the sentence where you found them",
  step4: "When you've captured enough, hit Endgame in the top bar",
  step5: "The AI will quiz you on your words — a friendly recall game, not a test",
};

// Simple in-memory cache across renders
const translationCache: Record<string, Record<string, string>> = {};

interface Props {
  words: RadarWord[];
  l2: string;
}

export default function RadarPanel({ words, l2 }: Props) {
  const hasWords = words.length > 0;
  const [steps, setSteps] = React.useState<Record<string, string>>(translationCache[l2] || DEFAULT_STEPS);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (l2 === 'en' || translationCache[l2]) {
      setSteps(translationCache[l2] || DEFAULT_STEPS);
      return;
    }
    setLoading(true);
    fetch(`${API}/guide?l2=${l2}`)
      .then(r => r.json())
      .then(data => {
        if (data.steps) {
          translationCache[l2] = data.steps;
          setSteps(data.steps);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [l2]);

  return (
    <div className="radar-panel">
      <div className="radar-header">radar</div>
      {!hasWords && (
        <div className="radar-guide">
          <div className="guide-title">{l2 === 'en' ? 'How it works' : 'How it works'}</div>
          <ol className="guide-steps">
            {['step1','step2','step3','step4','step5'].map(key => (
              <li key={key}>
                {loading ? '...' : steps[key] || DEFAULT_STEPS[key]}
              </li>
            ))}
          </ol>
        </div>
      )}
      {hasWords && (
        <div className="radar-list">
          {words.map((w) => (
            <div
              key={w.word}
              className={`radar-item radar-item--${w.status}`}
            >
              <span className="radar-word">{w.word}</span>
              <span className="radar-count">({w.frequency})</span>
            </div>
          ))}
          <div className="radar-hint">
            Keep capturing words, then start Endgame when you're ready.
          </div>
        </div>
      )}
    </div>
  );
}
