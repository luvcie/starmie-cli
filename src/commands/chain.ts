import { Dex } from '@pkmn/sim';
import type { ModdedDex, Species } from '@pkmn/sim';
import { bold, dim, yellow } from '../ansi';
import { splitGen } from '../gen';

function fmtMethod(s: Species): string {
  const { evoType, evoLevel, evoItem, evoMove, evoCondition } = s;
  if (!evoType && evoLevel) return `Lv ${evoLevel}${evoCondition ? ` ${evoCondition}` : ''}`;
  switch (evoType) {
    case 'useItem':        return evoItem ?? 'item';
    case 'trade':          return evoItem ? `Trade w/ ${evoItem}` : 'Trade';
    case 'levelFriendship': return `Friendship${evoCondition ? ` ${evoCondition}` : ''}`;
    case 'levelMove':      return `Level up knowing ${evoMove}`;
    case 'levelExtra':     return evoCondition ?? 'special';
    case 'other':          return evoCondition ?? 'special';
    default:               return evoCondition ?? '?';
  }
}

function fmtTypes(s: Species): string {
  return dim(` [${s.types.join('/')}]`);
}

function printNode(species: Species, dex: ModdedDex, genNum: number, depth: number, target: string, prefix = ''): void {
  const indent = '  '.repeat(depth);
  const isTarget = species.name.toLowerCase() === target.toLowerCase();
  const name = isTarget ? yellow(bold(species.name)) : bold(species.name);
  console.log(`${indent}${prefix}${name}${fmtTypes(species)}`);

  for (const evoId of species.evos ?? []) {
    const evo = dex.species.get(evoId);
    if (!evo.exists || evo.gen > genNum) continue;
    printNode(evo, dex, genNum, depth + 1, target, dim(fmtMethod(evo) + ' → '));
  }
}

function getRoot(species: Species, dex: ModdedDex): Species {
  let current = species;
  while (current.prevo) {
    const prev = dex.species.get(current.prevo);
    if (!prev.exists) break;
    current = prev;
  }
  return current;
}

export function cmdChain(args: string[]): void {
  if (!args.length) {
    console.log('Usage: chain [gen] <pokemon>');
    return;
  }

  const { dex, targets } = splitGen(args);
  if (!targets.length) {
    console.log('Usage: chain [gen] <pokemon>');
    return;
  }

  const species = dex.species.get(targets[0]);
  if (!species.exists) {
    console.error(`'${targets[0]}' not found.`);
    return;
  }

  const genNum = dex !== Dex ? parseInt((dex as any).currentMod.replace('gen', ''), 10) : 9;
  const root = getRoot(species, dex);
  console.log();
  printNode(root, dex, genNum, 0, species.name);
  console.log();
}
