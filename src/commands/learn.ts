import { Dex, TeamValidator } from '@pkmn/sim';
import { bold, dim, red, green } from '../ansi';
import { parseGenPrefix } from '../gen';
import { getTeam } from '../config';

function parseSource(source: string): string {
  const gen = source.charAt(0);
  const method = source.charAt(1);
  const extra = source.slice(2);
  const methods: Record<string, string> = {
    L: `level-up${extra ? ' (' + extra + ')' : ''}`,
    M: 'TM/HM', T: 'tutor', E: 'egg', S: 'event', D: 'dream world', V: 'virtual console transfer',
  };
  return `Gen ${gen} ${methods[method] ?? method}`;
}

function findLearnSources(speciesId: string, moveId: string): { sources: string[]; learnedBy: string } | null {
  let current = Dex.species.get(speciesId);
  const allSources: string[] = [];
  let learnedBy: string | null = null;
  while (current.exists) {
    const data = Dex.species.getLearnsetData(current.id);
    const sources = data.learnset?.[moveId];
    if (sources && sources.length) {
      if (!learnedBy) learnedBy = current.name;
      for (const s of sources) {
        if (!allSources.includes(s)) allSources.push(s);
      }
    }
    if (!current.prevo) break;
    current = Dex.species.get(current.prevo);
  }
  if (!allSources.length) return null;
  return { sources: allSources, learnedBy: learnedBy! };
}

type Classification = { kind: 'pokemon'; names: string[] } | { kind: 'move'; name: string } | { kind: 'unknown' };

function classify(part: string, dex: ReturnType<typeof Dex.mod>): Classification {
  const explicit = part.startsWith('@') ? part.slice(1) : part;
  const team = getTeam(explicit);
  if (team) return { kind: 'pokemon', names: team };
  if (part.startsWith('@')) return { kind: 'unknown' };
  if (dex.species.get(part).exists) return { kind: 'pokemon', names: [part] };
  if (dex.moves.get(part).exists) return { kind: 'move', name: part };
  return { kind: 'unknown' };
}

function checkTeamLearn(pokemon: string[], moves: ReturnType<typeof Dex.moves.get>[], genMod: string, level: number): { name: string; can: boolean }[] {
  const dex = Dex.mod(genMod);
  const formatId = `${genMod}ou`;
  const validator = TeamValidator.get(formatId);
  const moveNames = moves.map(m => m.name);
  return pokemon.map(name => {
    const species = dex.species.get(name);
    const setSources = validator.allSources(species);
    const problems = validator.validateMoves(species, moveNames, setSources, { name: species.name, species: species.name, level });
    return { name: species.name, can: problems.length === 0 };
  });
}

