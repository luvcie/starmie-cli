# starmie-cli

> A terminal tool for looking up Pokemon data: type effectiveness, move compatibility, dex searches, stat calc, and more. Mostly Pokemon Showdown's lookup commands ported to the terminal, with a few personal additions.

I liked the lookup commands in [Pokemon Showdown](https://github.com/smogon/pokemon-showdown)'s chat and wanted them in my terminal, mainly for using while I play PokeMMO.

It's made in TypeScript because it uses the [`@pkmn/sim`](https://www.npmjs.com/package/@pkmn/sim) npm package directly, all the data (type charts, learnsets, tier info, move descriptions) comes from there, so updating the dependency is enough to get new Pokemon, tier changes, etc that pokemon showdown might add in the future.

Why not Go, Rust, Gleam, etc.? Because pokemon showdown isn't just data on pokemon, moves, items, etc., there's also a lot of logic (learnset validation, format rules, type effectiveness with abilities and items, etc.), and reimplementing all that and keeping it in sync with every Showdown update is way more work than just letting `bun update` handle it.

Runs on [Bun](https://bun.sh), which executes TypeScript directly with no build step. The Nix package ships the source and a small wrapper that invokes `bun run`, and the mise package installs a precompiled binary.

It uses [`@pkmn/sim`](https://www.npmjs.com/package/@pkmn/sim) from [Modular Pokémon Showdown](https://github.com/pkmn), a slimmer extraction of [pokemon showdown](https://github.com/smogon/pokemon-showdown)'s data, simulator, and team validator. Nix builds go through [`bun2nix`](https://github.com/nix-community/bun2nix) for per-package reproducibility.

`@pkmn/sim` is also published much more often than the `pokemon-showdown` npm package (every couple of weeks vs years between releases), so competitive users get tier moves, format changes, and item description updates pretty quickly.

The interactive REPL is built with [Ink](https://github.com/vadimdemedes/ink). It does fish-style ghost suggestions from your command history, tab cycling, and persistent history saved to `~/.config/starmie-cli/history`.

Why the name starmie-cli? Because this was developed during summer, I dreamed the name, starmie kind of looks like a compass rose, and also it sounds like my real life name. :)

## Install

[curl](#curl) · [Nix](#nix) · [mise](#mise) · [From source](#from-source)

### curl

**Linux and macOS:**
```sh
curl -fsSL https://raw.githubusercontent.com/luvcie/starmie-cli/main/install.sh | sh
```

To uninstall: `rm ~/.local/bin/starmie-cli`

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/luvcie/starmie-cli/main/install.ps1 | iex
```

To uninstall: `Remove-Item "$env:LOCALAPPDATA\starmie-cli" -Recurse -Force`

<small>To update to latest version, re-run the install command.</small>

### Nix

Run temporarily, without installing:
```
nix run github:luvcie/starmie-cli
```

To install permanently:
```
nix profile add github:luvcie/starmie-cli
```

To update:
```
nix profile upgrade starmie-cli
```

Or add to your flake:
```nix
inputs.starmie-cli.url = "github:luvcie/starmie-cli";

# then in environment.systemPackages / home.packages:
inputs.starmie-cli.packages.${system}.default
```

### mise

Works on Linux, macOS, and Windows. Install [mise](https://mise.jdx.dev) then:
```
mise use -g github:luvcie/starmie-cli
```

To update:
```
mise upgrade github:luvcie/starmie-cli
```

On Windows, mise's shims aren't on PATH by default. To add them permanently (requires restarting PowerShell after):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Add-Content $PROFILE "`nmise activate pwsh | Out-String | Invoke-Expression"
```
If you see a warning about `chpwd` requiring PowerShell 7, silence it with:
```powershell
[Environment]::SetEnvironmentVariable('MISE_PWSH_CHPWD_WARNING', '0', 'User')
```

### From source

Requires [Bun](https://bun.sh).

```
git clone https://github.com/luvcie/starmie-cli
cd starmie-cli
bun install
bun link
```

## Usage

Interactive REPL:
```
starmie-cli
```

Or directly:
```
starmie-cli weakness charizard
starmie-cli dexsearch fire, ou
```

## Commands

| command | description |
|---|---|
| `weakness` | weaknesses, resistances, and immunities for a Pokemon or type combo |
| `eff` | type effectiveness of a move or type against a target |
| `coverage` | best type coverage for up to 4 moves |
| `data` | Pokedex entry for a Pokemon, move, item, ability, or nature |
| `learn` | check if a Pokemon can learn a move (or combo), and how |
| `dexsearch` | search Pokemon by type, tier, stats, ability, moves, egg group, and more |
| `movesearch` | search moves by type, category, BP, flags, boosts, and more |
| `itemsearch` | search items by description keywords |
| `statcalc` | calculate a final stat value from base stat, EVs, IVs, nature, and modifier |
| `nature` | stat changes for a nature, or list all 25 natures |
| `counter` | types that resist a move or type; optionally filter to your team |
| `compare` | side-by-side base stat comparison for two Pokemon |
| `team` | team weakness analysis: shared weaknesses and uncovered types |
| `ability` | list all Pokemon with a given ability, grouped by regular vs hidden |
| `evspread` | list all Pokemon that give EVs in a stat, grouped by yield amount |
| `evyield` | EV yield when defeating a Pokemon |
| `evo` | evolution chain for a Pokemon, with evo methods (aliases: `evochain`, `chain`) |
| `moves` | full learnset for a Pokemon, grouped by method (level-up, TM, egg, tutor...) |
| `sets` | competitive sets for a Pokemon from Smogon, grouped by tier |
| `randompokemon` | random Pokemon, optionally filtered by dexsearch criteria |
| `randommove` | random move, optionally filtered by movesearch criteria |
| `randomquote` | a random Pokemon quote (not from Showdown, just something I added) |

All commands support a `[gen]` prefix (e.g. `gen4`, `adv`, `bw`) to query older generations. Type `help` inside the REPL for full usage and examples.

Not all commands are from Pokemon Showdown: `evyield`, `evspread`, `nature`, `ability`, `team`, `compare`, `counter`, `evo`, `moves`, `sets`, and `randomquote` are custom additions of mine. :)

## Updating data

Note to future me:

```
bun update @pkmn/sim
bun run update-data
bunx bun2nix -o bun.nix
git add package.json bun.lock bun.nix data/ && git commit -m "chore: bump data"
```

`bun update @pkmn/sim` updates the sim/dex data. `bun run update-data` re-fetches the Smogon sets (from pkmn.github.io) and EV yields (from PokéAPI) and writes them to `data/`.
