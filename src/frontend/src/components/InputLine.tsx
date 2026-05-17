import React from 'react';

interface Props {
  onSend: (text: string) => void;
  onCapture: (word: string) => void;
}

/**
 * Get the currently selected word from anywhere on the page.
 * Checks window selection first (chat pane, media, anything),
 * then falls back to the word at cursor position in the input.
 */
function getCapturedWord(input: HTMLInputElement | null): string | null {
  // 1. Check if user selected text anywhere on the page (chat, media, etc.)
  const selection = window.getSelection();
  if (selection && selection.toString().trim()) {
    const selected = selection.toString().trim();
    // If they selected a single word, use it directly
    if (/^\S+$/.test(selected)) return selected;
    // If they selected multiple words, take the word closest to the selection anchor
    const anchorText = selection.anchorNode?.textContent || '';
    const anchorOffset = selection.anchorOffset;
    // Extract word at anchor position
    const left = anchorText.slice(0, anchorOffset);
    const right = anchorText.slice(anchorOffset);
    const leftMatch = left.match(/[\p{L}\p{N}]+$/u);
    const rightMatch = right.match(/^[\p{L}\p{N}]+/u);
    if (leftMatch || rightMatch) {
      return (leftMatch?.[0] || '') + (rightMatch?.[0] || '');
    }
    // Fallback: first word of selection
    const firstWord = selected.match(/[\p{L}\p{N}]+/u)?.[0];
    return firstWord || null;
  }

  // 2. Fall back to word at cursor in input
  if (!input) return null;
  const text = input.value;
  const cursorPos = input.selectionStart ?? text.length;

  const left = text.slice(0, cursorPos).search(/[\p{L}\p{N}]+$/u);
  const rightMatch = text.slice(cursorPos).match(/^[\p{L}\p{N}]+/u);
  if (left !== -1 && rightMatch) {
    return text.slice(left, cursorPos + rightMatch[0].length);
  }
  return null;
}

export default function InputLine({ onSend, onCapture }: Props) {
  const [value, setValue] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onSend(trimmed);
        setValue('');
      }
    }

    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      const word = getCapturedWord(inputRef.current);
      if (word) {
        onCapture(word);
        // Clear selection after capture
        window.getSelection()?.removeAllRanges();
      }
    }
  };

  return (
    <div className="input-line">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="type here... (ctrl+click words to capture)"
        autoFocus
        spellCheck={false}
      />
    </div>
  );
}
