#!/bin/sh
set -e

VERSION=$(curl -fsSL https://api.github.com/repos/luvcie/starmie-cli/releases/latest | grep '"tag_name"' | sed 's/.*"tag_name": *"v\([^"]*\)".*/\1/')

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  linux)  OS="linux" ;;
  darwin) OS="macos" ;;
  *)      echo "Unsupported OS: $OS" && exit 1 ;;
esac

case "$ARCH" in
  x86_64)          ARCH="x64" ;;
  aarch64 | arm64) ARCH="arm64" ;;
  *)               echo "Unsupported architecture: $ARCH" && exit 1 ;;
esac

BINARY="starmie-cli-${OS}-${ARCH}"
URL="https://github.com/luvcie/starmie-cli/releases/download/v${VERSION}/${BINARY}"
INSTALL_DIR="$HOME/.local/bin"

mkdir -p "$INSTALL_DIR"

echo "Downloading starmie-cli ${VERSION}..."
curl -fsSL "$URL" -o "$INSTALL_DIR/starmie-cli"
chmod +x "$INSTALL_DIR/starmie-cli"

echo "Installed to $INSTALL_DIR/starmie-cli"

case ":$PATH:" in
  *":$INSTALL_DIR:"*)
    echo "Done! Run: starmie-cli"
    ;;
  *)
    SHELL_RC=""
    case "$SHELL" in
      */zsh)  SHELL_RC="$HOME/.zshrc" ;;
      */bash) SHELL_RC="$HOME/.bashrc" ;;
    esac
    if [ -n "$SHELL_RC" ]; then
      echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$SHELL_RC"
      echo "Added $INSTALL_DIR to PATH in $SHELL_RC."
      echo "Open a new terminal or run: source $SHELL_RC"
    else
      echo "$INSTALL_DIR is not in your PATH. Add it manually to use starmie-cli."
    fi
    ;;
esac
