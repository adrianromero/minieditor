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

export function languageForFilename(filename: string): LanguageSupport | null {
    const normalizedFilename = filename.toLowerCase();
    const extension = normalizedFilename.slice(normalizedFilename.lastIndexOf("."));

    switch (extension) {
        case ".js":
        case ".mjs":
        case ".cjs":
            return javascript();
        case ".jsx":
            return javascript({ jsx: true });
        case ".ts":
        case ".mts":
        case ".cts":
            return javascript({ typescript: true });
        case ".tsx":
            return javascript({ jsx: true, typescript: true });
        case ".java":
            return java();
        case ".rs":
            return rust();
        case ".py":
        case ".pyi":
        case ".pyw":
            return python();
        case ".html":
        case ".htm":
            return html();
        case ".css":
            return css();
        case ".json":
            return json();
        case ".yaml":
        case ".yml":
            return yaml();
        case ".sql":
            return sql();
        case ".c":
        case ".h":
        case ".cc":
        case ".cpp":
        case ".cxx":
        case ".hh":
        case ".hpp":
        case ".hxx":
            return cpp();
        case ".xml":
        case ".svg":
        case ".xsd":
        case ".xsl":
        case ".xslt":
            return xml();
        default:
            return null;
    }
}
