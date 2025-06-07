import { name, version, description, homepage } from '../package.json'
import { writeFile } from 'fs/promises'
import { join, resolve } from 'path'

import { emptyDir } from 'fs-extra/esm'

async function create_desktop_entry() {
    const desktopEntryContent = `[Desktop Entry]
Name=StudIP
Exec=/usr/bin/studip %U
Terminal=false
Type=Application
Icon=studip
StartupWMClass=StudIP
Comment=${description}
Categories=Education;`

    return writeFile(join('dist', 'studip.desktop'), desktopEntryContent, 'utf-8')
}

async function create_wrapper() {
    const wrapperContent = `#! /usr/bin/env sh
electron /usr/share/${name}/main`

    return writeFile(join('dist', 'studip-wrapper'), wrapperContent, 'utf-8')
}

async function create_pkgbuild() {
    const pkgbuildText = `# Maintainer: Katharina Dröge <kate@commandmc.de>
pkgname=${name}
pkgver=${version}
pkgrel=1
pkgdesc="${description}"
arch=(x86_64)
url=${homepage}
license=("GPL-3.0-only")
depends=('electron')
makedepends=('nodejs')
source=(
    "$pkgname::git+file://${resolve(__dirname)}"
    "$pkgname-wrapper"
    "$pkgname.desktop"
)
sha256sums=('SKIP' 'SKIP' 'SKIP')

pkgver() {
    cd "$pkgname"
    printf "r%s.%s" "$(git rev-list --count HEAD)" "$(git rev-parse --short HEAD)"
}

build() {
    cd "$pkgname"
    corepack enable
    pnpm install
    pnpm build
}

package()
{
    mkdir -p "$pkgdir/usr/share/"
    cp -r "$srcdir/$pkgname/out" "$pkgdir/usr/share/$pkgname"
    install -Dm755 "$pkgname-wrapper" "$pkgdir/usr/bin/$pkgname"
    install -Dm644 "$srcdir/$pkgname/LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
    install -Dm644 "$srcdir/$pkgname/assets/icon_white.png" "$pkgdir/usr/share/icons/hicolor/256x256/apps/studip.png"
    install -Dm644 "$srcdir/$pkgname/assets/icon_white.svg" "$pkgdir/usr/share/icons/hicolor/scalable/apps/studip.svg"
    install -Dm644 "$pkgname.desktop" "$pkgdir/usr/share/applications/$pkgname.desktop"
}`

    return writeFile(join('dist', 'PKGBUILD'), pkgbuildText, 'utf-8')
}

async function main() {
    await emptyDir('dist')

    return Promise.all([create_desktop_entry(), create_wrapper(), create_pkgbuild()])
}

main().catch(console.error)
