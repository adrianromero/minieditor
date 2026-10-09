/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { describe, expect, it } from "vitest";
import { commandsCtx, editorViewCtx } from "@milkdown/kit/core";
import {
    emphasisSchema,
    inlineCodeSchema,
    strongSchema,
    toggleEmphasisCommand,
    toggleStrongCommand,
} from "@milkdown/kit/preset/commonmark";
import {
    strikethroughSchema,
    toggleStrikethroughCommand,
} from "@milkdown/kit/preset/gfm";
import { NodeSelection } from "@milkdown/kit/prose/state";
import { runCrepeMarkdownAction } from "../test/crepeMarkdownTest";
import {
    getInlineStyleState,
    insertImage,
    insertTypedCodeBlock,
    observeEditorState,
    toggleList,
} from "./EditorMarkdownSidebar";

describe("acciones de EditorMarkdownSidebar", () => {
    it("notifica el cambio del estado de tecleo al pulsar Ctrl+B", async () => {
        await runCrepeMarkdownAction("[[]]Texto", (ctx) => {
            const view = ctx.get(editorViewCtx);
            let observedBold = false;
            const stopObserving = observeEditorState(ctx, () => {
                observedBold = getInlineStyleState(ctx).bold;
            });

            view.dom.dispatchEvent(
                new KeyboardEvent("keydown", {
                    key: "b",
                    ctrlKey: true,
                    bubbles: true,
                })
            );

            expect(getInlineStyleState(ctx).bold).toBe(true);
            expect(observedBold).toBe(true);
            stopObserving();
        });
    });

    it.each([
        ["negrita", "**texto[[]]**", strongSchema, toggleStrongCommand, "bold"],
        ["cursiva", "*texto[[]]*", emphasisSchema, toggleEmphasisCommand, "italic"],
        [
            "tachado",
            "~~texto[[]]~~",
            strikethroughSchema,
            toggleStrikethroughCommand,
            "strikethrough",
        ],
    ] as const)(
        "refleja el estado de tecleo al desactivar %s dentro de texto formateado",
        async (_name, markdown, schema, command, style) => {
            await runCrepeMarkdownAction(markdown, (ctx) => {
                const view = ctx.get(editorViewCtx);

                expect(getInlineStyleState(ctx)[style]).toBe(true);
                ctx.get(commandsCtx).call(command.key);
                expect(view.state.storedMarks).not.toBeNull();
                expect(view.state.storedMarks?.some((mark) => mark.type === schema.type(ctx))).toBe(
                    false
                );
                expect(getInlineStyleState(ctx)[style]).toBe(false);
            });
        }
    );

    it("refleja el estado de tecleo del código en línea", async () => {
        await runCrepeMarkdownAction("`texto[[]]`", (ctx) => {
            const view = ctx.get(editorViewCtx);
            const markType = inlineCodeSchema.type(ctx);

            expect(getInlineStyleState(ctx).code).toBe(true);
            view.dispatch(view.state.tr.removeStoredMark(markType));
            expect(getInlineStyleState(ctx).code).toBe(false);
        });
    });

    it("no trata un nodo de matemática en línea como formato de tecleo", async () => {
        await runCrepeMarkdownAction("Antes [[]]$x$ después", (ctx) => {
            const view = ctx.get(editorViewCtx);
            const mathInline = view.state.schema.nodes.math_inline;
            let mathPosition: number | null = null;

            view.state.doc.descendants((node, position) => {
                if (mathPosition === null && node.type === mathInline) {
                    mathPosition = position;
                }
            });

            expect(mathPosition).not.toBeNull();
            view.dispatch(
                view.state.tr.setSelection(NodeSelection.create(view.state.doc, mathPosition!))
            );
            expect(getInlineStyleState(ctx).math).toBe(false);
        });
    });

    it("inserta una imagen de bloque en un párrafo nuevo vacío", async () => {
        const result = await runCrepeMarkdownAction("Antes\n\n[[]]\n\nDespués", insertImage);

        expect(result).toContain("![1.00]()");
    });

    it("inserta un bloque Mermaid desde la barra lateral", async () => {
        const result = await runCrepeMarkdownAction("Antes[[]]", (ctx) =>
            insertTypedCodeBlock(ctx, "Mermaid")
        );

        expect(result).toContain("```Mermaid\n[[]]\n```");
    });

    it("inserta una imagen en línea dentro de un párrafo con contenido", async () => {
        const result = await runCrepeMarkdownAction("Antes [[texto]] después", insertImage);

        expect(result).toContain("Antes ![]()");
        expect(result).not.toContain("![1.00]()");
    });

    it("inserta una imagen en línea dentro de una celda vacía", async () => {
        const markdown = `
| Columna |
| ------- |
| [[]]    |
`.trim();
        const result = await runCrepeMarkdownAction(markdown, insertImage);

        expect(result).toContain("| ![]()");
        expect(result).not.toContain("![1.00]()");
    });

    it("activa la lista de viñetas de todos los elementos seleccionados", async () => {
        const markdown = `
lista [[sencilla

lista sencilla 2

Otra lista sencilla]]
`.trim();

        const expected = `
- lista [[sencilla

- lista sencilla 2

- Otra lista sencilla]]
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
- [ ] lista [[sencilla

- [ ] lista sencilla 2

- [ ] Otra lista sencilla]]
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

    it("serializa los separadores horizontales con tres guiones", async () => {
        const result = await runCrepeMarkdownAction("[[Texto]]\n\n***", () => undefined);

        expect(result.trim()).toBe("[[Texto]]\n\n---");
    });
});
