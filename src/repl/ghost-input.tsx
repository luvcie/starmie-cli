import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { complete } from './completion';

type Props = {
  history: string[];
  prompt: string;
  onSubmit: (line: string) => void;
};

export function GhostInput({ history, prompt, onSubmit }: Props): React.ReactElement {
  const [input, setInput] = useState('');
  const [cursor, setCursor] = useState(0);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [tabCycle, setTabCycle] = useState<{ matches: string[]; index: number; replaceFrom: number; prefix: string } | null>(null);
  const { exit } = useApp();

  const ghost = computeGhost(input, history);

  useInput((char, key) => {
    if (key.ctrl && char === 'c') {
      exit();
      return;
    }
    if (key.ctrl && char === 'd' && input === '') {
      exit();
      return;
    }
    if (key.return) {
      onSubmit(input);
      setInput('');
      setCursor(0);
      setHistoryIndex(null);
      setTabCycle(null);
      return;
    }
    if (key.tab) {
      if (tabCycle) {
        const newIndex = (tabCycle.index + 1) % tabCycle.matches.length;
        const match = tabCycle.matches[newIndex];
        const newInput = tabCycle.prefix + match;
        setInput(newInput);
        setCursor(newInput.length);
        setTabCycle({ ...tabCycle, index: newIndex });
      } else {
        const { matches, replaceFrom } = complete(input, cursor);
        if (matches.length >= 1) {
          const prefix = input.slice(0, replaceFrom);
          const newInput = prefix + matches[0] + input.slice(cursor);
          setInput(newInput);
          setCursor(replaceFrom + matches[0].length);
          if (matches.length > 1) {
            setTabCycle({ matches, index: 0, replaceFrom, prefix });
          }
        }
      }
      return;
    }
    setTabCycle(null);
    if (key.upArrow) {
      if (!history.length) return;
      const newIdx = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
      const entry = history[newIdx];
      setHistoryIndex(newIdx);
      setInput(entry);
      setCursor(entry.length);
      return;
    }
    if (key.downArrow) {
      if (historyIndex === null) return;
      const newIdx = historyIndex + 1;
      if (newIdx >= history.length) {
        setHistoryIndex(null);
        setInput('');
        setCursor(0);
      } else {
        const entry = history[newIdx];
        setHistoryIndex(newIdx);
        setInput(entry);
        setCursor(entry.length);
      }
      return;
    }
    if (key.leftArrow) {
      setCursor(c => Math.max(0, c - 1));
      return;
    }
    if (key.rightArrow) {
      if (cursor === input.length && ghost) {
        const full = input + ghost;
        setInput(full);
        setCursor(full.length);
        setHistoryIndex(null);
      } else {
        setCursor(c => Math.min(input.length, c + 1));
      }
      return;
    }
    if (key.backspace || key.delete) {
      if (cursor === 0) return;
      setInput(input.slice(0, cursor - 1) + input.slice(cursor));
      setCursor(cursor - 1);
      setHistoryIndex(null);
      return;
    }
    if (key.ctrl && char === 'a') { setCursor(0); return; }
    if (key.ctrl && char === 'e') { setCursor(input.length); return; }
    if (key.ctrl && char === 'u') { setInput(''); setCursor(0); setHistoryIndex(null); return; }
    if (key.ctrl && char === 'w') {
      if (cursor === 0) return;
      const before = input.slice(0, cursor);
      const after = input.slice(cursor);
      const trimmed = before.replace(/\S+\s*$/, '');
      setInput(trimmed + after);
      setCursor(trimmed.length);
      setHistoryIndex(null);
      return;
    }
    if (char && !key.ctrl && !key.meta) {
      setInput(input.slice(0, cursor) + char + input.slice(cursor));
      setCursor(cursor + char.length);
      setHistoryIndex(null);
    }
  });

  const beforeCursor = input.slice(0, cursor);
  const atCursor = input[cursor] ?? ' ';
  const afterCursor = cursor < input.length ? input.slice(cursor + 1) : '';
  const atEndWithGhost = cursor === input.length && ghost !== null && ghost.length > 0;

  return (
    <Box flexDirection="column">
      {tabCycle ? (
        <Box>
          <Text dimColor>
            {tabCycle.matches.map((m, i) =>
              i === tabCycle.index ? `[${m}]` : m
            ).join('  ')}
          </Text>
        </Box>
      ) : null}
      <Text>
        {prompt}{beforeCursor}
        {atEndWithGhost ? (
          <>
            <Text inverse>{ghost![0]}</Text>
            <Text dimColor>{ghost!.slice(1)}</Text>
          </>
        ) : (
          <>
            <Text inverse>{atCursor}</Text>
            {afterCursor}
          </>
        )}
      </Text>
    </Box>
  );
}

function computeGhost(input: string, history: string[]): string | null {
  if (!input) return null;
  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.length > input.length && entry.startsWith(input)) {
      return entry.slice(input.length);
    }
  }
  return null;
}
