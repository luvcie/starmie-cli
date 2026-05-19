import { Dex } from '@pkmn/sim';
import { bold, dim, green, red } from '../ansi';
import { splitGen } from '../gen';

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
const STAT_LABELS: Record<string, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
};

function extractEviolite(s: string): { name: string; evi: boolean } {
  const words = s.trim().split(/\s+/);
  const idx = words.findIndex(w => w.toLowerCase() === 'eviolite');
  if (idx === -1) return { name: s.trim(), evi: false };
  return { name: [...words.slice(0, idx), ...words.slice(idx + 1)].join(' ').trim(), evi: true };
}

function applyEviolite(stats: Record<string, number>) {
  return { ...stats, def: Math.floor(stats.def * 1.5), spd: Math.floor(stats.spd * 1.5) };
}

export function cmdCompare(args: string[]): void {
  if (!args.length) {
    console.log('Usage: compare [gen] <pokemon1>, <pokemon2>');
    return;
  }

  const { dex, targets } = splitGen(args);

  if (targets.length > 2) {
    console.error('compare only supports 2 pokemon at a time.');
    return;
  }

  let resolvedTargets = targets;
  let eviA = false;
  let eviB = false;

  if (targets.length === 2) {
    const pA = extractEviolite(targets[0]);
    const pB = extractEviolite(targets[1]);
    resolvedTargets = [pA.name, pB.name];
    eviA = pA.evi;
    eviB = pB.evi;
  } else if (targets.length === 1) {
    const words = targets[0].split(/\s+/);
    const eviIdx = words.findIndex(w => w.toLowerCase() === 'eviolite');
    const stripped = eviIdx !== -1 ? [...words.slice(0, eviIdx), ...words.slice(eviIdx + 1)] : words;

    if (!dex.species.get(stripped.join(' ')).exists) {
      for (let split = 1; split < stripped.length; split++) {
        const left = stripped.slice(0, split).join(' ');
        const right = stripped.slice(split).join(' ');
        if (dex.species.get(left).exists && dex.species.get(right).exists) {
          resolvedTargets = [left, right];
          if (eviIdx !== -1) {
            eviA = eviIdx <= split;
            eviB = eviIdx > split;
          }
          break;
        }
      }
    }
  }

  if (resolvedTargets.length < 2) {
    console.log('Usage: compare [gen] <pokemon1>, <pokemon2>');
    return;
  }

  const [a, b] = [dex.species.get(resolvedTargets[0]), dex.species.get(resolvedTargets[1])];
  if (!a.exists) { console.error(`'${resolvedTargets[0]}' not found.`); return; }
  if (!b.exists) { console.error(`'${resolvedTargets[1]}' not found.`); return; }

  if (eviA && !a.evos?.length) {
    console.log(dim(`(${a.name} is fully evolved, eviolite has no effect)`));
    eviA = false;
  }
  if (eviB && !b.evos?.length) {
    console.log(dim(`(${b.name} is fully evolved, eviolite has no effect)`));
    eviB = false;
  }

  const statsA = eviA ? applyEviolite(a.baseStats) : a.baseStats;
  const statsB = eviB ? applyEviolite(b.baseStats) : b.baseStats;

  const genLabel = dex !== Dex ? dim(` [${dex.currentMod}]`) : '';
  const displayA = a.name + (eviA ? '+Evi' : '');
  const displayB = b.name + (eviB ? '+Evi' : '');
  const colW = Math.max(displayA.length, displayB.length, 6) + 2;
  const labelW = 4;

  console.log(`\n${bold(a.name)}${eviA ? dim(' +Eviolite') : ''} vs ${bold(b.name)}${eviB ? dim(' +Eviolite') : ''}${genLabel}\n`);
  console.log(' '.repeat(labelW + 2) + displayA.padStart(colW) + displayB.padStart(colW));

  const bstA = STATS.reduce((s, k) => s + statsA[k], 0);
  const bstB = STATS.reduce((s, k) => s + statsB[k], 0);

  for (const stat of STATS) {
    const vA = statsA[stat];
    const vB = statsB[stat];
    const label = STAT_LABELS[stat].padEnd(labelW);
    const fmtA = vA > vB ? green(String(vA).padStart(colW)) : vA < vB ? red(String(vA).padStart(colW)) : String(vA).padStart(colW);
    const fmtB = vB > vA ? green(String(vB).padStart(colW)) : vB < vA ? red(String(vB).padStart(colW)) : String(vB).padStart(colW);
    console.log(`  ${label}${fmtA}${fmtB}`);
  }

  const fmtBstA = bstA > bstB ? green(String(bstA).padStart(colW)) : bstA < bstB ? red(String(bstA).padStart(colW)) : String(bstA).padStart(colW);
  const fmtBstB = bstB > bstA ? green(String(bstB).padStart(colW)) : bstB < bstA ? red(String(bstB).padStart(colW)) : String(bstB).padStart(colW);
  console.log(`  ${'BST'.padEnd(labelW)}${fmtBstA}${fmtBstB}`);
  console.log();
}
