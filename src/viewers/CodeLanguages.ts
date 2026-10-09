/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import { LanguageDescription, LanguageSupport, StreamLanguage } from "@codemirror/language";
import { stex } from "@codemirror/legacy-modes/mode/stex";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { codeBlockConfig } from "@milkdown/kit/component/code-block";
import type { Ctx } from "@milkdown/kit/ctx";
import { createMermaidPreviewRenderer } from "./MermaidPreview";

const PLAIN_TEXT_LANGUAGE_NAME = "Text";
const plainTextSupport = new LanguageSupport(
    StreamLanguage.define({
        name: "text",
        token: (stream) => {
            stream.skipToEnd();
            return null;
        },
    })
);

export const CODE_LANGUAGES: readonly LanguageDescription[] = [
    LanguageDescription.of({
        name: PLAIN_TEXT_LANGUAGE_NAME,
        alias: ["plain", "plaintext"],
        extensions: [
            "txt",
            "text",
            "log",
            "csv",
            "tsv",
            "ini",
            "cfg",
            "conf",
            "env",
            "properties",
            "gitignore",
        ],
        support: plainTextSupport,
    }),
    LanguageDescription.of({
        name: "JavaScript",
        alias: ["js", "node"],
        extensions: ["js", "mjs", "cjs"],
        support: javascript(),
    }),
    LanguageDescription.of({
        name: "JSX",
        extensions: ["jsx"],
        support: javascript({ jsx: true }),
    }),
    LanguageDescription.of({
        name: "TypeScript",
        alias: ["ts"],
        extensions: ["ts", "mts", "cts"],
        support: javascript({ typescript: true }),
    }),
    LanguageDescription.of({
        name: "TSX",
        extensions: ["tsx"],
        support: javascript({ jsx: true, typescript: true }),
    }),
    LanguageDescription.of({ name: "Java", extensions: ["java"], support: java() }),
    LanguageDescription.of({ name: "Rust", alias: ["rs"], extensions: ["rs"], support: rust() }),
    LanguageDescription.of({
        name: "Python",
        alias: ["py"],
        extensions: ["py", "pyi", "pyw"],
        support: python(),
    }),
    LanguageDescription.of({
        name: "HTML",
        extensions: ["html", "htm"],
        support: html(),
    }),
    LanguageDescription.of({ name: "CSS", extensions: ["css"], support: css() }),
    LanguageDescription.of({ name: "JSON", extensions: ["json"], support: json() }),
    LanguageDescription.of({
        name: "Mermaid",
        alias: ["mmd"],
        extensions: ["mmd", "mermaid"],
        support: plainTextSupport,
    }),
    LanguageDescription.of({
        name: "Markdown",
        alias: ["md"],
        extensions: ["md", "markdown", "mdown", "mkd"],
        support: markdown(),
    }),
    LanguageDescription.of({
        name: "LaTeX",
        alias: ["tex"],
        extensions: ["tex", "latex"],
        support: new LanguageSupport(StreamLanguage.define(stex)),
    }),
    LanguageDescription.of({
        name: "TOML",
        extensions: ["toml"],
        support: new LanguageSupport(StreamLanguage.define(toml)),
    }),
    LanguageDescription.of({
        name: "YAML",
        alias: ["yml"],
        extensions: ["yaml", "yml"],
        support: yaml(),
    }),
    LanguageDescription.of({ name: "SQL", extensions: ["sql"], support: sql() }),
    LanguageDescription.of({ name: "C", extensions: ["c", "h"], support: cpp() }),
    LanguageDescription.of({
        name: "C++",
        alias: ["cpp"],
        extensions: ["cc", "cpp", "cxx", "hh", "hpp", "hxx"],
        support: cpp(),
    }),
    LanguageDescription.of({
        name: "XML",
        extensions: ["xml", "svg", "xsd", "xsl", "xslt"],
        support: xml(),
    }),
];

export function editorTextExtensionsForFilename(
    filename: string
): readonly LanguageSupport[] | null {
    const language = LanguageDescription.matchFilename(CODE_LANGUAGES, filename);
    if (!language) {
        return null;
    }

    if (language.name === PLAIN_TEXT_LANGUAGE_NAME) {
        return [];
    }

    return language.support ? [language.support] : null;
}

export function configureCodeLanguages(previewErrorText: string): (ctx: Ctx) => void {
    return (ctx) => {
        ctx.update(codeBlockConfig.key, (config) => ({
            ...config,
            languages: [...CODE_LANGUAGES],
            renderPreview: createMermaidPreviewRenderer(config.renderPreview, {
                loading: config.previewLoading,
                errorText: previewErrorText,
            }),
        }));
    };
}
