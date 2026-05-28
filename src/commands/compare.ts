import { Dex } from '@pkmn/sim';
import { bold, dim, green, red } from '../ansi';
import { splitGen } from '../gen';

const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as const;
const STAT_LABELS: Record<string, string> = {
  hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe',
};

type Mods = { evi: boolean; lb: boolean; level: number };

function extractMods(s: string): { name: string; mods: Mods } {
  let normalized = s.trim().replace(/\blight[\s-]+ball\b/gi, 'lightball');
  let level = 100;
  const lvlMatches = [...normalized.matchAll(/(?:^|\s)(?:lvl|lv|level|l)\s*(\d+)(?=\s|$)/gi)];
  if (lvlMatches.length) {
    level = Math.max(1, Math.min(100, parseInt(lvlMatches[0][1], 10)));
    normalized = normalized.replace(/(?:^|\s)(?:lvl|lv|level|l)\s*\d+(?=\s|$)/gi, ' ').replace(/\s+/g, ' ').trim();
  }
  const words = normalized.split(/\s+/);
  let evi = false, lb = false;
  const remaining = words.filter(w => {
    const lc = w.toLowerCase();
    if (lc === 'eviolite') { evi = true; return false; }
    if (lc === 'lightball') { lb = true; return false; }
    return true;
  });
  return { name: remaining.join(' ').trim(), mods: { evi, lb, level } };
}

function applyBaseMods(stats: Record<string, number>, mods: Mods) {
  const s = { ...stats };
  if (mods.evi) { s.def = Math.floor(s.def * 1.5); s.spd = Math.floor(s.spd * 1.5); }
  if (mods.lb)  { s.atk = s.atk * 2; s.spa = s.spa * 2; }
  return s;
}

// 31 IVs, neutral nature, given level and EV (per stat)
function calcStats(base: Record<string, number>, level: number, evs: number) {
  const evContrib = Math.floor(evs / 4);
  const calc = (b: number) => Math.floor((2 * b + 31 + evContrib) * level / 100) + 5;
  const hp = base.hp === 1
    ? 1
    : Math.floor((2 * base.hp + 31 + evContrib) * level / 100) + level + 10;
  return {
    hp,
    atk: calc(base.atk),
    def: calc(base.def),
    spa: calc(base.spa),
    spd: calc(base.spd),
    spe: calc(base.spe),
  };
}

