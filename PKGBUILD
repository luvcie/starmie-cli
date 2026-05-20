# Maintainer: luvcie <lucielove9@proton.me>
pkgname=starmie-cli
pkgver=0.1.0
pkgrel=1
pkgdesc="Pokémon Showdown info commands in your terminal"
arch=('any')
url="https://github.com/luvcie/starmie-cli"
license=('MIT')
depends=('bun')
makedepends=('bun')
source=("$pkgname-$pkgver.tar.gz::https://github.com/luvcie/$pkgname/archive/v$pkgver.tar.gz")
b2sums=('SKIP')

build() {
    cd "$pkgname-$pkgver"
    bun install --frozen-lockfile --ignore-scripts
    rm -rf node_modules/.bin
}

package() {
    cd "$pkgname-$pkgver"

    install -dm755 "$pkgdir/usr/share/starmie-cli"
    cp -r starmie-cli.ts tsconfig.json src node_modules "$pkgdir/usr/share/starmie-cli/"

    install -dm755 "$pkgdir/usr/bin"
    cat > "$pkgdir/usr/bin/starmie-cli" <<'EOF'
#!/bin/sh
exec bun run /usr/share/starmie-cli/starmie-cli.ts "$@"
EOF
    chmod 755 "$pkgdir/usr/bin/starmie-cli"

    install -Dm644 LICENSE "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
}
