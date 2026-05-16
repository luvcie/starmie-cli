import { Dex } from '@pkmn/sim';
import { bold, dim, red, green, cyan } from '../ansi';
import { splitGen } from '../gen';

const ABILITY_IMMUNITIES: Record<string, string[]> = {
  Ground:   ['Levitate', 'Earth Eater'],
  Water:    ['Water Absorb', 'Storm Drain', 'Dry Skin'],
  Fire:     ['Flash Fire', 'Well-Baked Body'],
  Electric: ['Volt Absorb', 'Lightning Rod', 'Motor Drive'],
  Grass:    ['Sap Sipper'],
};

const ITEM_IMMUNITIES: Record<string, string[]> = {
  Ground: ['Air Balloon'],
};

export function cmdCounter(args: string[]): void {
  if (!args.length) {
    console.log('Usage: counter [gen] <move|type> [, pokemon1, pokemon2, ...]');
    return;
  }

  const { dex, targets } = splitGen(args);
  if (!targets.length) {
    console.log('Usage: counter [gen] <move|type> [, pokemon1, pokemon2, ...]');
    return;
  }

  const srcMove = dex.moves.get(targets[0]);
  const srcType = dex.types.get(targets[0]);

  let atkType: string;
  let label: string;

  const isStatus = srcMove.exists && srcMove.category === 'Status';

  if (srcMove.exists) {
    atkType = srcMove.type;
    label = `${srcMove.type} ${dim(`(${srcMove.name})`)}`;
  } else if (srcType.exists) {
    atkType = srcType.name;
    label = srcType.name;
  } else {
    console.error(`'${targets[0]}' is not a move or type.`);
    return;
  }

  const genLabel = dex !== Dex ? dim(` [${dex.currentMod}]`) : '';
  const teamTargets = targets.slice(1);
  const abilityImm = ABILITY_IMMUNITIES[atkType] ?? [];
  const itemImm = ITEM_IMMUNITIES[atkType] ?? [];

  if (teamTargets.length === 0) {
    const immune: string[] = [];
    const resists: string[] = [];

    for (const typeName of dex.types.names()) {
      const notImmune = dex.getImmunity(atkType, [typeName]);
      if (!notImmune) immune.push(typeName);
      else {
        const mod = dex.getEffectiveness(atkType, [typeName]);
        if (mod < 0) resists.push(typeName);
      }
    }

    console.log(`\n${bold(label)}${genLabel}\n`);
    console.log(`${cyan('Immune')}:          ${immune.join(', ') || dim('none')}`);
    if (!isStatus) console.log(`${green('Resists')}:         ${resists.join(', ') || dim('none')}`);
    if (abilityImm.length) console.log(`${dim('Immune (ability)')}:  ${dim(abilityImm.join(', '))}`);
    if (itemImm.length)    console.log(`${dim('Immune (item)')}:     ${dim(itemImm.join(', '))}`);
    console.log();
  } else {
    const immune: string[] = [];
    const resists: string[] = [];
    const neutral: string[] = [];
    const weak: string[] = [];

    for (const t of teamTargets) {
      const species = dex.species.get(t);
      if (!species.exists) { console.error(`'${t}' not found.`); return; }
      const notImmune = dex.getImmunity(atkType, species.types);
      if (!notImmune) { immune.push(species.name); continue; }
      const mod = dex.getEffectiveness(atkType, species.types);
      if (mod < 0) resists.push(species.name);
      else if (mod === 0) neutral.push(species.name);
      else weak.push(species.name);
    }

    console.log(`\n${bold(label)}${genLabel} — team:\n`);
    if (immune.length)               console.log(`${cyan('Immune')}:   ${immune.join(', ')}`);
    if (!isStatus && resists.length) console.log(`${green('Resists')}:  ${resists.join(', ')}`);
    if (neutral.length)              console.log(`${dim('Neutral')}:  ${neutral.join(', ')}`);
    if (weak.length)                 console.log(`${red('Weak')}:     ${weak.join(', ')}`);
    if (abilityImm.length) console.log(`${dim('Immune (ability)')}:  ${dim(abilityImm.join(', '))}`);
    if (itemImm.length)    console.log(`${dim('Immune (item)')}:     ${dim(itemImm.join(', '))}`);
    console.log();
  }
}
