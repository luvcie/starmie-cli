# Pokescope

> A terminal tool for looking up Pokemon data: type effectiveness, move compatibility, dex searches, stat calc, and more. Mostly Pokemon Showdown's lookup commands ported to the terminal, with a few personal additions.

I liked the lookup commands in [Pokemon Showdown](https://github.com/smogon/pokemon-showdown)'s chat and wanted them in my terminal, mainly for using while I play PokeMMO.

It's made in TypeScript because it uses the [`@pkmn/sim`](https://www.npmjs.com/package/@pkmn/sim) npm package directly, all the data (type charts, learnsets, tier info, move descriptions) comes from there, so updating the dependency is enough to get new Pokemon, tier changes, etc that pokemon showdown might add in the future.

Why not Go, Rust, Gleam, etc.? Because pokemon showdown isn't just data on pokemon, moves, items, etc., there's also a lot of logic (learnset validation, format rules, type effectiveness with abilities and items, etc.), and reimplementing all that and keeping it in sync with every Showdown update is way more work than just letting `bun update` handle it.

Runs on [Bun](https://bun.sh), which executes TypeScript directly with no build step. The Nix package ships the source and a small wrapper that invokes `bun run`, and the mise package installs a precompiled binary.

It uses [`@pkmn/sim`](https://www.npmjs.com/package/@pkmn/sim) from [Modular Pokémon Showdown](https://github.com/pkmn), a slimmer extraction of [pokemon showdown](https://github.com/smogon/pokemon-showdown)'s data, simulator, and team validator. Nix builds go through [`bun2nix`](https://github.com/nix-community/bun2nix) for per-package reproducibility.

`@pkmn/sim` is also published much more often than the `pokemon-showdown` npm package (every couple of weeks vs years between releases), so competitive users get tier moves, format changes, and item description updates pretty quickly.

Also thanks to my fren William for helping me choose the name. :)

## Install

[Nix](#nix) · [mise](#mise) · [curl](#curl) · [From source](#from-source)

### Nix

Run temporarily, without installing:
```
nix run github:luvcie/pokescope
```

To install permanently:
```
nix profile add github:luvcie/pokescope
```

To update:
```
nix profile upgrade pokescope
```

Or add to your flake:
```nix
inputs.pokescope.url = "github:luvcie/pokescope";

# then in environment.systemPackages / home.packages:
inputs.pokescope.packages.${system}.default
```

### mise

Works on Linux, macOS, and Windows. Install [mise](https://mise.jdx.dev) then:
```
mise use -g github:luvcie/pokescope
```

To update:
```
mise upgrade github:luvcie/pokescope
```

On Windows, mise's shims aren't on PATH by default. To add them for the current session:
```powershell
$env:Path += ";$env:LOCALAPPDATA\mise\shims"
```
To add them permanently (requires restarting PowerShell after):
```powershell
Add-Content $PROFILE "`nmise activate pwsh | Out-String | Invoke-Expression"
```

### curl

**Linux and macOS:**
```sh
curl -fsSL https://raw.githubusercontent.com/luvcie/pokescope/main/install.sh | sh
```

To uninstall: `rm ~/.local/bin/pokescope`

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/luvcie/pokescope/main/install.ps1 | iex
```

To uninstall:
```powershell
Remove-Item "$env:LOCALAPPDATA\pokescope" -Recurse -Force
$p = [Environment]::GetEnvironmentVariable('Path', 'User')
[Environment]::SetEnvironmentVariable('Path', $p.Replace(";$env:LOCALAPPDATA\pokescope", ''), 'User')
```

### From source

Requires [Bun](https://bun.sh).

```
git clone https://github.com/luvcie/pokescope
cd pokescope
bun install
bun link
```

## Usage

Interactive REPL:
```
pokescope
```

Or directly:
```
pokescope weakness charizard
pokescope dexsearch fire, ou
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
| `chain` | evolution chain for a Pokemon, with evo methods |
| `moves` | full learnset for a Pokemon, grouped by method (level-up, TM, egg, tutor...) |
| `sets` | competitive sets for a Pokemon from Smogon, grouped by tier |
| `randompokemon` | random Pokemon, optionally filtered by dexsearch criteria |
| `randommove` | random move, optionally filtered by movesearch criteria |
| `randomquote` | a random Pokemon quote (not from Showdown, just something I added) |

All commands support a `[gen]` prefix (e.g. `gen4`, `adv`, `bw`) to query older generations. Type `help` inside the REPL for full usage and examples.

Not all commands are from Pokemon Showdown: `evyield`, `evspread`, `nature`, `ability`, `team`, `compare`, `counter`, `chain`, `moves`, `sets`, and `randomquote` are custom additions of mine. :)

## Updating data

Note to future me:

```
bun update @pkmn/sim
bun run update-data
bunx bun2nix -o bun.nix
git add package.json bun.lock bun.nix data/ && git commit -m "chore: bump data"
```

`bun update @pkmn/sim` updates the sim/dex data. `bun run update-data` re-fetches the Smogon sets (from pkmn.github.io) and EV yields (from PokéAPI) and writes them to `data/`.
