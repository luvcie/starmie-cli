import { Dex } from '@pkmn/sim';
import { bold, dim, blue } from '../ansi';
import { splitGen } from '../gen';

const METHOD_ORDER = ['L', 'M', 'R', 'E', 'T', 'D', 'S', 'V'];

const METHOD_LABEL: Record<string, string> = {
  L: 'Level-up',
  M: 'TM / HM',
  R: 'TR',
  E: 'Egg',
  T: 'Tutor',
  D: 'Dream World',
  S: 'Event',
  V: 'Transfer',
};

const DIM_METHODS = new Set(['D', 'S', 'V']);

function wrapList(items: string[], indent: string, maxWidth = 100): string {
  const lines: string[] = [];
  let line = indent;
  for (let i = 0; i < items.length; i++) {
    const sep = i === 0 ? '' : ', ';
    const token = sep + items[i];
    if (line.length + token.length > maxWidth && i > 0) {
      lines.push(line);
      line = indent + items[i];
    } else {
      line += token;
    }
  }
  if (line.trim()) lines.push(line);
  return lines.join('\n');
}

export function cmdMoves(args: string[]): void {
  if (!args.length) {
    console.log('Usage: moves [gen] <pokemon>');
    return;
  }

  const { dex, targets } = splitGen(args);
  if (!targets.length) {
    console.log('Usage: moves [gen] <pokemon>');
    return;
  }

  const species = dex.species.get(targets[0]);
  if (!species.exists) {
    console.error(`'${targets[0]}' not found.`);
    return;
  }

  const genNum = dex !== Dex ? parseInt((dex as any).currentMod.replace('gen', ''), 10) : 9;
  const genLabel = dex !== Dex ? dim(` [${(dex as any).currentMod}]`) : '';

  const learnsetData = Dex.species.getLearnsetData(species.id);
  if (!learnsetData?.learnset) {
    console.error(`No learnset data for '${species.name}'.`);
    return;
  }

  const levelMoves = new Map<number, string[]>();
  const methodMoves = new Map<string, Set<string>>();

  for (const [moveId, codes] of Object.entries(learnsetData.learnset)) {
    const moveName = Dex.moves.get(moveId).name;
    for (const code of codes) {
      if (parseInt(code[0], 10) !== genNum) continue;
      const method = code[1];
      if (method === 'L') {
        const level = parseInt(code.slice(2), 10) || 1;
        if (!levelMoves.has(level)) levelMoves.set(level, []);
        levelMoves.get(level)!.push(moveName);
      } else {
        if (!methodMoves.has(method)) methodMoves.set(method, new Set());
        methodMoves.get(method)!.add(moveName);
      }
    }
  }

  if (levelMoves.size === 0 && methodMoves.size === 0) {
    const availableGens = new Set<number>();
    for (const codes of Object.values(learnsetData.learnset)) {
      for (const code of codes) {
        availableGens.add(parseInt(code[0], 10));
      }
    }
    const latest = Math.max(...availableGens);
    console.log(`\n${bold(species.name)}${genLabel}\n  No moves found for gen ${genNum}. Try: moves gen${latest} ${species.name.toLowerCase()}\n`);
    return;
  }

  console.log(`\n${bold(species.name)}${genLabel}\n`);

  if (levelMoves.size > 0) {
    console.log(`  ${blue('Level-up')}`);
    const sorted = [...levelMoves.entries()].sort((a, b) => a[0] - b[0]);
    for (const [level, moves] of sorted) {
      const lvStr = String(level).padStart(3);
      console.log(`    ${dim(lvStr)}  ${moves.sort().join(', ')}`);
    }
    console.log();
  }

  for (const method of METHOD_ORDER.filter(m => m !== 'L')) {
    const moves = methodMoves.get(method);
    if (!moves) continue;
    const label = METHOD_LABEL[method] ?? method;
    const isDim = DIM_METHODS.has(method);
    const sorted = [...moves].sort();
    console.log(`  ${isDim ? dim(label) : blue(label)}`);
    const lines = wrapList(sorted, '    ');
    console.log(isDim ? dim(lines) : lines);
    console.log();
  }
}
