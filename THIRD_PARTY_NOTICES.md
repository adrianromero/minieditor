# Third-party notices

MiniEditor incorporates third-party software, fonts and icons. These components
remain subject to their own licenses. Version and license information below is
derived from direct dependencies declared in `package.json` and
`src-tauri/Cargo.toml`, with exact versions resolved from the lockfiles.
Transitive dependencies are intentionally outside the scope of this document.
Regenerate it after direct dependency changes with `npm run notices`.

An expression containing `OR` indicates that the upstream project offers a
choice of licenses; an expression containing `AND` requires all listed terms.

## Bundled fonts

MiniEditor self-hosts Latin variable-font subsets supplied by Fontsource. It
does not fetch fonts from a CDN at runtime.

| Component | Version | Declared license |
| --- | ---: | --- |
| `@fontsource-variable/open-sans` | 5.3.0 | `OFL-1.1` |
| `@fontsource-variable/source-serif-4` | 5.3.1 | `OFL-1.1` |
| `@fontsource-variable/inter` | 5.3.0 | `OFL-1.1` |
| `@fontsource-variable/literata` | 5.3.0 | `OFL-1.1` |

- **Open Sans:** Copyright 2020 The Open Sans Project Authors (https://github.com/googlefonts/opensans) OpenSans-Italic[wdth,wght].ttf: Copyright 2020 The Open Sans Project Authors (https://github.com/googlefonts/opensans)
- **Source Serif 4:** Google Inc.
- **Inter:** Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter) Inter-Italic[opsz,wght].ttf: Copyright 2016 The Inter Project Authors (https://github.com/rsms/inter)
- **Literata:** Copyright 2017 The Literata Project Authors (https://github.com/googlefonts/literata) Literata-Italic[opsz,wght].ttf: Copyright 2017 The Literata Project Authors (https://github.com/googlefonts/literata)

All four font families are distributed under the SIL Open Font License 1.1:

```text
This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## Lucide and Feather icons

MiniEditor uses `lucide-solid@1.47.0`. The
following notice is reproduced verbatim from that package:

```text
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Direct JavaScript runtime dependencies

| Component | Version | Declared license |
| --- | ---: | --- |
| `@codemirror/lang-cpp` | 6.0.3 | `MIT` |
| `@codemirror/lang-css` | 6.3.1 | `MIT` |
| `@codemirror/lang-html` | 6.4.12 | `MIT` |
| `@codemirror/lang-java` | 6.0.2 | `MIT` |
| `@codemirror/lang-javascript` | 6.2.5 | `MIT` |
| `@codemirror/lang-json` | 6.0.2 | `MIT` |
| `@codemirror/lang-markdown` | 6.5.2 | `MIT` |
| `@codemirror/lang-python` | 6.2.1 | `MIT` |
| `@codemirror/lang-rust` | 6.0.2 | `MIT` |
| `@codemirror/lang-sql` | 6.10.0 | `MIT` |
| `@codemirror/lang-xml` | 6.1.0 | `MIT` |
| `@codemirror/lang-yaml` | 6.1.3 | `MIT` |
| `@codemirror/language` | 6.12.4 | `MIT` |
| `@codemirror/legacy-modes` | 6.5.4 | `MIT` |
| `@codemirror/search` | 6.7.2 | `MIT` |
| `@codemirror/view` | 6.43.12 | `MIT` |
| `@fontsource-variable/inter` | 5.3.0 | `OFL-1.1` |
| `@fontsource-variable/literata` | 5.3.0 | `OFL-1.1` |
| `@fontsource-variable/open-sans` | 5.3.0 | `OFL-1.1` |
| `@fontsource-variable/source-serif-4` | 5.3.1 | `OFL-1.1` |
| `@lezer/highlight` | 1.2.5 | `MIT` |
| `@milkdown/crepe` | 7.21.2 | `MIT` |
| `@milkdown/kit` | 7.21.2 | `MIT` |
| `@solid-primitives/i18n` | 2.2.1 | `MIT` |
| `@tauri-apps/api` | 2.11.1 | `Apache-2.0 OR MIT` |
| `@tauri-apps/plugin-opener` | 2.5.4 | `MIT OR Apache-2.0` |
| `codemirror` | 6.0.2 | `MIT` |
| `lucide-solid` | 1.47.0 | `ISC` |
| `mermaid` | 11.17.2 | `MIT` |
| `prosemirror-search` | 1.1.1 | `MIT` |
| `solid-js` | 1.9.13 | `MIT` |

## Direct Rust runtime and build dependencies

| Component | Version | Declared license |
| --- | ---: | --- |
| `clap` | 4.6.6 | `MIT OR Apache-2.0` |
| `serde` | 1.0.228 | `MIT OR Apache-2.0` |
| `serde_json` | 1.0.150 | `MIT OR Apache-2.0` |
| `tauri` | 2.11.3 | `Apache-2.0 OR MIT` |
| `tauri-build` | 2.6.3 | `Apache-2.0 OR MIT` |
| `tauri-plugin-opener` | 2.5.4 | `Apache-2.0 OR MIT` |
| `tokio` | 1.52.3 | `MIT` |
| `toml` | 0.9.12+spec-1.1.0 | `MIT OR Apache-2.0` |
| `tracing` | 0.1.44 | `MIT` |
| `tracing-subscriber` | 0.3.23 | `MIT` |

## Direct development and build tools

These packages are used to build, test or document MiniEditor and are not
normally shipped as JavaScript runtime code in the desktop application.

| Component | Version | Declared license |
| --- | ---: | --- |
| `@storybook/addon-a11y` | 10.6.1 | `MIT` |
| `@storybook/addon-docs` | 10.6.1 | `MIT` |
| `@tauri-apps/cli` | 2.11.3 | `Apache-2.0 OR MIT` |
| `jsdom` | 28.1.0 | `MIT` |
| `storybook` | 10.6.1 | `MIT` |
| `storybook-solidjs-vite` | 10.7.2 | `MIT` |
| `typescript` | 5.6.3 | `Apache-2.0` |
| `vite` | 6.4.3 | `MIT` |
| `vite-plugin-solid` | 2.11.12 | `MIT` |
| `vitest` | 5.0.2 | `MIT` |

## License references

The tables preserve the exact SPDX-style expressions declared by each direct
dependency. The license texts referenced by those expressions are:

- [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [ISC](https://spdx.org/licenses/ISC.html)
- [MIT](https://spdx.org/licenses/MIT.html)
- [OFL-1.1](https://openfontlicense.org/open-font-license-official-text/)

Exact copyright notices and license files distributed by each dependency remain
authoritative. They are available in the corresponding npm package or Cargo
crate identified above.

## External toolchains and system runtimes

The following third-party tools or operating-system components are used during
development or at runtime but are not redistributed by MiniEditor as application
assets: Node.js, npm, the Rust toolchain (rustc, Cargo and rustup), WebKitGTK on
Linux, WKWebView/WebKit on macOS, and Microsoft Edge WebView2 on Windows. Their
licenses and notices are supplied by their respective distributors.

## Project-owned artwork

The MiniEditor logo, generated application icons and
`src/assets/missing-markdown-image.svg` are maintained as MiniEditor project
assets and are not recorded as third-party resources in this inventory.
