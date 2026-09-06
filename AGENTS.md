# AI Agent Instructions (AGENTS.md)

This document defines the context, conventions, and rules for any AI agent or assistant (Gemini, Cursor, Copilot, etc.) interacting with this repository.

## 🎯 Project Purpose
This is a lightweight desktop Markdown editor application built using Tauri 2.0.

## 🛠️ Tech Stack & Tools
- **Backend:** Rust, Tauri 2.0 (using standard capability configurations)
- **Frontend:** SolidJS, Vite, TypeScript, Vanilla CSS
- **Editor Core:** Milkdown Crepe
- **Package Manager:** npm

## 🧑‍💻 Code Style & Conventions
1. **Strict Typing:** All TypeScript and SolidJS components must be strongly typed. Avoid using `any` unless absolutely necessary.
2. **Modular Architecture:** Maintain SolidJS components in clean files under `src/` and place custom Tauri command definitions in `src-tauri/src/lib.rs`.
3. **Tauri 2.0 Security:** Make sure custom commands are properly registered in `src-tauri/src/lib.rs` and frontend permissions are declared in the capability files inside `src-tauri/capabilities/`.

## 🚀 Script & Build Commands
Use `npm` for all project scripts. Command suggestions should follow this formatting:
- Run in development mode: `npm run tauri dev`
- Build production assets: `npm run tauri build`
