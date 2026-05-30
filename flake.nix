{
  description = "Pokémon Showdown info commands in your terminal";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    systems.url = "github:nix-systems/default";

    bun2nix.url = "github:nix-community/bun2nix?ref=2.1.0";
    bun2nix.inputs.nixpkgs.follows = "nixpkgs";
    bun2nix.inputs.systems.follows = "systems";
  };

  nixConfig = {
    extra-substituters = [ "https://nix-community.cachix.org" ];
    extra-trusted-public-keys = [
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  outputs = inputs:
    let
      eachSystem = inputs.nixpkgs.lib.genAttrs (import inputs.systems);
      pkgsFor = eachSystem (system:
        import inputs.nixpkgs {
          inherit system;
          overlays = [ inputs.bun2nix.overlays.default ];
        });
    in {
      packages = eachSystem (system:
        let
          pkgs = pkgsFor.${system};
          binSources = import ./nix/bin-sources.nix;
          assetForSystem = {
            "x86_64-linux" = "starmie-cli-linux-x64";
            "aarch64-linux" = "starmie-cli-linux-arm64";
            "x86_64-darwin" = "starmie-cli-macos-x64";
            "aarch64-darwin" = "starmie-cli-macos-arm64";
          };

          # Prebuilt binary pulled from the GitHub release. This is the default.
          #
          # The binary is a bun --compile executable: the JS payload is appended
          # after the ELF and found at runtime via /proc/self/exe. Stripping or
          # rewriting the ELF (autoPatchelfHook, the default strip/patchELF
          # fixups) corrupts that payload and the binary falls back to acting
          # like plain bun. dontStrip/dontPatchELF disable those; only the
          # interpreter is set, which is the one thing a glibc NixOS system
          # needs. bun's binary links nothing beyond glibc, so no extra rpath
          # is required.
          bin = pkgs.stdenvNoCC.mkDerivation {
            pname = "starmie-cli-bin";
            version = binSources.version;

            src = pkgs.fetchurl {
              url = "https://github.com/luvcie/starmie-cli/releases/download/v${binSources.version}/${assetForSystem.${system}}";
              hash = binSources.hashes.${system};
            };

            dontUnpack = true;
            dontStrip = true;
            dontPatchELF = true;

            nativeBuildInputs = pkgs.lib.optionals pkgs.stdenv.isLinux [ pkgs.patchelf ];

            installPhase = ''
              runHook preInstall
              install -Dm755 $src $out/bin/starmie-cli
              ${pkgs.lib.optionalString pkgs.stdenv.isLinux ''
                patchelf --set-interpreter "$(cat ${pkgs.stdenv.cc}/nix-support/dynamic-linker)" $out/bin/starmie-cli
              ''}
              runHook postInstall
            '';

            meta = with pkgs.lib; {
              description = "Pokémon Showdown info commands in your terminal (prebuilt binary)";
              homepage = "https://github.com/luvcie/starmie-cli";
              license = licenses.mit;
              maintainers = [ ];
              mainProgram = "starmie-cli";
              platforms = builtins.attrNames assetForSystem;
            };
          };

          # Build from source with bun2nix. Heavier (pulls a build toolchain),
          # but doesn't trust any prebuilt artifact.
          source = pkgs.bun2nix.mkDerivation {
            packageJson = ./package.json;

            src = pkgs.lib.cleanSourceWith {
              src = ./.;
              filter = name: type:
                !(type == "directory" && baseNameOf name == "node_modules");
            };

            bunDeps = pkgs.bun2nix.fetchBunDeps {
              bunNix = ./bun.nix;
            };

            nativeBuildInputs = [ pkgs.makeWrapper ];

            dontUseBunBuild = true;
            bunInstallFlags = [ "--linker=isolated" "--omit=dev" ];

            installPhase = ''
              runHook preInstall

              mkdir -p $out/share/starmie-cli $out/bin

              cp starmie-cli.ts tsconfig.json $out/share/starmie-cli/
              cp -r src $out/share/starmie-cli/
              cp -r data $out/share/starmie-cli/
              cp -r node_modules $out/share/starmie-cli/

              makeWrapper ${pkgs.bun}/bin/bun $out/bin/starmie-cli \
                --add-flags "run $out/share/starmie-cli/starmie-cli.ts"

              runHook postInstall
            '';

            meta = with pkgs.lib; {
              description = "Pokémon Showdown info commands in your terminal";
              homepage = "https://github.com/luvcie/starmie-cli";
              license = licenses.mit;
              maintainers = [ ];
              mainProgram = "starmie-cli";
              platforms = platforms.linux ++ platforms.darwin;
            };
          };

          # Build from source with buildNpmPackage, then compile a standalone
          # binary with `bun build --compile`. No bun2nix, light closure
          # (~150MB). This mirrors the nixpkgs derivation in nix/, so building
          # it here keeps that submission path tested.
          compiled = pkgs.buildNpmPackage {
            pname = "starmie-cli";
            version = (builtins.fromJSON (builtins.readFile ./package.json)).version;

            src = pkgs.lib.cleanSourceWith {
              src = ./.;
              filter = name: type:
                !(type == "directory" && baseNameOf name == "node_modules");
            };

            npmDepsHash = "sha256-StSwHoUHdTZfopT2r0Jx1z8P1I9PIp0MhEIH+9NmMr0=";

            dontNpmBuild = true;
            npmFlags = [ "--ignore-scripts" ];

            nativeBuildInputs = [ pkgs.bun ]
              ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [ pkgs.darwin.autoSignDarwinBinariesHook ];

            dontStrip = true;
            dontPatchELF = true;

            buildPhase = ''
              runHook preBuild
              bun build --compile starmie-cli.ts --outfile starmie-cli
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              install -Dm755 starmie-cli $out/bin/starmie-cli
              ${pkgs.lib.optionalString pkgs.stdenv.isLinux ''
                patchelf --set-interpreter "$(cat ${pkgs.stdenv.cc}/nix-support/dynamic-linker)" $out/bin/starmie-cli
              ''}
              runHook postInstall
            '';

            meta = with pkgs.lib; {
              description = "Pokémon Showdown info commands in your terminal";
              homepage = "https://github.com/luvcie/starmie-cli";
              license = licenses.mit;
              maintainers = [ ];
              mainProgram = "starmie-cli";
              platforms = platforms.linux ++ platforms.darwin;
            };
          };
        in {
          inherit bin source compiled;
          default = bin;
        });

      devShells = eachSystem (system:
        let pkgs = pkgsFor.${system}; in {
          # bun2nix is in package.json devDependencies, so `bunx bun2nix -o bun.nix`
          # works after `bun install` without needing the Rust build here.
          default = pkgs.mkShell {
            packages = with pkgs; [ bun ];
          };
        });
    };
}
