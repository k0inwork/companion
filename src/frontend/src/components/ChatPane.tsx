import React from 'react';
import { Message } from '../types';

interface Props {
  messages: Message[];
  onCaptureWord: (word: string) => void;
}

/**
 * Split content into tokens (words + whitespace/punctuation).
 * Each word becomes a clickable span.
 */
function tokenize(text: string): { type: 'word' | 'gap'; value: string }[] {
  const tokens: { type: 'word' | 'gap'; value: string }[] = [];
  const regex = /([\p{L}\p{N}'-]+)|([\s\p{P}]+)/gu;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      tokens.push({ type: 'word', value: match[1] });
    } else {
      tokens.push({ type: 'gap', value: match[2] });
    }
  }
  return tokens;
}

export default function ChatPane({ messages, onCaptureWord }: Props) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleWordClick = (e: React.MouseEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const target = e.target as HTMLElement;
    if (target.dataset.word) {
      e.preventDefault();
      onCaptureWord(target.dataset.word);
      // Brief highlight
      target.classList.add('word-flash');
      setTimeout(() => target.classList.remove('word-flash'), 600);
    }
  };

  return (
    <div className="chat-pane">
      <div className="chat-stream" onClick={handleWordClick}>
        {messages.map((msg) => {
          const tokens = tokenize(msg.content);
          return (
            <div key={msg.id} className={`chat-msg chat-msg--${msg.role}`}>
              <span className="chat-msg-prefix">
                {msg.role === 'user' ? '>' : '<'}
              </span>
              <span className="chat-msg-content">
                {tokens.map((t, i) =>
                  t.type === 'word' ? (
                    <span key={i} data-word={t.value} className="clickable-word">
                      {t.value}
                    </span>
                  ) : (
                    <span key={i}>{t.value}</span>
                  )
                )}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
