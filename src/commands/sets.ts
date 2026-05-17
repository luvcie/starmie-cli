import { bold, dim, cyan } from '../ansi';
import { parseGenPrefix } from '../gen';
import { SETS_DATA } from '../data/sets-data';

type MoveSlot = string | string[];
type SetData = {
  moves?: MoveSlot[];
  item?: string | string[];
  ability?: string;
  nature?: string;
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
  level?: number;
};
type TierSets = Record<string, SetData>;
type PokemonEntry = Record<string, TierSets>;
type SetsFile = Record<string, PokemonEntry>;

const STAT_DISPLAY: Record<string, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
};

const TIER_DISPLAY: Record<string, string> = {
  ou: 'OU', uu: 'UU', nu: 'NU', pu: 'PU', ru: 'RU', zu: 'ZU',
  ag: 'AG', ubers: 'Ubers', lc: 'LC', cap: 'CAP',
  doublesou: 'Doubles OU', monotype: 'Monotype',
  nationaldex: 'National Dex', nationaldexag: 'National Dex AG',
  balancedhackmons: 'Balanced Hackmons',
  dreamworldou: 'Dream World OU',
  '1v1': '1v1',
};

function fmtTier(tier: string): string {
  return TIER_DISPLAY[tier] ?? (tier[0].toUpperCase() + tier.slice(1));
}

function fmtStats(stats: Record<string, number>): string {
  return Object.entries(stats)
    .map(([k, v]) => `${v} ${STAT_DISPLAY[k] ?? k}`)
    .join(' / ');
}

function fmtSlot(slot: MoveSlot): string {
  return Array.isArray(slot) ? slot.join(' / ') : slot;
}

export function cmdSets(args: string[]): void {
  if (!args.length) {
    console.log('Usage: sets [gen] <pokemon> [, tier]');
    return;
  }

  const raw = args.join(' ');
  const { genMod, rest } = parseGenPrefix(raw);
  const genNum = genMod ? parseInt(genMod.replace('gen', ''), 10) : 9;

  if (!rest.trim()) {
    console.log('Usage: sets [gen] <pokemon> [, tier]');
    return;
  }

  const setsFile = SETS_DATA[genNum] as SetsFile | undefined;
  if (!setsFile) {
    console.error(`No sets data for gen ${genNum}.`);
    return;
  }

  const allTiers = new Set<string>();
  for (const entry of Object.values(setsFile)) {
    for (const tier of Object.keys(entry)) allTiers.add(tier.toLowerCase());
  }

  let pokemonArg: string;
  let tierFilter: string | undefined;

  if (rest.includes(',') || rest.includes('/')) {
    const parts = rest.split(/[,/]/).map(s => s.trim()).filter(Boolean);
    pokemonArg = parts[0];
    tierFilter = parts[1]?.toLowerCase();
  } else {
    const tokens = rest.trim().split(/\s+/);
    const last = tokens[tokens.length - 1].toLowerCase();
    const first = tokens[0].toLowerCase();
    if (tokens.length >= 2 && allTiers.has(last)) {
      tierFilter = last;
      pokemonArg = tokens.slice(0, -1).join(' ');
    } else if (tokens.length >= 2 && allTiers.has(first)) {
      tierFilter = first;
      pokemonArg = tokens.slice(1).join(' ');
    } else {
      pokemonArg = tokens.join(' ');
    }
  }

  const key = Object.keys(setsFile).find(k => k.toLowerCase() === pokemonArg.toLowerCase());
  if (!key) {
    console.error(`No sets found for '${pokemonArg}' in Gen ${genNum}.`);
    return;
  }

  const pokemonEntry = setsFile[key];
  const tiers = tierFilter
    ? Object.entries(pokemonEntry).filter(([t]) => t.toLowerCase() === tierFilter)
    : Object.entries(pokemonEntry);

  if (!tiers.length) {
    const available = Object.keys(pokemonEntry).map(fmtTier).join(', ');
    console.error(`No sets for '${key}' in tier '${tierFilter}'. Available: ${available}`);
    return;
  }

  const totalSets = tiers.reduce((n, [, sets]) => n + Object.keys(sets).length, 0);
  const showTier = tiers.length > 1 || (tierFilter === undefined && totalSets > 1);

  const tierLabel = tierFilter ? ` ${fmtTier(tierFilter)}` : '';
  console.log(`\n${bold(key)} ${dim(`[Gen ${genNum}${tierLabel}]`)}\n`);

  for (const [tier, sets] of tiers) {
    for (const [setName, set] of Object.entries(sets)) {
      const header = showTier ? `${cyan(fmtTier(tier))} — ${bold(setName)}` : bold(setName);
      console.log(`  ${header}`);
      if (set.item)    console.log(`  Item:    ${fmtSlot(set.item)}`);
      if (set.ability) console.log(`  Ability: ${set.ability}`);
      if (set.nature)  console.log(`  Nature:  ${set.nature}`);
      if (set.evs)     console.log(`  EVs:     ${fmtStats(set.evs)}`);
      if (set.ivs)     console.log(`  IVs:     ${fmtStats(set.ivs)}`);
      if (set.moves?.length) {
        const [first, ...rest] = set.moves;
        console.log(`  Moves:   ${fmtSlot(first)}`);
        for (const m of rest) console.log(`           ${fmtSlot(m)}`);
      }
      console.log();
    }
  }
}
