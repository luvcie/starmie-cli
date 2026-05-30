# Submitting starmie-cli to nixpkgs

`nixpkgs-package.nix` is the draft derivation. It builds from source with
`buildNpmPackage` (no bun2nix), compiles a standalone binary with
`bun build --compile`, and patches only the interpreter on Linux. The resulting
closure is ~150MB (just the binary + glibc), and each platform is built natively
on Hydra.

## Why this shape

- `bun build --compile` glues the app's code onto the end of the bun runtime and
  finds it at runtime by reading itself. Stripping or autopatchelf rewrites the
  file and breaks that, so `dontStrip` / `dontPatchELF` are set and only the
  interpreter is patched. The binary needs nothing beyond glibc.
- npm dependencies are fetched reproducibly via `npmDepsHash`. The repo ships a
  `package-lock.json` (generated with `npm install --ignore-scripts`) for this.

## Steps

1. Cut a release that contains `package-lock.json` (already committed), so the
   GitHub tarball has it.
2. In a nixpkgs checkout, copy this file to
   `pkgs/by-name/st/starmie-cli/package.nix`.
3. Set `version`, then get the source hash:
   `nix-prefetch-github luvcie starmie-cli --rev v<version>`
   and replace `lib.fakeHash`.
4. If dependencies changed, refresh `npmDepsHash`:
   `nix run nixpkgs#prefetch-npm-deps -- package-lock.json`
5. Add your nixpkgs handle to `meta.maintainers`.
6. Build and test: `nix-build -A starmie-cli`, run `result/bin/starmie-cli`.
7. Open the PR. `passthru.updateScript` (nix-update) keeps version + hashes
   current after merge.
