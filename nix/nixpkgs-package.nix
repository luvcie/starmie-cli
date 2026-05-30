# Draft of the nixpkgs package, to be copied to
# pkgs/by-name/st/starmie-cli/package.nix in a nixpkgs checkout.
#
# Before submitting, fill in src.hash (from a release tag that contains
# package-lock.json) and bump npmDepsHash if dependencies change. Both are
# handled automatically by nix-update / the passthru.updateScript.
{
  lib,
  stdenv,
  buildNpmPackage,
  fetchFromGitHub,
  bun,
  darwin,
  nix-update-script,
}:

buildNpmPackage (finalAttrs: {
  pname = "starmie-cli";
  version = "1.11.0";

  src = fetchFromGitHub {
    owner = "luvcie";
    repo = "starmie-cli";
    tag = "v${finalAttrs.version}";
    hash = lib.fakeHash; # nix-prefetch-github luvcie starmie-cli --rev v<version>
  };

  npmDepsHash = "sha256-StSwHoUHdTZfopT2r0Jx1z8P1I9PIp0MhEIH+9NmMr0=";

  # The CLI runs TypeScript through bun directly; there is no JS build step.
  # The standalone binary is produced with `bun build --compile` in buildPhase.
  dontNpmBuild = true;
  npmFlags = [ "--ignore-scripts" ];

  nativeBuildInputs =
    [ bun ]
    ++ lib.optionals stdenv.hostPlatform.isDarwin [ darwin.autoSignDarwinBinariesHook ];

  # A `bun --compile` executable appends its JS payload after the ELF and finds
  # it at runtime via /proc/self/exe. Stripping or autopatchelf rewrites the
  # file and moves that payload out of reach, so the binary falls back to
  # running as the bun runtime. Only the interpreter needs setting on Linux;
  # the binary links nothing beyond glibc.
  dontStrip = true;
  dontPatchELF = true;

  buildPhase = ''
    runHook preBuild
    bun build --compile starmie-cli.ts --outfile starmie-cli
    runHook postBuild
  '';

  installPhase =
    ''
      runHook preInstall
      install -Dm755 starmie-cli $out/bin/starmie-cli
    ''
    + lib.optionalString stdenv.hostPlatform.isLinux ''
      patchelf --set-interpreter "$(cat ${stdenv.cc}/nix-support/dynamic-linker)" $out/bin/starmie-cli
    ''
    + ''
      runHook postInstall
    '';

  passthru.updateScript = nix-update-script { };

  meta = {
    description = "Pokémon Showdown info commands in your terminal";
    homepage = "https://github.com/luvcie/starmie-cli";
    license = lib.licenses.mit;
    mainProgram = "starmie-cli";
    maintainers = with lib.maintainers; [ ]; # add your nixpkgs handle here
    platforms = [
      "x86_64-linux"
      "aarch64-linux"
      "x86_64-darwin"
      "aarch64-darwin"
    ];
  };
})
