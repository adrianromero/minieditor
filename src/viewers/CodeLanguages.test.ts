/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { LanguageDescription } from "@codemirror/language";
import { Crepe } from "@milkdown/crepe";
import { codeBlockConfig } from "@milkdown/kit/component/code-block";
import {
    CODE_LANGUAGES,
    configureCodeLanguages,
    editorTextExtensionsForFilename,
} from "./CodeLanguages";

describe("CodeLanguages", () => {
    it("limita el catálogo a los lenguajes compatibles con EditorText", () => {
        expect(CODE_LANGUAGES.map(({ name }) => name)).toEqual([
            "Text",
            "JavaScript",
            "JSX",
            "TypeScript",
            "TSX",
            "Java",
            "Rust",
            "Python",
            "HTML",
            "CSS",
            "JSON",
            "TOML",
            "YAML",
            "SQL",
            "C",
            "C++",
            "XML",
        ]);
    });

    it.each([
        ["script.js", "JavaScript"],
        ["component.tsx", "TSX"],
        ["main.rs", "Rust"],
        ["Cargo.toml", "TOML"],
        ["config.yml", "YAML"],
        ["vector.svg", "XML"],
    ])("selecciona %s como %s", (filename, languageName) => {
        expect(LanguageDescription.matchFilename(CODE_LANGUAGES, filename)?.name).toBe(
            languageName
        );
    });

    it.each(["notes.txt", "server.log", "data.csv", ".env", ".gitignore"])(
        "abre %s sin extensión de resaltado",
        (filename) => {
            expect(editorTextExtensionsForFilename(filename)).toEqual([]);
        }
    );

    it("no considera texto un tipo de archivo desconocido", () => {
        expect(editorTextExtensionsForFilename("archive.bin")).toBeNull();
    });

    it("reemplaza el catálogo predeterminado del bloque de código", async () => {
        const root = document.createElement("div");
        document.body.append(root);
        const crepe = new Crepe({ root });
        crepe.editor.config(configureCodeLanguages);

        try {
            await crepe.create();
            crepe.editor.action((ctx) => {
                expect(ctx.get(codeBlockConfig.key).languages).toEqual(CODE_LANGUAGES);
            });
        } finally {
            await crepe.destroy();
            root.remove();
        }
    });
});
