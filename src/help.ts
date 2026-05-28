import { blue, bold, dim } from './ansi';

const COMMAND_DETAILS: Record<string, string> = {
  weakness: `${blue('weakness')} [gen] <pokemon|type[,type2]> [inverse]
  Weaknesses, resistances, and immunities.
  e.g. weakness charizard
       weakness fire,flying
       weakness water inverse
       weakness gen6, charizard`,

  eff: `${blue('eff')} [gen] <move|type>, <pokemon|type>
  Type effectiveness of a move or type against a defender.
  e.g. eff earthquake, charizard
       eff freeze-dry, vaporeon
       eff gen4, water, fire`,

  data: `${blue('data')} [gen] <name|dex number>  ${dim('Aliases: dex, dt')}
  Pokedex entry for a Pokemon, move, item, ability, or nature.
  e.g. data garchomp
       data 248
       data earthquake
       data gen6, choice band`,

  coverage: `${blue('coverage')} [gen] <move1[,move2,move3,move4]>
  Best type coverage for a set of up to 4 moves or types.
  e.g. coverage surf,thunderbolt,icebeam,earthquake
       coverage gen5, freeze-dry, flying press`,

  learn: `${blue('learn')} [gen] <pokemon|team>, <move>[, move2, ...]
  Check if a pokemon can learn a move (or combination), and how.
  Pass a team name (saved with ${blue('pcbox')}) or multiple pokemon to check the whole team.
  e.g. learn pikachu, thunderbolt
       learn gen6, togekiss, nasty plot
       learn main, trick room
       learn pikachu, bronzong, magearna, trick room`,

  dexsearch: `${blue('dexsearch')} [gen] <filter>[, filter, ...]  ${dim('Aliases: ds, nds')}
  Search for Pokemon matching criteria.
  Filters: type, tier, ability, fully evolved, egg group, hp/atk/def/spa/spd/spe/bst > N,
  learns <move>, resists/weak <type>, sort by stat
  e.g. dexsearch fire, ou
       dexsearch dragon, spe > 100
       dexsearch intimidate, !mega
       dexsearch grass, egg group grass, fully evolved
       dexsearch resists ground, weak ice, ou
       dexsearch earthquake, spe asc`,

  movesearch: `${blue('movesearch')} [gen] <filter>[, filter, ...]  ${dim('Alias: ms')}
  Search for moves matching criteria.
  Filters: type, physical/special/status, contact, sound, punch, bullet, bite,
  dance, heal, recharge, protect, pulse, slicing, wind, powder, secondary,
  highcrit, multihit, ohko, priority+/-, bp/accuracy/pp/priority > N,
  boosts/lowers/zboosts <stat>, status (psn/tox/brn/par/frz/slp), flinch,
  confusion, recovery, recoil, pivot, gen1..gen9, <pokemon> (learnset filter)
  e.g. movesearch fire, physical, bp > 80
       movesearch contact, priority+
       movesearch boosts atk, special
       movesearch sound, !status
       movesearch garchomp`,

  itemsearch: `${blue('itemsearch')} <description words>  ${dim('Alias: is')}
  Search items by description text. Special keywords: fling <bp>, natural gift <type>.
  e.g. itemsearch raises speed in sandstorm
       itemsearch restores hp
       itemsearch fling 90
       itemsearch natural gift fire
       itemsearch berry, gen4`,

  nature: `${blue('nature')} [name]
  Show stat changes for a nature, or list all 25 natures with their effects.
  e.g. nature jolly
       nature timid
       nature`,

  counter: `${blue('counter')} [gen] <move|type> [, pokemon1, pokemon2, ...]
  Show which types resist or are immune to a move/type. If pokemon are given,
  filters to just your team and groups them by immune, resists, neutral, weak.
  You can also pass a saved team by name (see ${blue('pcbox')}).
  e.g. counter earthquake
       counter fire
       counter earthquake, garchomp, rotom-wash, blissey, salamence
       counter earthquake, main`,

  compare: `${blue('compare')} [gen] [randoms] [base] <pokemon1> [lvl<N>], <pokemon2> [lvl<N>]
  Side-by-side stat comparison. Defaults to base stats. Add ${dim('lvl<N>')} for
  per-pokemon levels or ${dim('randoms')} for the 85 EVs/all-stats spread used in
  random battles. Those modes hide the base stats; add ${dim('base')} to also show them.
  e.g. compare garchomp, dragonite
       compare gen4, garchomp, salamence
       compare bw randoms shiftry lvl81, pinsir lvl74
       compare bw randoms base shiftry lvl81, pinsir lvl74`,

  teamcheck: `${blue('teamcheck')} [gen] <pokemon1>, <pokemon2>[, ...]  ${dim('Alias: team')}
  Team weakness analysis: shared weaknesses and types no member resists.
  You can also pass a saved team by name (see ${blue('pcbox')}).
  e.g. teamcheck charizard, blastoise, venusaur
       teamcheck bw, garchomp, ferrothorn, politoed
       teamcheck main`,

  pcbox: `${blue('pcbox')} [subcommand] [args]  ${dim('Alias: box')}
  Save teams of pokemon and reuse them in other commands by name.
  Subcommands:
    save <name> <p1>, <p2>, ...   save a team
    list                          list all saved teams (default if no subcommand)
    show <name>                   show a saved team
    delete <name>                 delete a saved team
  e.g. pcbox save main garchomp, ferrothorn, politoed, latios, jirachi, breloom
       pcbox list
       pcbox show main
       pcbox delete main
       counter earthquake, main
       teamcheck main`,

  ability: `${blue('ability')} [gen] <ability>  ${dim('Alias: abilities')}
  List all Pokemon with a given ability, grouped by regular vs hidden.
  e.g. ability intimidate
       ability bw, speed boost
       ability gen4, levitate`,

  evspread: `${blue('evspread')} [gen] <stat>
  List all Pokemon that give EVs in a stat, grouped by yield amount.
  e.g. evspread atk
       evspread bw atk
       evspread gen3, speed`,

  evyield: `${blue('evyield')} <pokemon>  ${dim('Alias: ev')}
  EV yield when defeating a Pokemon.
  e.g. evyield blissey
       evyield nidoran-m`,

  statcalc: `${blue('statcalc')} [level] [pokemon or base stat] [stat] [ivs] [evs] [nature] [modifier]
  Calculate the final value of a stat.
  note: level must use lv prefix (lv50, lv1), bare numbers are treated as base stats.
  e.g. statcalc lv50 garchomp spe 252+ scarf
       statcalc 100 252ev positive +1
       statcalc lc 45 atk uninvested`,

  randompokemon: `${blue('randompokemon')} [count] [filters]  ${dim('Aliases: rp, random')}
  Random Pokemon, optionally filtered by dexsearch criteria.
  e.g. randompokemon
       randompokemon 3
       randompokemon fire, ou
       randompokemon 3 dragon, spe > 100`,

  randommove: `${blue('randommove')} [count] [filters]  ${dim('Alias: rm')}
  Random move, optionally filtered by movesearch criteria.
  e.g. randommove
       randommove 5
       randommove water, special
       randommove 3 bp > 90, contact`,

  evo: `${blue('evo')} [gen] <pokemon>  ${dim('Aliases: evochain, chain')}
  Evolution chain for a Pokemon, showing evo methods.
  e.g. evo gastly
       evo haunter
       evo eevee`,

  moves: `${blue('moves')} [gen] <pokemon>
  Full learnset for a Pokemon grouped by method (level-up, TM/HM, egg, tutor, etc.)
  e.g. moves gengar
       moves bw gengar
       moves gen4 togekiss`,

  sets: `${blue('sets')} [gen] <pokemon> [, tier]  ${dim('Alias: smogon')}
  Competitive sets for a Pokemon from Smogon, grouped by tier.
  Move slots with multiple options are shown as A / B.
  e.g. sets bw chansey
       sets bw gengar
       sets gengar, ou
       sets gen4 garchomp`,

  randomquote: `${blue('randomquote')}  ${dim('Alias: rq')}
  Print a random Pokemon quote.`,

  config: `${blue('config')} <setting> <value>
  Manage starmie-cli settings.
  Settings:
    update-check on|off   check for a new version on startup
  e.g. config update-check on
       config update-check off
       config              (shows current settings)`,
};

