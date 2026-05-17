import React from 'react';
import { RadarWord } from '../types';

const API = process.env.REACT_APP_API_URL || '';

const DEFAULT_STEPS: Record<string, string> = {
  step1: "Chat with the AI — it will mix in words from the language you're learning",
  step2: "Ctrl+Click any word that catches your eye to capture it",
  step3: "Captured words appear here with the sentence where you found them",
  step4: "When you've captured enough, hit Endgame in the top bar",
  step5: "The AI will quiz you on your words — a friendly recall game, not a test",
  step6: "Review your results and start a new session to keep learning",
};

const translationCache: Record<string, Record<string, string>> = {};

interface Props {
  words: RadarWord[];
  l1: string;
}

export default function RadarPanel({ words, l1 }: Props) {
  const hasWords = words.length > 0;
  const [steps, setSteps] = React.useState<Record<string, string>>(
    translationCache[l1] || DEFAULT_STEPS
  );

  React.useEffect(() => {
    if (l1 === 'en') {
      setSteps(DEFAULT_STEPS);
      return;
    }
    if (translationCache[l1]) {
      setSteps(translationCache[l1]);
      return;
    }
    fetch(`${API}/guide?l1=${l1}`)
      .then(r => r.json())
      .then(data => {
        if (data.steps) {
          translationCache[l2] = data.steps;
          setSteps(data.steps);
        }
      })
      .catch(() => {});
  }, [l1]);

  return (
    <div className="radar-panel">
      <div className="radar-header">radar</div>
      {!hasWords && (
        <div className="radar-guide">
          <div className="guide-title">How it works</div>
          <ol className="guide-steps">
            {['step1','step2','step3','step4','step5','step6'].map(key => (
              <li key={key}>
                {steps[key] || DEFAULT_STEPS[key]}
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
