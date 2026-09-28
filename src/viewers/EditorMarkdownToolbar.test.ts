/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { runCrepeMarkdownAction } from "../test/crepeMarkdownTest";
import { toggleList } from "./EditorMarkdownToolbar";

describe("acciones de EditorMarkdownToolbar", () => {
    it("activa la lista de viñetas de todos los elementos seleccionados", async () => {
        const markdown = `
lista [[sencilla

lista sencilla 2

Otra lista sencilla]]
`.trim();

        const expected = `
* lista [[sencilla

* lista sencilla 2

* Otra lista sencilla]]
`.trim();

        const result = await runCrepeMarkdownAction(markdown, (ctx) => toggleList(ctx, "bullet"));

        expect(result.trim()).toBe(expected);
    });

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

    it("activa / desactiva la lista ordenada de todos los elementos seleccionados", async () => {
        const markdown = `
lista [[sencilla

lista sencilla 2

Otra lista sencilla]]
`.trim();

        const expected = `
1. lista [[sencilla
2. lista sencilla 2
3. Otra lista sencilla]]
`.trim();

        const result = await runCrepeMarkdownAction(markdown, (ctx) => toggleList(ctx, "ordered"));

        expect(result.trim()).toBe(expected);

        const result2 = await runCrepeMarkdownAction(expected, (ctx) => toggleList(ctx, "ordered"));

        expect(result2.trim()).toBe(markdown);
    });

    it("activa / desactiva la lista de tareas de todos los elementos seleccionados", async () => {
        const markdown = `
lista [[sencilla

lista sencilla 2

Otra lista sencilla]]
`.trim();

        const expected = `
* [ ] lista [[sencilla

* [ ] lista sencilla 2

* [ ] Otra lista sencilla]]
`.trim();

        const result = await runCrepeMarkdownAction(markdown, (ctx) => toggleList(ctx, "task"));

        expect(result.trim()).toBe(expected);

        const result2 = await runCrepeMarkdownAction(expected, (ctx) => toggleList(ctx, "task"));

        expect(result2.trim()).toBe(markdown);
    });

    it("desactiva lista ordenada con sintaxis variada", async () => {
        const markdown = `
1. numeritos [[1
2. otro elemento no aún
3. numeritos 2 modificación

4) Cuatro]] 4
`.trim();

        const expected = `
numeritos [[1

otro elemento no aún

numeritos 2 modificación

Cuatro]] 4
`.trim();

        const result = await runCrepeMarkdownAction(markdown, (ctx) => toggleList(ctx, "ordered"));

        expect(result.trim()).toBe(expected);
    });
});
