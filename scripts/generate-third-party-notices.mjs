/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const packageLock = JSON.parse(readFileSync(resolve(root, "package-lock.json"), "utf8"));

function npmPackage(name) {
    const metadata = packageLock.packages[`node_modules/${name}`];
    if (!metadata) throw new Error(`Package ${name} is missing from package-lock.json`);
    return {
        name,
        version: metadata.version,
        license: metadata.license ?? "UNKNOWN",
    };
}

function renderTable(packages) {
    return [
        "| Component | Version | Declared license |",
        "| --- | ---: | --- |",
        ...packages.map(
            dependency =>
                `| \`${dependency.name}\` | ${dependency.version} | \`${dependency.license}\` |`
        ),
    ].join("\n");
}

const directNpmRuntime = Object.keys(packageJson.dependencies).map(npmPackage);
const directNpmDevelopment = Object.keys(packageJson.devDependencies).map(npmPackage);

const cargoMetadata = JSON.parse(
    execFileSync("cargo", ["metadata", "--format-version", "1", "--locked"], {
        cwd: resolve(root, "src-tauri"),
        encoding: "utf8",
        maxBuffer: 16 * 1024 * 1024,
    })
);
const cargoRoot = cargoMetadata.packages.find(dependency => dependency.name === "minieditor");
if (!cargoRoot) throw new Error("The minieditor Cargo package was not found");
const cargoPackagesById = new Map(cargoMetadata.packages.map(dependency => [dependency.id, dependency]));
const cargoRootNode = cargoMetadata.resolve.nodes.find(node => node.id === cargoRoot.id);
const directCargo = cargoRootNode.deps
    .map(dependency => cargoPackagesById.get(dependency.pkg))
    .filter(Boolean)
    .map(dependency => ({
        name: dependency.name,
        version: dependency.version,
        license: dependency.license ?? "UNKNOWN",
    }));
const fontPackages = [
    ["Open Sans", "@fontsource-variable/open-sans"],
    ["Source Serif 4", "@fontsource-variable/source-serif-4"],
    ["Inter", "@fontsource-variable/inter"],
    ["Literata", "@fontsource-variable/literata"],
].map(([family, packageName]) => {
    const dependency = npmPackage(packageName);
    const license = readFileSync(resolve(root, "node_modules", packageName, "LICENSE"), "utf8");
    return {
        family,
        packageName,
        ...dependency,
        copyright: license.split("\n\n", 1)[0].trim(),
    };
});
const oflLicense = readFileSync(
    resolve(root, "node_modules/@fontsource-variable/open-sans/LICENSE"),
    "utf8"
).replace(/^.*?\n\nThis Font Software/s, "This Font Software");
const lucideLicense = readFileSync(resolve(root, "node_modules/lucide-solid/LICENSE"), "utf8").trim();

const licenseReferences = [
    ["Apache-2.0", "https://www.apache.org/licenses/LICENSE-2.0"],
    ["ISC", "https://spdx.org/licenses/ISC.html"],
    ["MIT", "https://spdx.org/licenses/MIT.html"],
    ["OFL-1.1", "https://openfontlicense.org/open-font-license-official-text/"],
];

const notices = `# Third-party notices

MiniEditor incorporates third-party software, fonts and icons. These components
remain subject to their own licenses. Version and license information below is
derived from direct dependencies declared in \`package.json\` and
\`src-tauri/Cargo.toml\`, with exact versions resolved from the lockfiles.
Transitive dependencies are intentionally outside the scope of this document.
Regenerate it after direct dependency changes with \`npm run notices\`.

An expression containing \`OR\` indicates that the upstream project offers a
choice of licenses; an expression containing \`AND\` requires all listed terms.

## Bundled fonts

MiniEditor self-hosts Latin variable-font subsets supplied by Fontsource. It
does not fetch fonts from a CDN at runtime.

${renderTable(fontPackages)}

${fontPackages.map(font => `- **${font.family}:** ${font.copyright}`).join("\n")}

All four font families are distributed under the SIL Open Font License 1.1:

\`\`\`text
${oflLicense.trim()}
\`\`\`

## Lucide and Feather icons

MiniEditor uses \`lucide-solid@${npmPackage("lucide-solid").version}\`. The
following notice is reproduced verbatim from that package:

\`\`\`text
${lucideLicense}
\`\`\`

## Direct JavaScript runtime dependencies

${renderTable(directNpmRuntime)}

## Direct Rust runtime and build dependencies

${renderTable(directCargo)}

## Direct development and build tools

These packages are used to build, test or document MiniEditor and are not
normally shipped as JavaScript runtime code in the desktop application.

${renderTable(directNpmDevelopment)}

## License references

The tables preserve the exact SPDX-style expressions declared by each direct
dependency. The license texts referenced by those expressions are:

${licenseReferences.map(([license, url]) => `- [${license}](${url})`).join("\n")}

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
\`src/assets/missing-markdown-image.svg\` are maintained as MiniEditor project
assets and are not recorded as third-party resources in this inventory.
`;

writeFileSync(resolve(root, "THIRD_PARTY_NOTICES.md"), notices);