const ALIASES: Record<string, string> = {
  weak: 'weakness', weaknesses: 'weakness', resist: 'weakness',
  effectiveness: 'eff', type: 'eff', matchup: 'eff',
  dex: 'data', dt: 'data',
  cover: 'coverage',
  learnset: 'learn',
  ds: 'dexsearch', nds: 'dexsearch',
  ms: 'movesearch',
  is: 'itemsearch',
  smogon: 'sets',
  ev: 'evyield',
  rp: 'randompokemon', randpoke: 'randompokemon', rollpokemon: 'randompokemon', random: 'randompokemon',
  rm: 'randommove', randmove: 'randommove', rollmove: 'randommove',
  rq: 'randomquote',
  evochain: 'evo', chain: 'evo',
  abilities: 'ability',
  team: 'teamcheck',
  box: 'pcbox',
};

function line(cmd: string, desc: string, aliases?: string): string {
  const aliasStr = aliases ? `  ${dim('Alias: ' + aliases)}` : '';
  return `  ${blue(('/' + cmd).padEnd(16))}${desc}${aliasStr}`;
}

function section(name: string): string {
  return `\n${bold(name)}`;
}

export function showHelp(args?: string[]): void {
  if (args && args.length > 0) {
    const cmd = args[0].toLowerCase().replace(/^\//, '');
    const canonical = ALIASES[cmd] ?? cmd;
    const detail = COMMAND_DETAILS[canonical];
    if (detail) {
      console.log('\n' + detail + '\n');
    } else {
      console.error(`No help for '${cmd}'. Type help to list all commands.`);
    }
    return;
  }

  console.log(`
${bold('Commands')}  ${dim('(the / is optional)')}
${section('lookup')}
${line('weakness', 'Weaknesses, resistances and immunities.')}
${line('eff', 'Type effectiveness of a move against a defender.')}
${line('data', 'Pokedex entry for a pokemon, move, item, ability, or nature.', 'dex, dt')}
${line('learn', 'Check if a pokemon can learn a move, and how.')}
${section('search')}
${line('dexsearch', 'Search pokemon by type, tier, ability, stats, and more.', 'ds')}
${line('movesearch', 'Search moves by type, category, power, and more.', 'ms')}
${line('itemsearch', 'Search items by description.', 'is')}
${section('battle')}
${line('coverage', 'Best type coverage for up to 4 moves or types.')}
${line('counter', 'Which types resist a move. Can filter by your team.')}
${line('teamcheck', 'Team weakness analysis.', 'team')}
${line('statcalc', 'Calculate the final value of a stat.')}
${line('compare', 'Side-by-side base stat comparison of two pokemon.')}
${section('pokedex')}
${line('evo', 'Evolution chain for a pokemon.', 'chain')}
${line('moves', 'Full learnset for a pokemon.')}
${line('sets', 'Competitive sets from Smogon.', 'smogon')}
${line('evyield', 'EV yield when defeating a pokemon.', 'ev')}
${line('evspread', 'All pokemon that give EVs in a stat.')}
${line('ability', 'List all pokemon with a given ability.', 'abilities')}
${line('nature', 'Stat changes for a nature, or list all 25.')}
${section('random')}
${line('randompokemon', 'Random pokemon, optionally filtered.', 'rp, random')}
${line('randommove', 'Random move, optionally filtered.', 'rm')}
${line('randomquote', 'Random pokemon quote.', 'rq')}
${section('settings')}
${line('pcbox', 'Save teams to reuse with @teamname.', 'box')}
${line('config', 'Manage settings (e.g. update checks).')}

  ${dim('Type')} help <command> ${dim('for examples.  e.g.')} help weakness

${bold('Generation prefixes')} ${dim('(supported by most commands)')}
  gen1  ${dim('rby, rb')}       gen5  ${dim('bw, bw2')}
  gen2  ${dim('gsc, gs')}       gen6  ${dim('oras, xy')}
  gen3  ${dim('adv, rs')}       gen7  ${dim('usum, sm')}
  gen4  ${dim('dpp, dp')}       gen8  ${dim('ss')}
                      gen9  ${dim('sv')}
`);}

