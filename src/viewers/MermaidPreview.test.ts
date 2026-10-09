/*
 * Copyright (c) 2026 Adrián Romero
 * SPDX-License-Identifier: MIT
 */

import type { CodeBlockConfig } from "@milkdown/kit/component/code-block";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMermaidPreviewRenderer } from "./MermaidPreview";

type PreviewRenderer = CodeBlockConfig["renderPreview"];

afterEach(() => {
    document.body.replaceChildren();
});

function createRenderer(render: (id: string, content: string) => Promise<{ svg: string }>) {
    const fallback: PreviewRenderer = vi.fn(() => "fallback");
    const load = async () => ({ render }) as never;
    const renderer = createMermaidPreviewRenderer(
        fallback,
        { loading: "Cargando...", errorText: "Diagrama no válido" },
        load
    );
    return { fallback, renderer };
}

describe("MermaidPreview", () => {
    it("delega los demás lenguajes al renderizador anterior", () => {
        const { fallback, renderer } = createRenderer(vi.fn());
        const applyPreview = vi.fn();

        expect(renderer("LaTeX", "x^2", applyPreview)).toBe("fallback");
        expect(fallback).toHaveBeenCalledWith("LaTeX", "x^2", applyPreview);
    });

    it("no muestra vista previa para un bloque Mermaid vacío", () => {
        const render = vi.fn();
        const { renderer } = createRenderer(render);

        expect(renderer("mermaid", "   ", vi.fn())).toBeNull();
        expect(render).not.toHaveBeenCalled();
    });

    it("renderiza Mermaid de forma asíncrona", async () => {
        const render = vi.fn(async () => ({ svg: '<svg aria-label="diagram"></svg>' }));
        const { renderer } = createRenderer(render);
        const applyPreview = vi.fn();
        const placeholder = renderer("Mermaid", "graph TD; A-->B;", applyPreview);

        expect(placeholder).toBeInstanceOf(HTMLElement);
        document.body.append(placeholder as HTMLElement);

        await vi.waitFor(() => {
            expect(applyPreview).toHaveBeenCalledWith('<svg aria-label="diagram"></svg>');
        });
        expect(render).toHaveBeenCalledWith(
            expect.stringMatching(/^minieditor-mermaid-diagram-/),
            "graph TD; A-->B;"
        );
    });

    it("muestra de forma segura los errores de sintaxis", async () => {
        const render = vi.fn(async () => {
            throw new Error("Unexpected <script>alert(1)</script>\nmore details");
        });
        const { renderer } = createRenderer(render);
        const applyPreview = vi.fn();
        const placeholder = renderer("mermaid", "not a diagram", applyPreview);
        document.body.append(placeholder as HTMLElement);

        await vi.waitFor(() => expect(applyPreview).toHaveBeenCalledOnce());
        const error = applyPreview.mock.calls[0]?.[0];
        expect(error).toBeInstanceOf(HTMLElement);
        expect((error as HTMLElement).textContent).toContain(
            "Diagrama no válido: Unexpected <script>alert(1)</script>"
        );
        expect((error as HTMLElement).querySelector("script")).toBeNull();
    });

    it("descarta un resultado si su vista previa ya fue reemplazada", async () => {
        let finishFirstRender: ((value: { svg: string }) => void) | undefined;
        const render = vi
            .fn()
            .mockImplementationOnce(
                () =>
                    new Promise<{ svg: string }>((resolve) => {
                        finishFirstRender = resolve;
                    })
            )
            .mockResolvedValueOnce({ svg: "<svg>new</svg>" });
        const { renderer } = createRenderer(render);
        const firstApply = vi.fn();
        const secondApply = vi.fn();
        const first = renderer("mermaid", "graph TD; A-->B;", firstApply) as HTMLElement;
        document.body.append(first);
        const second = renderer("mermaid", "graph TD; A-->C;", secondApply) as HTMLElement;
        first.replaceWith(second);

        await vi.waitFor(() => expect(finishFirstRender).toBeTypeOf("function"));
        finishFirstRender?.({ svg: "<svg>old</svg>" });

        await vi.waitFor(() => expect(secondApply).toHaveBeenCalledWith("<svg>new</svg>"));
        expect(firstApply).not.toHaveBeenCalled();
    });
});

