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
import { python } from "@codemirror/lang-python";
import { rust } from "@codemirror/lang-rust";
import { sql } from "@codemirror/lang-sql";
import { xml } from "@codemirror/lang-xml";
import { yaml } from "@codemirror/lang-yaml";
import type { LanguageSupport } from "@codemirror/language";
import type { Component } from "solid-js";
import EditorText from "./EditorText";
import EditorMarkdown from "./EditorMarkdown";
import EditorExternalFile from "./EditorExternalFile";
import EditorImage from "./EditorImage";

type FileEditorProps = {
    extensions?: readonly LanguageSupport[];
};

type FileEditorSelection = FileEditorProps & {
    component: Component<FileEditorProps>;
};

export function componentForFilename(filename: string): FileEditorSelection {
    const normalizedFilename = filename.toLowerCase();
    const extensionIndex = normalizedFilename.lastIndexOf(".");
    const extension = extensionIndex >= 0 ? normalizedFilename.slice(extensionIndex) : "";

    switch (extension) {
        case ".md":
            return { component: EditorMarkdown };
        case ".avif":
        case ".bmp":
        case ".gif":
        case ".ico":
        case ".jpeg":
        case ".jpg":
        case ".png":
        case ".webp":
            return { component: EditorImage };
        case ".js":
        case ".mjs":
        case ".cjs":
            return { component: EditorText, extensions: [javascript()] };
        case ".jsx":
            return { component: EditorText, extensions: [javascript({ jsx: true })] };
        case ".ts":
        case ".mts":
        case ".cts":
            return { component: EditorText, extensions: [javascript({ typescript: true })] };
        case ".tsx":
            return {
                component: EditorText,
                extensions: [javascript({ jsx: true, typescript: true })],
            };
        case ".java":
            return { component: EditorText, extensions: [java()] };
        case ".rs":
            return { component: EditorText, extensions: [rust()] };
        case ".py":
        case ".pyi":
        case ".pyw":
            return { component: EditorText, extensions: [python()] };
        case ".html":
        case ".htm":
            return { component: EditorText, extensions: [html()] };
        case ".css":
            return { component: EditorText, extensions: [css()] };
        case ".json":
            return { component: EditorText, extensions: [json()] };
        case ".yaml":
        case ".yml":
            return { component: EditorText, extensions: [yaml()] };
        case ".sql":
            return { component: EditorText, extensions: [sql()] };
        case ".c":
        case ".h":
        case ".cc":
        case ".cpp":
        case ".cxx":
        case ".hh":
        case ".hpp":
        case ".hxx":
            return { component: EditorText, extensions: [cpp()] };
        case ".xml":
        case ".svg":
        case ".xsd":
        case ".xsl":
        case ".xslt":
            return { component: EditorText, extensions: [xml()] };
        case ".txt":
        case ".text":
        case ".log":
        case ".csv":
        case ".tsv":
        case ".ini":
        case ".cfg":
        case ".conf":
        case ".env":
        case ".properties":
        case ".toml":
        case ".gitignore":
            return { component: EditorText };
        default:
            return { component: EditorExternalFile };
    }
}
