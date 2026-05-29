import { Dex } from '@pkmn/sim';
import { bold, dim, cyan } from '../ansi';
import { parseGenPrefix, GEN_PATTERN, GEN_ALIASES } from '../gen';
import { RANDBATS_DATA } from '../data/randbats-data';

type Role = {
  abilities?: string[];
  items?: string[];
  teraTypes?: string[];
  moves: string[];
};
type Entry = {
  level: number;
  abilities?: string[];
  items?: string[];
  moves?: string[];
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  roles?: Record<string, Role>;
};
type RandbatsFile = Record<string, Entry>;

const STAT_DISPLAY: Record<string, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
};

function fmtStats(stats: Record<string, number>): string {
  return Object.entries(stats)
    .map(([k, v]) => `${v} ${STAT_DISPLAY[k] ?? k}`)
    .join(' / ');
}

export function cmdRandbats(args: string[]): void {
  if (!args.length) {
    console.log('Usage: randbats [gen] <pokemon>');
    return;
  }

  const raw = args.join(' ');
  let { genMod, rest } = parseGenPrefix(raw);
  if (!genMod) {
    const firstWord = raw.split(/\s+/)[0];
    if (/^gen\d+$/i.test(firstWord)) {
      console.error(`'${firstWord}' is not a valid generation. Use gen1-gen9.`);
      return;
    }
    // Gen token might appear anywhere, e.g. "dragapult bw"
    const tokens = rest.trim().split(/\s+/);
    const genIdx = tokens.findIndex(t => GEN_PATTERN.test(t.toLowerCase()));
    if (genIdx !== -1) {
      const rawGen = tokens[genIdx].toLowerCase();
      genMod = GEN_ALIASES[rawGen] ?? rawGen;
      rest = [...tokens.slice(0, genIdx), ...tokens.slice(genIdx + 1)].join(' ');
    }
  }
  const genNum = genMod ? parseInt(genMod.replace('gen', ''), 10) : 9;

  const pokemonArg = rest.trim();
  if (!pokemonArg) {
    console.log('Usage: randbats [gen] <pokemon>');
    return;
  }

  const file = RANDBATS_DATA[genNum] as RandbatsFile | undefined;
  if (!file) {
    console.error(`No random battle data for gen ${genNum}.`);
    return;
  }

  const key = Object.keys(file).find(k => k.toLowerCase() === pokemonArg.toLowerCase());
  if (!key) {
    const species = Dex.species.get(pokemonArg);
    if (species.exists) {
      const gensWith = Object.entries(RANDBATS_DATA)
        .filter(([, data]) => Object.keys(data as RandbatsFile).some(k => k.toLowerCase() === species.name.toLowerCase()))
        .map(([g]) => Number(g))
        .sort((a, b) => a - b);
      if (gensWith.length) {
        const suggestions = gensWith.map(g => `randbats gen${g} ${species.name}`).join(', ');
        console.error(`${species.name} isn't in Gen ${genNum} random battles. Try: ${suggestions}`);
      } else {
        console.error(`${species.name} isn't in any random battle format.`);
      }
    } else {
      console.error(`'${pokemonArg}' not found.`);
    }
    return;
  }

  const entry = file[key];
  console.log(`\n${bold(key)} ${dim(`[Gen ${genNum} Random Battle]`)}`);
  console.log(`${dim('Level:')} ${entry.level}\n`);

  if (entry.roles && Object.keys(entry.roles).length) {
    const roleNames = Object.keys(entry.roles);
    for (const roleName of roleNames) {
      const role = entry.roles[roleName];
      console.log(`  ${cyan(roleName)}`);
      if (role.teraTypes?.length) console.log(`  Tera:    ${role.teraTypes.join(' / ')}`);
      if (role.abilities?.length) console.log(`  Ability: ${role.abilities.join(' / ')}`);
      if (role.items?.length)     console.log(`  Item:    ${role.items.join(' / ')}`);
      console.log(`  Moves:   ${role.moves.join(', ')}`);
      console.log();
    }
  } else {
    if (entry.abilities?.length) console.log(`  Ability: ${entry.abilities.join(' / ')}`);
    if (entry.items?.length)     console.log(`  Item:    ${entry.items.join(' / ')}`);
    if (entry.moves?.length)     console.log(`  Moves:   ${entry.moves.join(', ')}`);
    if (entry.evs)               console.log(`  EVs:     ${fmtStats(entry.evs)}`);
    if (entry.ivs)               console.log(`  IVs:     ${fmtStats(entry.ivs)}`);
    console.log();
  }
}
