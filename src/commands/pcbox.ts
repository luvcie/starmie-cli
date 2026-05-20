import { Dex } from '@pkmn/sim';
import { bold, dim, cyan } from '../ansi';
import { saveTeam, deleteTeam, getTeam, listTeams } from '../config';

function parsePokemonList(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function showList(): void {
  const teams = listTeams();
  const names = Object.keys(teams);
  if (!names.length) {
    console.log(dim('No saved teams. Save one with: pcbox save <name> <p1>, <p2>, ...'));
    return;
  }
  console.log(`\n${bold('Saved teams')}\n`);
  for (const name of names) {
    console.log(`  ${cyan(name)}  ${teams[name].join(', ')}`);
  }
  console.log();
}

function showOne(name: string): void {
  const team = getTeam(name);
  if (!team) {
    console.error(`No team named '${name}'.`);
    return;
  }
  console.log(`\n${bold(name)}: ${team.join(', ')}\n`);
}

export function cmdPcbox(args: string[]): void {
  if (!args.length) { showList(); return; }

  const sub = args[0].toLowerCase();
  const rest = args.slice(1).join(' ');

  if (sub === 'list') { showList(); return; }

  if (sub === 'show') {
    if (!rest.trim()) { console.log(dim('Usage: pcbox show <name>')); return; }
    showOne(rest.trim());
    return;
  }

  if (sub === 'delete' || sub === 'remove' || sub === 'rm') {
    if (!rest.trim()) { console.log(dim('Usage: pcbox delete <name>')); return; }
    const name = rest.trim();
    if (deleteTeam(name)) {
      console.log(`Deleted team '${name}'.`);
    } else {
      console.error(`No team named '${name}'.`);
    }
    return;
  }

  if (sub === 'save' || sub === 'add') {
    const restTrim = rest.trim();
    if (!restTrim) { console.log(dim('Usage: pcbox save <name> <p1>, <p2>, ...')); return; }

    const spaceIdx = restTrim.indexOf(' ');
    if (spaceIdx === -1) {
      console.log(dim('Usage: pcbox save <name> <p1>, <p2>, ...'));
      return;
    }
    const name = restTrim.slice(0, spaceIdx).trim();
    const listRaw = restTrim.slice(spaceIdx + 1).trim();
    const pokemon = parsePokemonList(listRaw);

    if (!pokemon.length) {
      console.log(dim('Usage: pcbox save <name> <p1>, <p2>, ...'));
      return;
    }

    const resolved: string[] = [];
    for (const p of pokemon) {
      const species = Dex.species.get(p);
      if (!species.exists) {
        console.error(`'${p}' not found.`);
        return;
      }
      resolved.push(species.name);
    }

    saveTeam(name, resolved);
    console.log(`Saved team '${name}': ${resolved.join(', ')}`);
    return;
  }

  console.log(dim('Usage: pcbox save|list|show|delete <name> [pokemon list]'));
}
