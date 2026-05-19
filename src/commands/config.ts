import { setUpdateCheck, getUpdateCheckSetting } from '../config';
import { dim } from '../ansi';

export function cmdConfig(args: string[]): void {
  if (!args.length) {
    const current = getUpdateCheckSetting();
    console.log(`update-check: ${current ? 'on' : 'off'}`);
    console.log(dim('Usage: config update-check on|off'));
    return;
  }

  const sub = args[0].toLowerCase();
  if (sub === 'update-check') {
    const val = args[1]?.toLowerCase();
    if (val === 'on') {
      setUpdateCheck(true);
      console.log('Update checks enabled.');
    } else if (val === 'off') {
      setUpdateCheck(false);
      console.log('Update checks disabled.');
    } else {
      console.log(dim('Usage: config update-check on|off'));
    }
    return;
  }

  console.log(dim('Usage: config update-check on|off'));
}
