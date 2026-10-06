/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/kit/core";
import { NodeSelection } from "@milkdown/kit/prose/state";
import { describe, expect, it } from "vitest";
import {
    imageNavigationHref,
    imageSourceFromDOM,
    navigableImageFromTarget,
    updateImageSourceFromDOM,
} from "./MarkdownImageNavigation";

async function sourceFromMarkdown(markdown: string, selector: string): Promise<string | null> {
    const root = document.createElement("div");
    document.body.append(root);
    const crepe = new Crepe({ root, defaultValue: markdown });

    try {
        await crepe.create();
        const image = root.querySelector(selector);
        if (!image) {
            return null;
        }

        let source: string | null = null;
        crepe.editor.action((ctx) => {
            source = imageSourceFromDOM(ctx.get(editorViewCtx), image);
        });
        return source;
    } finally {
        await crepe.destroy();
        root.remove();
    }
}

describe("imageSourceFromDOM", () => {
    it("recupera el enlace original de una imagen de bloque", async () => {
        await expect(
            sourceFromMarkdown(
                "![1.00](./images/my%20image.png)",
                ".milkdown-image-block img"
            )
        ).resolves.toBe("./images/my%20image.png");
    });

    it("recupera el enlace original de una imagen en línea", async () => {
        await expect(
            sourceFromMarkdown(
                "Texto ![imagen](./inline.png) texto",
                ".milkdown-image-inline img"
            )
        ).resolves.toBe("./inline.png");
    });

    it("recupera el enlace original de una imagen dentro de una tabla", async () => {
        const markdown = "| Imagen |\n| --- |\n| ![imagen](./table.png) |";

        await expect(
            sourceFromMarkdown(markdown, ".milkdown-image-inline img")
        ).resolves.toBe("./table.png");
    });
});

describe("navigableImageFromTarget", () => {
    it.each([
        ["![1.00](./block.png)", '.milkdown-image-block img[data-type="image-block"]'],
        ["Texto ![imagen](./inline.png)", ".milkdown-image-inline img.image-inline"],
    ])("detecta la imagen navegable renderizada por Milkdown", async (markdown, selector) => {
        const root = document.createElement("div");
        document.body.append(root);
        const crepe = new Crepe({ root, defaultValue: markdown });

        try {
            await crepe.create();
            const image = root.querySelector(selector);
            expect(image).not.toBeNull();
            expect(navigableImageFromTarget(image!, root)).toBe(image);
            expect(navigableImageFromTarget(image!.parentElement!, root)).toBe(image);
        } finally {
            await crepe.destroy();
            root.remove();
        }
    });
});

describe("updateImageSourceFromDOM", () => {
    it.each([
        [
            "![1.00](./old-block.png)",
            ".milkdown-image-block img",
            "./new-block.png",
            "![1.00](./new-block.png)",
        ],
        [
            "Texto ![imagen](./old-inline.png)",
            ".milkdown-image-inline img",
            "./new-inline.png",
            "Texto ![imagen](./new-inline.png)",
        ],
    ])(
        "actualiza y serializa el enlace de la imagen",
        async (markdown, selector, source, expected) => {
            const root = document.createElement("div");
            document.body.append(root);
            const crepe = new Crepe({ root, defaultValue: markdown });

            try {
                await crepe.create();
                const image = root.querySelector(selector);
                expect(image).not.toBeNull();

                crepe.editor.action((ctx) => {
                    const view = ctx.get(editorViewCtx);
                    expect(
                        updateImageSourceFromDOM(view, image!, source)
                    ).toBe(true);
                    expect(view.state.selection).toBeInstanceOf(NodeSelection);
                    expect(view.state.doc.nodeAt(view.state.selection.from)?.attrs.src).toBe(
                        source
                    );
                });

                expect(crepe.getMarkdown().trim()).toBe(expected);
            } finally {
                await crepe.destroy();
                root.remove();
            }
        }
    );
});

describe("imageNavigationHref", () => {
    it("decodifica la ruta local y elimina query y fragmento", () => {
        expect(imageNavigationHref("./my%20image.png?v=2#preview")).toBe("./my image.png");
    });

    it.each([
        "https://example.com/image.png?v=2#preview",
        "data:image/png;base64,AA==",
        "blob:http://localhost/id",
    ])("mantiene el esquema de %s para que Rust decida cómo abrirlo", (source) => {
        expect(imageNavigationHref(source)).toBe(source);
    });
});
