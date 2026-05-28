import { Dex } from '@pkmn/sim';

export const COMMANDS = [
  'weakness', 'weak', 'weaknesses', 'resist',
  'eff', 'effectiveness', 'type', 'matchup',
  'data', 'dex', 'dt',
  'coverage', 'cover',
  'learn', 'learnset',
  'dexsearch', 'ds', 'nds',
  'movesearch', 'ms',
  'itemsearch', 'is',
  'statcalc',
  'randompokemon', 'random', 'randpoke', 'rollpokemon', 'rp',
  'randommove', 'randmove', 'rollmove', 'rm',
  'evyield',
  'nature',
  'evspread',
  'ability', 'abilities',
  'teamcheck', 'team',
  'compare',
  'counter',
  'sets', 'smogon',
  'moves',
  'evo', 'evochain', 'chain',
  'randomquote', 'rq',
  'pcbox', 'box',
  'config',
  'help', 'exit', 'quit',
];

let speciesCache: string[] | null = null;
export function getSpecies(): string[] {
  if (!speciesCache) {
    speciesCache = Dex.species.all()
      .filter((s) => s.exists && s.num > 0 && s.isNonstandard !== 'Custom' && s.isNonstandard !== 'LGPE')
      .map((s) => s.name.toLowerCase());
  }
  return speciesCache;
}

export function complete(line: string, cursor: number): { matches: string[]; replaceFrom: number } {
  const upToCursor = line.slice(0, cursor);
  if (!upToCursor.includes(' ')) {
    const slash = upToCursor.startsWith('/');
    const word = slash ? upToCursor.slice(1) : upToCursor;
    const wordLc = word.toLowerCase();
    const hits = COMMANDS
      .filter((c) => c.startsWith(wordLc))
      .map(c => slash ? '/' + c : c);
    return { matches: hits, replaceFrom: 0 };
  }
  const sepIdx = Math.max(
    upToCursor.lastIndexOf(','),
    upToCursor.lastIndexOf('/'),
    upToCursor.lastIndexOf(' '),
  );
  const word = upToCursor.slice(sepIdx + 1).replace(/^\s+/, '').toLowerCase();
  if (!word) return { matches: [], replaceFrom: cursor };
  const replaceFrom = cursor - word.length;
  const hits = getSpecies().filter((s) => s.startsWith(word));
  return { matches: hits, replaceFrom };
}
