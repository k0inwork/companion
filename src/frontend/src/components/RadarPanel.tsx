import React from 'react';
import { RadarWord } from '../types';

interface Props {
  words: RadarWord[];
}

export default function RadarPanel({ words }: Props) {
  const hasWords = words.length > 0;

  return (
    <div className="radar-panel">
      <div className="radar-header">radar</div>
      {!hasWords && (
        <div className="radar-guide">
          <div className="guide-title">How it works</div>
          <ol className="guide-steps">
            <li>Chat with the AI — it will mix in words from the language you're learning</li>
            <li><strong>Ctrl+Click</strong> any word that catches your eye to capture it</li>
            <li>Captured words appear here with the sentence where you found them</li>
            <li>When you've captured enough, hit <strong>Endgame</strong> in the top bar</li>
            <li>The AI will quiz you on your words — a friendly recall game, not a test</li>
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
