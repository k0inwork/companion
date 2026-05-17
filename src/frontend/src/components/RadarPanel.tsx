import React from 'react';
import { RadarWord } from '../types';

interface Props {
  words: RadarWord[];
}

export default function RadarPanel({ words }: Props) {
  return (
    <div className="radar-panel">
      <div className="radar-header">radar</div>
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
        {words.length === 0 && (
          <div className="radar-empty">ctrl+space to capture</div>
        )}
      </div>
    </div>
  );
}