function applyLevelMods(stats: Record<string, number>, mods: Mods) {
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
    console.log('Usage: compare [gen] [randoms] <pokemon1> [lvl<N>], <pokemon2> [lvl<N>]');
    return;
  }

  let randoms = false;
  let showBase = false;
  let joined = args.join(' ');
  if (/(?:^|\s)-{0,2}randoms(?=\s|,|$)/i.test(joined)) {
    randoms = true;
    joined = joined.replace(/(?:^|\s)-{0,2}randoms(?=\s|,|$)/gi, ' ');
  }
  if (/(?:^|\s)-{0,2}base(?=\s|,|$)/i.test(joined)) {
    showBase = true;
    joined = joined.replace(/(?:^|\s)-{0,2}base(?=\s|,|$)/gi, ' ');
  }
  const filteredArgs = joined.replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean);

  const { dex, targets } = splitGen(filteredArgs);

  if (targets.length > 2) {
    console.error('compare only supports 2 pokemon at a time.');
    return;
  }

  let resolvedTargets = targets;
  let modsA: Mods = { evi: false, lb: false, level: 100 };
  let modsB: Mods = { evi: false, lb: false, level: 100 };

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
          const lvlMatchesAll = [...targets[0].matchAll(/(?:^|\s)(?:lvl|lv|level|l)\s*(\d+)(?=\s|$)/gi)];
          if (eviIdx !== -1) { modsA.evi = eviIdx <= split; modsB.evi = eviIdx > split; }
          if (lbIdx  !== -1) { modsA.lb  = lbIdx  <= split; modsB.lb  = lbIdx  > split; }
          if (lvlMatchesAll.length >= 1) modsA.level = Math.max(1, Math.min(100, parseInt(lvlMatchesAll[0][1], 10)));
          if (lvlMatchesAll.length >= 2) modsB.level = Math.max(1, Math.min(100, parseInt(lvlMatchesAll[1][1], 10)));
          break;
        }
      }
    } else {
      modsA = mods;
    }
  }

  if (resolvedTargets.length < 2) {
    console.log('Usage: compare [gen] [randoms] <pokemon1> [lvl<N>], <pokemon2> [lvl<N>]');
    return;
  }

  const [a, b] = [dex.species.get(resolvedTargets[0]), dex.species.get(resolvedTargets[1])];
  if (!a.exists) { console.error(`'${resolvedTargets[0]}' not found.`); return; }
  if (!b.exists) { console.error(`'${resolvedTargets[1]}' not found.`); return; }

  if (modsA.evi && !a.evos?.length) { console.log(dim(`(${a.name} is fully evolved, eviolite has no effect)`)); modsA.evi = false; }
  if (modsB.evi && !b.evos?.length) { console.log(dim(`(${b.name} is fully evolved, eviolite has no effect)`)); modsB.evi = false; }
  if (modsA.lb && a.baseSpecies !== 'Pikachu') { console.log(dim(`(light ball only works for Pikachu)`)); modsA.lb = false; }
  if (modsB.lb && b.baseSpecies !== 'Pikachu') { console.log(dim(`(light ball only works for Pikachu)`)); modsB.lb = false; }

  const anyItemMod = modsA.evi || modsA.lb || modsB.evi || modsB.lb;
  const anyLevelMod = modsA.level !== 100 || modsB.level !== 100;
  const showAdjusted = anyItemMod || anyLevelMod || randoms;
  const showBaseSection = !showAdjusted || showBase;
  const baseA = applyBaseMods(a.baseStats, modsA);
  const baseB = applyBaseMods(b.baseStats, modsB);

  const genLabel = dex !== Dex ? dim(` [${dex.currentMod}]`) : '';
  const randomsLabel = randoms ? dim(' [randoms]') : '';
  const lvlA = modsA.level !== 100 ? ` lv${modsA.level}` : '';
  const lvlB = modsB.level !== 100 ? ` lv${modsB.level}` : '';
  const modLabelA = modsA.evi ? '+Evi' : modsA.lb ? '+LB' : '';
  const modLabelB = modsB.evi ? '+Evi' : modsB.lb ? '+LB' : '';
  const baseDisplayA = a.name + modLabelA;
  const baseDisplayB = b.name + modLabelB;
  const displayA = baseDisplayA + lvlA;
  const displayB = baseDisplayB + lvlB;
  const labelW = 4;
  const colW = Math.max(displayA.length, displayB.length, 6) + 2;

  const modTitleA = modsA.evi ? dim(' +Eviolite') : modsA.lb ? dim(' +Light Ball') : '';
  const modTitleB = modsB.evi ? dim(' +Eviolite') : modsB.lb ? dim(' +Light Ball') : '';
  console.log(`\n${bold(a.name)}${modTitleA} vs ${bold(b.name)}${modTitleB}${genLabel}${randomsLabel}\n`);

  if (showBaseSection) {
    if (showAdjusted) console.log(dim('  base stats'));
    printTable(labelW, colW, baseDisplayA, baseDisplayB, baseA, baseB, true);
  }

  if (showAdjusted) {
    const evs = randoms ? 85 : 0;
    const calcA = applyLevelMods(calcStats(a.baseStats, modsA.level, evs), modsA);
    const calcB = applyLevelMods(calcStats(b.baseStats, modsB.level, evs), modsB);
    const evLabel = randoms ? '85 EVs all stats' : '0 EVs';
    const lvlLabel = modsA.level === modsB.level
      ? `lv.${modsA.level}`
      : `lv.${modsA.level} / lv.${modsB.level}`;
    const prefix = showBaseSection ? '\n  ' : '  ';
    console.log(dim(`${prefix}${lvlLabel} (31 IVs, ${evLabel}, neutral nature)`));
    printTable(labelW, colW, displayA, displayB, calcA, calcB, false);
  }

  console.log();
}
