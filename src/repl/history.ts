import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

const MAX_HISTORY = 1000;

function getHistoryPath(): string {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'starmie-cli', 'history');
  }
  return path.join(os.homedir(), '.config', 'starmie-cli', 'history');
}

export function loadHistory(): string[] {
  try {
    const raw = fs.readFileSync(getHistoryPath(), 'utf8');
    const lines = raw.split('\n').map(l => l.replace(/\r$/, '')).filter(Boolean);
    if (lines.length > MAX_HISTORY) {
      const trimmed = lines.slice(-MAX_HISTORY);
      fs.writeFileSync(getHistoryPath(), trimmed.join('\n') + '\n');
      return trimmed;
    }
    return lines;
  } catch {
    return [];
  }
}

export function appendHistory(line: string, existing: string[]): void {
  if (!line) return;
  if (existing.length && existing[existing.length - 1] === line) return;
  const p = getHistoryPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.appendFileSync(p, line + '\n');
}
