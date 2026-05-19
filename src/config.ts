import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

type Config = { updateCheck: boolean };

function getConfigPath(): string {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, 'pokescope', 'config.json');
  }
  return path.join(os.homedir(), '.config', 'pokescope', 'config.json');
}

function readConfig(): Config | null {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8');
    return JSON.parse(raw) as Config;
  } catch {
    return null;
  }
}

export function isFirstRun(): boolean {
  return readConfig() === null;
}

export function getUpdateCheckSetting(): boolean {
  return readConfig()?.updateCheck ?? false;
}

export function setUpdateCheck(enabled: boolean): void {
  const existing = readConfig() ?? ({} as Partial<Config>);
  const p = getConfigPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify({ ...existing, updateCheck: enabled }, null, 2));
}

export async function checkForUpdates(currentVersion: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.github.com/repos/luvcie/pokescope/releases/latest', {
      headers: { 'User-Agent': 'pokescope' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { tag_name?: string };
    const latest = data.tag_name?.replace(/^v/, '');
    if (!latest || latest === currentVersion) return null;
    return latest;
  } catch {
    return null;
  }
}
