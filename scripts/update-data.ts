#!/usr/bin/env bun
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const SETS_BASE = 'https://pkmn.github.io/smogon/data/sets';
const RANDBATS_BASE = 'https://pkmn.github.io/randbats/data';

async function updateSets() {
  console.log('Updating Smogon sets...');
  await mkdir('data/sets', { recursive: true });
  for (let gen = 1; gen <= 9; gen++) {
    const res = await fetch(`${SETS_BASE}/gen${gen}.json`);
    if (!res.ok) { console.error(`  gen${gen}: HTTP ${res.status}`); continue; }
    const text = await res.text();
    await Bun.write(`data/sets/gen${gen}.json`, text);
    console.log(`  gen${gen}: ${(text.length / 1024).toFixed(0)} KB`);
  }
}

async function updateRandbats() {
  console.log('Updating random battle sets...');
  await mkdir('data/randbats', { recursive: true });
  for (let gen = 1; gen <= 9; gen++) {
    const res = await fetch(`${RANDBATS_BASE}/gen${gen}randombattle.json`);
    if (!res.ok) { console.error(`  gen${gen}: HTTP ${res.status}`); continue; }
    const text = await res.text();
    await Bun.write(`data/randbats/gen${gen}.json`, text);
    console.log(`  gen${gen}: ${(text.length / 1024).toFixed(0)} KB`);
  }
}

function updateEvYields() {
  console.log('Updating EV yields...');
  spawnSync('bun', ['run', 'tools/fetch-ev-yields.ts'], { stdio: 'inherit' });
}

await updateSets();
await updateRandbats();
updateEvYields();
console.log('Done.');
