import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

type Config = {
  updateCheck: boolean;
  teams?: Record<string, string[]>;
};

function computeConfigPath(appName: string): string {
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA ?? path.join(os.homedir(), 'AppData', 'Roaming');
    return path.join(appData, appName, 'config.json');
  }
  return path.join(os.homedir(), '.config', appName, 'config.json');
}

let configPathCache: string | null = null;

function getConfigPath(): string {
  if (configPathCache) return configPathCache;

  const newPath = computeConfigPath('starmie-cli');
  const oldPath = computeConfigPath('pokescope'); // pre-rename location, kept for migration
  const newDir = path.dirname(newPath);
  const oldDir = path.dirname(oldPath);

  if (fs.existsSync(oldDir) && !fs.existsSync(newDir)) {
    try {
      fs.renameSync(oldDir, newDir);
    } catch (err) {
      console.warn(`Warning: could not migrate config from ${oldDir} to ${newDir}: ${(err as Error).message}. Reading from old location.`);
      configPathCache = oldPath;
      return oldPath;
    }
  }

  configPathCache = newPath;
  return newPath;
}

function readConfig(): Config | null {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8');
    return JSON.parse(raw) as Config;
  } catch {
    return null;
  }
}

function writeConfig(config: Partial<Config>): void {
  const p = getConfigPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2));
}

export function isFirstRun(): boolean {
  return readConfig() === null;
}

export function getUpdateCheckSetting(): boolean {
  return readConfig()?.updateCheck ?? false;
}

export function setUpdateCheck(enabled: boolean): void {
  const existing = readConfig() ?? ({} as Partial<Config>);
  writeConfig({ ...existing, updateCheck: enabled });
}

export async function checkForUpdates(currentVersion: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.github.com/repos/luvcie/starmie-cli/releases/latest', {
      headers: { 'User-Agent': 'starmie-cli' },
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

export function listTeams(): Record<string, string[]> {
  return readConfig()?.teams ?? {};
}

export function getTeam(name: string): string[] | null {
  const teams = listTeams();
  const key = Object.keys(teams).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? teams[key] : null;
}

export function saveTeam(name: string, pokemon: string[]): void {
  const existing = readConfig() ?? ({} as Partial<Config>);
  const teams = { ...(existing.teams ?? {}) };
  const existingKey = Object.keys(teams).find(k => k.toLowerCase() === name.toLowerCase());
  if (existingKey) delete teams[existingKey];
  teams[name] = pokemon;
  writeConfig({ ...existing, teams });
}

export function deleteTeam(name: string): boolean {
  const existing = readConfig() ?? ({} as Partial<Config>);
  const teams = { ...(existing.teams ?? {}) };
  const key = Object.keys(teams).find(k => k.toLowerCase() === name.toLowerCase());
  if (!key) return false;
  delete teams[key];
  writeConfig({ ...existing, teams });
  return true;
}

export function expandTeamRefs(targets: string[]): { ok: true; targets: string[] } | { ok: false; missing: string } {
  const result: string[] = [];
  for (const t of targets) {
    if (t.startsWith('@')) {
      const name = t.slice(1);
      const team = getTeam(name);
      if (!team) return { ok: false, missing: name };
      result.push(...team);
    } else {
      const team = getTeam(t);
      if (team) result.push(...team);
      else result.push(t);
    }
  }
  return { ok: true, targets: result };
}
