/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { componentForFilename } from "./ComponentForFile";
import EditorMarkdown from "./EditorMarkdown";
import EditorText from "./EditorText";

describe("componentForFilename", () => {
    it.each(["README.md", "notes.markdown", "draft.mdown", "document.mkd"])(
        "abre %s con EditorMarkdown",
        (filename) => {
            expect(componentForFilename(filename).component).toBe(EditorMarkdown);
        }
    );

    it("abre los archivos LaTeX con EditorText", () => {
        const selection = componentForFilename("formula.tex");

        expect(selection.component).toBe(EditorText);
        expect(selection.extensions).toHaveLength(1);
    });
});
