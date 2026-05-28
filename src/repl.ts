import * as readline from 'readline';
import React from 'react';
import { render } from 'ink';
import { bold, cyan, blue, dim } from './ansi';
import { GhostInput } from './repl/ghost-input';
import { loadHistory, appendHistory } from './repl/history';
import { showHelp } from './help';
import { cmdWeakness } from './commands/weakness';
import { cmdEffectiveness } from './commands/effectiveness';
import { cmdCoverage } from './commands/coverage';
import { cmdData } from './commands/data';
import { cmdLearn } from './commands/learn';
import { cmdDexsearch } from './commands/dexsearch';
import { cmdMovesearch } from './commands/movesearch';
import { cmdItemsearch } from './commands/itemsearch';
import { cmdStatcalc } from './commands/statcalc';
import { cmdRandomPokemon, cmdRandomMove, cmdRandomQuote } from './commands/random';
import { cmdEv } from './commands/ev';
import { cmdNature } from './commands/nature';
import { cmdEvspread } from './commands/evspread';
import { cmdAbilities } from './commands/abilities';
import { cmdTeam } from './commands/team';
import { cmdCompare } from './commands/compare';
import { cmdCounter } from './commands/counter';
import { cmdSets } from './commands/sets';
import { cmdMoves } from './commands/moves';
import { cmdChain } from './commands/chain';
import { cmdConfig } from './commands/config';
import { cmdPcbox } from './commands/pcbox';
import { isFirstRun, setUpdateCheck, getUpdateCheckSetting, checkForUpdates } from './config';


import { randKaomoji } from './kaomoji';

function dispatch(cmd: string, args: string[]): void {
  if (cmd.startsWith('/')) cmd = cmd.slice(1);
  args = args.map(a => a.replace(/^-{1,2}(?=[a-zA-Z])/, ''));
  switch (cmd.toLowerCase()) {
  case 'weakness':
  case 'weak':
  case 'weaknesses':
  case 'resist':
    cmdWeakness(args);
    break;
  case 'eff':
  case 'effectiveness':
  case 'type':
  case 'matchup':
    cmdEffectiveness(args);
    break;
  case 'data':
  case 'dex':
  case 'dt':
    cmdData(args);
    break;
  case 'coverage':
  case 'cover':
    cmdCoverage(args);
    break;
  case 'learn':
  case 'learnset':
    cmdLearn(args);
    break;
  case 'dexsearch':
  case 'ds':
  case 'nds':
    cmdDexsearch(args);
    break;
  case 'movesearch':
  case 'ms':
    cmdMovesearch(args);
    break;
  case 'itemsearch':
  case 'is':
    cmdItemsearch(args);
    break;
  case 'statcalc':
    cmdStatcalc(args);
    break;
  case 'evyield':
  case 'ev':
    cmdEv(args);
    break;
  case 'nature':
    cmdNature(args);
    break;
  case 'evspread':
    cmdEvspread(args);
    break;
  case 'ability':
  case 'abilities':
    cmdAbilities(args);
    break;
  case 'teamcheck':
  case 'team':
    cmdTeam(args);
    break;
  case 'pcbox':
  case 'box':
    cmdPcbox(args);
    break;
  case 'compare':
    cmdCompare(args);
    break;
  case 'counter':
    cmdCounter(args);
    break;
  case 'sets': case 'smogon':
    cmdSets(args);
    break;
  case 'moves':
    cmdMoves(args);
    break;
  case 'evo':
  case 'evochain':
  case 'chain':
    cmdChain(args);
    break;
  case 'randompokemon':
  case 'random':
  case 'randpoke':
  case 'rollpokemon':
  case 'rp':
    cmdRandomPokemon(args);
    break;
  case 'randommove':
  case 'randmove':
  case 'rollmove':
  case 'rm':
    cmdRandomMove(args);
    break;
  case 'randomquote':
  case 'rq':
    cmdRandomQuote();
    break;
  case 'config':
    cmdConfig(args);
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp(args);
    break;
  default:
    console.error(`Unknown command: ${cmd}. Type ${cyan('help')} to see available commands.`);
  }
}

const argv = process.argv.slice(2);

if (argv.length > 0) {
  const [cmd, ...rest] = argv;
  if (cmd === '--version' || cmd === '-version') {
    const { version } = await import('../package.json');
    console.log(`starmie-cli ${version}`);
    process.exit(0);
  }
  dispatch(cmd, rest);
} else {
  console.log(`${bold('starmie-cli')} ${randKaomoji()} type ${blue('help')} to see available commands, ${blue('exit')} to quit.\n`);

  if (isFirstRun()) {
    await new Promise<void>(resolve => {
      const tmp = readline.createInterface({ input: process.stdin, output: process.stdout });
      tmp.question('check for updates on startup? [y/n] ', answer => {
        tmp.close();
        const enabled = answer.trim().toLowerCase() === 'y';
        setUpdateCheck(enabled);
        if (enabled) {
          console.log(dim('Got it. Disable later with: config update-check off') + '\n');
        } else {
          console.log(dim('Got it. Enable later with: config update-check on') + '\n');
        }
        resolve();
      });
    });
  }

  if (getUpdateCheckSetting()) {
    const { version } = await import('../package.json');
    const timeout = new Promise<null>(r => setTimeout(() => r(null), 3000));
    const latest = await Promise.race([checkForUpdates(version), timeout]);
    if (latest) {
      console.log(dim(`  update available: v${version} → v${latest}  (github.com/luvcie/starmie-cli/releases)\n`));
    }
  }

  const history = loadHistory();

  let inkInstance: ReturnType<typeof render> | null = null;

  const handleSubmit = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed === 'exit' || trimmed === 'quit') {
      inkInstance?.unmount();
      console.log(`Goodbye! ${randKaomoji()}`);
      process.exit(0);
    }
    console.log(`${cyan('› ')}${trimmed}`);
    appendHistory(trimmed, history);
    history.push(trimmed);
    const [cmd] = trimmed.split(/\s+/);
    const rawArgs = trimmed.slice(cmd.length).trim();
    dispatch(cmd, rawArgs ? rawArgs.split(/\s+/) : []);
  };

  inkInstance = render(
    React.createElement(GhostInput, {
      history,
      prompt: cyan('› '),
      onSubmit: handleSubmit,
    }),
  );
}
