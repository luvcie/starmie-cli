import { Dex } from '@pkmn/sim';
import { bold, dim, green, red } from '../ansi';
import { splitGen } from '../gen';

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
const STAT_LABELS: Record<string, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
};

type Mods = { evi: boolean; lb: boolean };

function extractMods(s: string): { name: string; mods: Mods } {
  const normalized = s.trim().replace(/\blight[\s-]+ball\b/gi, 'lightball');
  const words = normalized.split(/\s+/);
  let evi = false, lb = false;
  const remaining = words.filter(w => {
    const lc = w.toLowerCase();
    if (lc === 'eviolite') { evi = true; return false; }
    if (lc === 'lightball') { lb = true; return false; }
    return true;
  });
  return { name: remaining.join(' ').trim(), mods: { evi, lb } };
}

function applyBaseMods(stats: Record<string, number>, mods: Mods) {
  const s = { ...stats };
  if (mods.evi) { s.def = Math.floor(s.def * 1.5); s.spd = Math.floor(s.spd * 1.5); }
  if (mods.lb)  { s.atk = s.atk * 2; s.spa = s.spa * 2; }
  return s;
}

// level 100, 31 IVs, 0 EVs, neutral nature
function calcLv100(base: Record<string, number>) {
  return {
    hp:  2 * base.hp  + 31 + 110,
    atk: 2 * base.atk + 31 + 5,
    def: 2 * base.def + 31 + 5,
    spa: 2 * base.spa + 31 + 5,
    spd: 2 * base.spd + 31 + 5,
    spe: 2 * base.spe + 31 + 5,
  };
}

function applyLv100Mods(stats: Record<string, number>, mods: Mods) {
  const s = { ...stats };
  if (mods.evi) { s.def = Math.floor(s.def * 1.5); s.spd = Math.floor(s.spd * 1.5); }
  if (mods.lb)  { s.atk = s.atk * 2; s.spa = s.spa * 2; }
  return s;
}

function printTable(labelW: number, colW: number, headerA: string, headerB: string, statsA: Record<string, number>, statsB: Record<string, number>, showBst: boolean) {
  console.log(' '.repeat(labelW + 2) + headerA.padStart(colW) + headerB.padStart(colW));
  const bstA = STATS.reduce((s, k) => s + statsA[k], 0);
  const bstB = STATS.reduce((s, k) => s + statsB[k], 0);
  for (const stat of STATS) {
    const vA = statsA[stat], vB = statsB[stat];
    const label = STAT_LABELS[stat].padEnd(labelW);
    const fmtA = vA > vB ? green(String(vA).padStart(colW)) : vA < vB ? red(String(vA).padStart(colW)) : String(vA).padStart(colW);
    const fmtB = vB > vA ? green(String(vB).padStart(colW)) : vB < vA ? red(String(vB).padStart(colW)) : String(vB).padStart(colW);
    console.log(`  ${label}${fmtA}${fmtB}`);
  }
  if (showBst) {
    const fA = bstA > bstB ? green(String(bstA).padStart(colW)) : bstA < bstB ? red(String(bstA).padStart(colW)) : String(bstA).padStart(colW);
    const fB = bstB > bstA ? green(String(bstB).padStart(colW)) : bstB < bstA ? red(String(bstB).padStart(colW)) : String(bstB).padStart(colW);
    console.log(`  ${'BST'.padEnd(labelW)}${fA}${fB}`);
  }
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
  let modsA: Mods = { evi: false, lb: false };
  let modsB: Mods = { evi: false, lb: false };

  if (targets.length === 2) {
    const pA = extractMods(targets[0]);
    const pB = extractMods(targets[1]);
    resolvedTargets = [pA.name, pB.name];
    modsA = pA.mods;
    modsB = pB.mods;
  } else if (targets.length === 1) {
    const words = targets[0].split(/\s+/);
    const { name: stripped, mods } = extractMods(targets[0]);
    const strippedWords = stripped.split(/\s+/);

    if (!dex.species.get(stripped).exists) {
      for (let split = 1; split < strippedWords.length; split++) {
        const left = strippedWords.slice(0, split).join(' ');
        const right = strippedWords.slice(split).join(' ');
        if (dex.species.get(left).exists && dex.species.get(right).exists) {
          resolvedTargets = [left, right];
          const eviIdx = words.findIndex(w => w.toLowerCase() === 'eviolite');
          const lbIdx  = words.findIndex(w => w.toLowerCase() === 'lightball' || w.toLowerCase() === 'light-ball');
          if (eviIdx !== -1) { modsA.evi = eviIdx <= split; modsB.evi = eviIdx > split; }
          if (lbIdx  !== -1) { modsA.lb  = lbIdx  <= split; modsB.lb  = lbIdx  > split; }
          break;
        }
      }
    } else {
      modsA = mods;
    }
  }

  if (resolvedTargets.length < 2) {
    console.log('Usage: compare [gen] <pokemon1>, <pokemon2>');
    return;
  }

  const [a, b] = [dex.species.get(resolvedTargets[0]), dex.species.get(resolvedTargets[1])];
  if (!a.exists) { console.error(`'${resolvedTargets[0]}' not found.`); return; }
  if (!b.exists) { console.error(`'${resolvedTargets[1]}' not found.`); return; }

  if (modsA.evi && !a.evos?.length) { console.log(dim(`(${a.name} is fully evolved, eviolite has no effect)`)); modsA.evi = false; }
  if (modsB.evi && !b.evos?.length) { console.log(dim(`(${b.name} is fully evolved, eviolite has no effect)`)); modsB.evi = false; }
  if (modsA.lb && a.baseSpecies !== 'Pikachu') { console.log(dim(`(light ball only works for Pikachu)`)); modsA.lb = false; }
  if (modsB.lb && b.baseSpecies !== 'Pikachu') { console.log(dim(`(light ball only works for Pikachu)`)); modsB.lb = false; }

  const anyMod = modsA.evi || modsA.lb || modsB.evi || modsB.lb;
  const baseA = applyBaseMods(a.baseStats, modsA);
  const baseB = applyBaseMods(b.baseStats, modsB);

  const genLabel = dex !== Dex ? dim(` [${dex.currentMod}]`) : '';
  const modLabelA = modsA.evi ? '+Evi' : modsA.lb ? '+LB' : '';
  const modLabelB = modsB.evi ? '+Evi' : modsB.lb ? '+LB' : '';
  const displayA = a.name + modLabelA;
  const displayB = b.name + modLabelB;
  const labelW = 4;
  const colW = Math.max(displayA.length, displayB.length, 6) + 2;

  const modTitleA = modsA.evi ? dim(' +Eviolite') : modsA.lb ? dim(' +Light Ball') : '';
  const modTitleB = modsB.evi ? dim(' +Eviolite') : modsB.lb ? dim(' +Light Ball') : '';
  console.log(`\n${bold(a.name)}${modTitleA} vs ${bold(b.name)}${modTitleB}${genLabel}\n`);

  if (anyMod) console.log(dim('  base stats'));
  printTable(labelW, colW, displayA, displayB, baseA, baseB, true);

  if (anyMod) {
    const lv100A = applyLv100Mods(calcLv100(a.baseStats), modsA);
    const lv100B = applyLv100Mods(calcLv100(b.baseStats), modsB);
    console.log(dim('\n  lv.100 — 31 IVs, 0 EVs, neutral nature'));
    printTable(labelW, colW, displayA, displayB, lv100A, lv100B, false);
  }

  console.log();
}
