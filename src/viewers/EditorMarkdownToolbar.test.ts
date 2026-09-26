/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { runCrepeMarkdownAction } from "../test/crepeMarkdownTest";
import { toggleList } from "./EditorMarkdownToolbar";

describe("acciones de EditorMarkdownToolbar", () => {
    it("quita la lista de viñetas de todos los elementos seleccionados", async () => {
        const markdown = `
* lista [[sencilla

* lista sencilla 2

* Otra lista sencilla]]
`.trim();

        const expected = `
lista [[sencilla

lista sencilla 2

Otra lista sencilla]]
`.trim();

        const result = await runCrepeMarkdownAction(markdown, (ctx) => toggleList(ctx, "bullet"));

        expect(result.trim()).toBe(expected);
    });
});
