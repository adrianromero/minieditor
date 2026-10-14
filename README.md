# Plunibio

![0.33](./plunibio-logo.png)

A lightweight desktop Markdown editor built with Tauri, SolidJS, and Mikldown Crepe.

> 🔵 Plunibio is under active development. Features and interfaces may change before the first stable release.

## Features

- Visual Markdown editing powered by [Milkdown Crepe](https://milkdown.dev/).

- Browse files and folders without leaving the application.

- Breadcrumb navigation relative to a configurable base directory.

- Unsaved-change indicator and in-place file saving.

- Open a missing file as a new empty document and create it on first save.

- Reload a file from disk after confirming that current content changes can be discarded.

- Global loading feedback for asynchronous operations.

- English and Spanish user interfaces selected from the system locale.

- Base-directory boundary checks in the Rust backend.

## Technology

| Area            | Technology                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| Desktop runtime | [Tauri 2](https://v2.tauri.app/)                                                                              |
| Frontend        | [SolidJS](https://www.solidjs.com/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vite.dev/) |
| Editor          | [Milkdown Crepe](https://milkdown.dev/)                                                                       |
| Backend         | [Rust](https://www.rust-lang.org/), [Tokio](https://tokio.rs/)                                                |

## Prerequisites

Install the following before building Plunibio:

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

To select a base directory explicitly, pass it with `--base-path`:

```bash
npm run tauri -- dev -- -- --base-path /absolute/path/to/markdown/files
```

The extra separators are required because npm and the Tauri CLI each process their own arguments.

## Command-line usage

The packaged executable accepts an optional relative filename and an optional base path:

```text
plunibio [FILENAME] [--base-path BASEPATH]
```

- `FILENAME` is a file or folder path relative to the base path. Absolute paths and paths containing `..` are rejected.

- A selected `FILENAME` that does not exist opens as an empty, unsaved document. An explicit save creates the file even while it is empty; navigating away from an untouched empty document does not create it.

- Reloading discards current content changes. If the file does not exist, it reloads as an empty document and remains marked unsaved because it has not yet been created.

- `BASEPATH` must identify an existing directory. It may be absolute or relative; a relative base path is resolved against the process working directory.

- When `FILENAME` is omitted, Plunibio restores the last filename opened for that base path. If the base path has no saved filename, it opens with no selected filename.

- When `BASEPATH` is omitted, Plunibio uses the process working directory.

- When both are omitted, Plunibio uses the process working directory and restores its saved filename when available.

- The selected base path is canonicalized before the application starts.

The arguments resolve as follows:

| Arguments provided                | Filename                                                | Base path                                              |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Neither                           | Last saved filename for the working directory, or empty | Process working directory                              |
| `FILENAME` only                   | Relative file or folder path                            | Process working directory                              |
| `--base-path BASEPATH` only       | Last saved filename for `BASEPATH`, or empty            | `BASEPATH`                                             |
| Both, with an absolute `BASEPATH` | Relative file or folder path                            | Absolute `BASEPATH`                                    |
| Both, with a relative `BASEPATH`  | Relative file or folder path                            | `BASEPATH` resolved from the process working directory |

On a normal shutdown, Plunibio stores the last filename for the current canonical base path in `~/.plunibio/properties.toml`, alongside the window dimensions. An explicitly supplied `FILENAME` always takes precedence over the saved value. Configuration read, window sizing, and configuration write failures are logged without displaying an error to the user.

Examples:

```bash
plunibio
plunibio README.md
plunibio guides
plunibio --base-path /home/user/Documents/notes
plunibio daily/today.md --base-path ./notes
```

Run `plunibio --help` to display the built-in command-line help.

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

Regenerate all application icons from `plunibio-logo.png` with:

```bash
npm run tauri icon plunibio-logo.png
```

## Contributing

Contributions and bug reports are welcome. Before submitting a pull request:

1. Open an issue for substantial changes so the approach can be discussed first.
2. Keep changes focused and follow the existing TypeScript and Rust style.
3. Add or update documentation when behavior changes.
4. Run the validation commands listed above.
5. Describe what changed and how it was tested in the pull request.

Use GitHub Issues to report bugs, request features, or ask project-related questions. Include the operating system, Plunibio version, reproduction steps, and relevant logs when reporting a bug.

## License

Plunibio is released under the [MIT License](./LICENSE).

Copyright (c) 2026 Adrián Romero.

Third-party dependencies and assets remain subject to their respective licenses.