export function cmdLearn(args: string[]): void {
  if (!args.length) {
    console.log('Usage: learn [gen] <pokemon>, <move>[, <move2>, ...]');
    console.log('  e.g. learn pikachu, thunderbolt');
    console.log('       learn main, trick room');
    console.log('       learn pikachu, bronzong, magearna, trick room');
    return;
  }

  const raw = args.join(' ');
  const { genMod = 'gen9', rest } = parseGenPrefix(raw);

  let restMut = rest;

  // check for lc (level 5) flag
  let level = 100;
  if (restMut.match(/\blc\b/i)) {
    level = 5;
    restMut = restMut.replace(/\blc\b/i, '').replace(/,\s*,/, ',').trim().replace(/^,|,$/, '').trim();
  }

  const dex = Dex.mod(genMod);

  let pokemon: string[] = [];
  let moveNames: string[] = [];

  if (restMut.includes(',')) {
    const parts = restMut.split(',').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      const c = classify(part, dex);
      if (c.kind === 'pokemon') pokemon.push(...c.names);
      else if (c.kind === 'move') moveNames.push(part);
      else { console.error(`'${part}' is not a recognized pokemon, move, or saved team`); return; }
    }
  } else {
    const tokens = restMut.split(/\s+/).filter(Boolean);
    let i = 0;
    let parsed = true;
    while (i < tokens.length) {
      let matched = false;
      for (let len = Math.min(4, tokens.length - i); len >= 1; len--) {
        const chunk = tokens.slice(i, i + len).join(' ');
        const c = classify(chunk, dex);
        if (c.kind !== 'unknown') {
          if (c.kind === 'pokemon') pokemon.push(...c.names);
          else moveNames.push(chunk);
          i += len;
          matched = true;
          break;
        }
      }
      if (!matched) { parsed = false; break; }
    }
    if (!parsed) {
      // fall back to original behavior: assume single poke + single move
      pokemon = [tokens[0]];
      moveNames = [tokens.slice(1).join(' ')];
      for (let i = 1; i < tokens.length; i++) {
        const testPoke = dex.species.get(tokens.slice(0, i).join(' '));
        const testMove = dex.moves.get(tokens.slice(i).join(' '));
        if (testPoke.exists && testMove.exists) {
          pokemon = [tokens.slice(0, i).join(' ')];
          moveNames = [tokens.slice(i).join(' ')];
          break;
        }
      }
    }
  }

  if (!pokemon.length) {
    console.error('specify at least one pokemon, e.g. learn pikachu, thunderbolt');
    return;
  }
  if (!moveNames[0]) {
    console.error('specify at least one move, e.g. learn pikachu, thunderbolt');
    return;
  }

  for (const name of pokemon) {
    if (!dex.species.get(name).exists) {
      console.error(`'${name}' is not a recognized pokemon`);
      return;
    }
  }

  const moves = moveNames.map(m => dex.moves.get(m));
  for (const m of moves) {
    if (!m.exists) { console.error(`'${m.id}' is not a recognized move`); return; }
  }

  const genLabel = genMod !== 'gen9' ? dim(` [${genMod}]`) : '';

  if (pokemon.length > 1) {
    const combo = moves.map(m => m.name).join(' + ');
    const results = checkTeamLearn(pokemon, moves, genMod, level);
    const can = results.filter(r => r.can).map(r => r.name);
    const cant = results.filter(r => !r.can).map(r => r.name);
    console.log(`\n${bold(combo)}${genLabel} — team of ${pokemon.length}:\n`);
    if (can.length) console.log(`  ${green('can')}    ${can.join(', ')}`);
    if (cant.length) console.log(`  ${red("can't")}  ${cant.join(', ')}`);
    console.log();
    return;
  }

  const species = dex.species.get(pokemon[0]);
  const formatId = `${genMod}ou`;
  const validator = TeamValidator.get(formatId);
  const setSources = validator.allSources(species);
  const problems = validator.validateMoves(species, moves.map(m => m.name), setSources, { name: species.name, species: species.name, level });

  const canLearn = problems.length === 0;
  const combo = moves.map(m => m.name).join(' + ');
  console.log(`\n${bold(species.name)}${genLabel} ${canLearn ? green('can') : red("can't")} learn ${bold(combo)}`);

  const genNum = genMod.replace('gen', '');
  for (const move of moves) {
    const found = findLearnSources(species.id, move.id);
    if (!found) {
      console.log(`  ${move.name}: ${dim('not in learnset')}`);
      continue;
    }
    const { sources, learnedBy } = found;
    const relevant = sources.filter(s => parseInt(s.charAt(0)) <= parseInt(genNum));
    const display = relevant.slice(0, 5).map(parseSource);
    const origin = learnedBy !== species.name ? dim(` (via ${learnedBy})`) : '';
    let srcStr: string;
    if (display.length) {
      srcStr = display.join(', ') + (relevant.length > 5 ? dim(' ...') : '');
    } else if (canLearn) {
      srcStr = dim('available (no source records for this gen)');
    } else {
      srcStr = dim('not available in this gen');
    }
    console.log(`  ${move.name}${origin}: ${srcStr}`);
  }

  if (problems.length) {
    console.log(`\n  ${red('issues:')}`);
    for (const p of problems) console.log(`  ${dim(p)}`);
  }

  console.log();

}
