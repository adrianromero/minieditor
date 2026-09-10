<p align="center">
  <img src="./minieditor-logo.png" width="160" alt="MiniEditor logo">
</p>

<h1 align="center">MiniEditor</h1>

<p align="center">
  A lightweight desktop Markdown editor built with Tauri, SolidJS, and Milkdown Crepe.
</p>

> [!NOTE]
> MiniEditor is under active development. Features and interfaces may change before the first stable release.

## Features

- Visual Markdown editing powered by [Milkdown Crepe](https://milkdown.dev/).
- Browse files and folders without leaving the application.
- Breadcrumb navigation relative to a configurable base directory.
- Unsaved-change indicator and in-place file saving.
- Global loading feedback for asynchronous operations.
- English and Spanish user interfaces selected from the system locale.
- Base-directory boundary checks in the Rust backend.

## Technology

| Area | Technology |
| --- | --- |
| Desktop runtime | [Tauri 2](https://v2.tauri.app/) |
| Frontend | [SolidJS](https://www.solidjs.com/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/) |
| Editor | [Milkdown Crepe](https://milkdown.dev/) |
| Backend | [Rust](https://www.rust-lang.org/), [Tokio](https://tokio.rs/) |

## Prerequisites

Install the following before building MiniEditor:

- A current [Node.js](https://nodejs.org/) LTS release and npm.
- The stable Rust toolchain through [rustup](https://rustup.rs/).
- The platform dependencies listed in the [Tauri prerequisites guide](https://v2.tauri.app/start/prerequisites/).

## Getting started

Clone or fork the repository, then install the locked npm dependencies from its root directory:

```bash
npm ci
```

Start the application in development mode using the process working directory as its base directory:

```bash
npm run tauri dev
```

To select a base directory explicitly, pass it as the application's first positional argument. An absolute path is recommended:

```bash
npm run tauri -- dev -- -- /absolute/path/to/markdown/files
```

The extra separators are required because npm and the Tauri CLI each process their own arguments.

## Command-line usage

The packaged executable accepts one optional positional argument:

```text
minieditor [BASEPATH]
```

- `BASEPATH` must identify an existing directory.
- Relative paths are accepted and resolved against the process working directory.
- When omitted, MiniEditor uses the process working directory.
- The selected path is canonicalized before the application starts.

Examples:

```bash
minieditor /home/user/Documents/notes
minieditor ./notes
minieditor
```

Run `minieditor --help` to display the built-in command-line help.

## Building

Create an optimized application bundle with:

```bash
npm run tauri build
```

Platform-specific bundles are written under:

```text
src-tauri/target/release/bundle/
```

To build only the frontend assets:

```bash
npm run build
```

## Development

The main source directories are:

```text
src/                    SolidJS application and styles
src/i18n/               English and Spanish translations
src-tauri/src/          Rust application and Tauri commands
src-tauri/capabilities/ Tauri security capabilities
```

Useful validation commands:

```bash
npm run build
cargo check --manifest-path src-tauri/Cargo.toml
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
```

Regenerate all application icons from `minieditor-logo.png` with:

```bash
npm run tauri icon minieditor-logo.png
```

## Security model

MiniEditor treats `BASEPATH` as the root of the accessible file tree. Filenames exchanged with the frontend are relative to that directory. The Rust backend rejects absolute filenames, parent-directory traversal, and resolved paths outside the configured base directory.

Do not use MiniEditor to open untrusted Markdown files until the project has completed a dedicated security review.

## Contributing

Contributions and bug reports are welcome. Before submitting a pull request:

1. Open an issue for substantial changes so the approach can be discussed first.
2. Keep changes focused and follow the existing TypeScript and Rust style.
3. Add or update documentation when behavior changes.
4. Run the validation commands listed above.
5. Describe what changed and how it was tested in the pull request.

Use GitHub Issues to report bugs, request features, or ask project-related questions. Include the operating system, MiniEditor version, reproduction steps, and relevant logs when reporting a bug.

## License

MiniEditor is released under the [MIT License](./LICENSE).

Copyright (c) 2026 Adrián Romero.

Third-party dependencies and assets remain subject to their respective licenses.
